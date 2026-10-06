import { Router } from 'express';
import auth from '../middleware/auth.js';
import DailyTask from '../models/DailyTask.js';
import DailyScore from '../models/DailyScore.js';
import { dateKey } from '../utils/date.js';
import { scoreToday } from '../utils/sync.js';
import { refreshGameStats } from '../services/game.service.js';

const r = Router();

// ── GET /api/dashboard — today's summary ─────────────────────────────────────
r.get('/', auth, async (req, res) => {
  try {
    const payload = await scoreToday(req.user._id);
    res.json({ ...payload, date: dateKey() });
  } catch (err) {
    console.error('[GET /dashboard]', err);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

// ── GET /api/dashboard/progress — chart + lifetime stats ────────────────────
r.get('/progress', auth, async (req, res) => {
  try {
    const scores = await DailyScore.find({ userId: req.user._id }).sort({ date: 1 }).lean();
    const { user, completedTasks } = await refreshGameStats(req.user._id);
    const last30  = scores.slice(-30).map(s => ({
      date: s.date, score: s.score, completedTasks: s.completedTasks, totalTasks: s.totalTasks,
    }));
    const average = scores.length
      ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length * 10) / 10
      : 0;
    res.json({
      user: {
        username:      user.username,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalXP:       user.totalXP,
        level:         user.level,
        perfectDays:   user.perfectDays,
      },
      average,
      completedTasks,
      history: last30,
    });
  } catch (err) {
    console.error('[GET /dashboard/progress]', err);
    res.status(500).json({ message: 'Failed to load progress' });
  }
});

// ── GET /api/dashboard/history — last 120 days with per-day tasks ────────────
r.get('/history', auth, async (req, res) => {
  try {
    const scores = await DailyScore.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(120)
      .lean();

    const days = await Promise.all(
      scores.map(async s => ({
        ...s,
        tasks: await DailyTask.find({ userId: req.user._id, date: s.date })
          .sort({ createdAt: 1 })
          .lean(),
      }))
    );
    res.json({ days });
  } catch (err) {
    console.error('[GET /dashboard/history]', err);
    res.status(500).json({ message: 'Failed to load history' });
  }
});

export default r;
