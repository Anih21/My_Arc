import DailyTask from '../models/DailyTask.js';
import DailyScore from '../models/DailyScore.js';
import Task from '../models/Task.js';
import { dateKey } from './date.js';
import { refreshGameStats } from '../services/game.service.js';

/**
 * Ensures every active task for a user has a DailyTask row for today.
 * Returns today's full DailyTask list sorted by creation time.
 */
export async function syncToday(userId) {
  const date = dateKey();
  const active = await Task.find({ userId, active: true });
  if (active.length) {
    await DailyTask.bulkWrite(
      active.map(t => ({
        updateOne: {
          filter: { userId, date, taskId: t._id },
          update: { $setOnInsert: { title: t.title, completed: false } },
          upsert: true,
        },
      }))
    );
  }
  return DailyTask.find({ userId, date }).sort({ createdAt: 1 });
}

/**
 * Recalculates the score for today, persists a DailyScore record,
 * calls refreshGameStats, and returns the full dashboard payload.
 */
export async function scoreToday(userId) {
  const date = dateKey();
  const list = await syncToday(userId);
  const total = list.length;
  const completed = list.filter(x => x.completed).length;
  const value = total ? Math.round((completed / total * 10) * 10) / 10 : 0;
  const xp = Math.round(value * 10);

  await DailyScore.findOneAndUpdate(
    { userId, date },
    { totalTasks: total, completedTasks: completed, score: value, xpEarned: xp },
    { upsert: true, new: true }
  );

  const stats = await refreshGameStats(userId);
  return {
    tasks: list.map(x => ({ id: x.taskId, title: x.title, completed: x.completed })),
    total,
    completed,
    score: value,
    user: {
      username:      stats.user.username,
      currentStreak: stats.user.currentStreak,
      longestStreak: stats.user.longestStreak,
      totalXP:       stats.user.totalXP,
      level:         stats.user.level,
      perfectDays:   stats.user.perfectDays,
      arcStartDate:  stats.user.arcStartDate || null,
      arcGoal:       stats.user.arcGoal || null,
    },
  };
}
