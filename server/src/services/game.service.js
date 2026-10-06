import User from '../models/User.js';
import DailyScore from '../models/DailyScore.js';
import Achievement from '../models/Achievement.js';
import { dateKey, addDays } from '../utils/date.js';

export const ACHIEVEMENTS = [
  { id: 'first-step',    title: 'First Step',        icon: '🥶', description: 'Complete your first tracked day.' },
  { id: 'three-day',     title: '3 Day Streak',       icon: '🔥', description: 'Reach a 3 day discipline streak.' },
  { id: 'seven-day',     title: '7 Day Warrior',      icon: '⚔️', description: 'Reach a 7 day discipline streak.' },
  { id: 'perfect-day',   title: 'Perfect Day',        icon: '💯', description: 'Score 10/10 in a day.' },
  { id: 'ten-day',       title: '10 Day Discipline',  icon: '🗿', description: 'Reach a 10 day discipline streak.' },
  { id: 'thirty-day',    title: 'Winter Warrior',     icon: '❄️', description: 'Reach a 30 day discipline streak.' },
  { id: 'hundred-tasks', title: '100 Tasks',          icon: '🚀', description: 'Complete 100 tasks.' },
];

export async function refreshGameStats(userId) {
  const scores    = await DailyScore.find({ userId }).sort({ date: 1 });
  const qualifying = scores.filter(s => s.score >= 7.5).map(s => s.date);

  // Use a Set for O(1) lookup → fixes O(n²) streak calculation
  const qualSet = new Set(qualifying);

  // ── Longest streak ────────────────────────────────────────────────────────
  let longest  = 0;
  let run      = 0;
  let previous = null;
  for (const day of qualifying) {
    run     = previous && addDays(previous, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }

  // ── Current streak — anchored to real today, not last DB entry ────────────
  // Allow the streak to still count if today hasn't been scored yet
  // (yesterday was a qualifying day → streak is still alive today).
  const todayStr     = dateKey();
  const yesterdayStr = addDays(todayStr, -1);

  let startCursor = null;
  if (qualSet.has(todayStr))     startCursor = todayStr;
  else if (qualSet.has(yesterdayStr)) startCursor = yesterdayStr;

  let current = 0;
  let cursor  = startCursor;
  while (cursor && qualSet.has(cursor)) {
    current++;
    const prev = addDays(cursor, -1);
    cursor = qualSet.has(prev) ? prev : null;
  }

  // ── XP / level / perfect days ─────────────────────────────────────────────
  const totalXP    = scores.reduce((sum, s) => sum + (s.xpEarned || 0), 0);
  const perfectDays = scores.filter(s => s.score === 10).length;
  const level       = Math.max(1, Math.floor(totalXP / 500) + 1);

  const user = await User.findByIdAndUpdate(
    userId,
    { currentStreak: current, longestStreak: longest, totalXP, level, perfectDays },
    { new: true }
  );

  // ── Achievement unlocks ───────────────────────────────────────────────────
  const completedTasks = scores.reduce((sum, s) => sum + (s.completedTasks || 0), 0);
  const unlockedIds    = [];
  if (scores.length >= 1)                           unlockedIds.push('first-step');
  if (perfectDays >= 1)                             unlockedIds.push('perfect-day');
  if (current >= 3  || longest >= 3)                unlockedIds.push('three-day');
  if (current >= 7  || longest >= 7)                unlockedIds.push('seven-day');
  if (current >= 10 || longest >= 10)               unlockedIds.push('ten-day');
  if (current >= 30 || longest >= 30)               unlockedIds.push('thirty-day');
  if (completedTasks >= 100)                        unlockedIds.push('hundred-tasks');

  if (unlockedIds.length) {
    await Achievement.bulkWrite(
      unlockedIds.map(id => ({
        updateOne: {
          filter: { userId, achievementId: id },
          update: { $setOnInsert: { userId, achievementId: id } },
          upsert: true,
        },
      }))
    );
  }

  return { user, completedTasks, unlockedIds };
}
