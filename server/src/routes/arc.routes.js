import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import DailyScore from '../models/DailyScore.js';
import ArcCycle from '../models/ArcCycle.js';
import { dateKey, addDays } from '../utils/date.js';

const r = Router();

const GOALS = ['Fitness', 'Studies', 'Coding', 'Career', 'Reading', 'Sleep', 'Mindset', 'Custom'];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
}

/**
 * Helper to ensure user's active cycle is initialized and monthly rollovers occur.
 * Each cycle lasts 30 days (1 month). If the 30 days pass, the active cycle completes,
 * and a new cycle automatically refreshes for the current month.
 */
async function syncUserCycle(user) {
  const today = dateKey();
  let activeCycle = await ArcCycle.findOne({ userId: user._id, status: 'active' }).sort({ cycleNumber: -1 });

  // If no cycle in ArcCycle collection, migrate from user document if exists, or create cycle #1
  if (!activeCycle) {
    const totalCount = await ArcCycle.countDocuments({ userId: user._id });
    const cycleNumber = totalCount + 1;
    const start = user.arcStartDate || today;
    const end = addDays(start, 29);
    const goal = user.arcGoal || 'Fitness';

    activeCycle = await ArcCycle.create({
      userId: user._id,
      cycleNumber,
      goal,
      startDate: start,
      endDate: end,
      status: today > end ? 'completed' : 'active',
    });

    if (activeCycle.status === 'completed') {
      // Refresh new cycle for this month
      const newCycleNumber = cycleNumber + 1;
      const newStart = today;
      const newEnd = addDays(newStart, 29);
      activeCycle = await ArcCycle.create({
        userId: user._id,
        cycleNumber: newCycleNumber,
        goal,
        startDate: newStart,
        endDate: newEnd,
        status: 'active',
      });
      await User.findByIdAndUpdate(user._id, { arcStartDate: newStart, arcGoal: goal });
    } else {
      await User.findByIdAndUpdate(user._id, { arcStartDate: start, arcGoal: goal });
    }
  } else {
    // Check if the 30-day (1 month) period of active cycle has completed
    if (today > activeCycle.endDate) {
      activeCycle.status = 'completed';
      await activeCycle.save();

      // Automatically refresh new cycle for this month
      const newCycleNumber = activeCycle.cycleNumber + 1;
      const newStart = today;
      const newEnd = addDays(newStart, 29);
      activeCycle = await ArcCycle.create({
        userId: user._id,
        cycleNumber: newCycleNumber,
        goal: activeCycle.goal,
        startDate: newStart,
        endDate: newEnd,
        status: 'active',
      });

      await User.findByIdAndUpdate(user._id, { arcStartDate: newStart, arcGoal: activeCycle.goal });
    }
  }

  return activeCycle;
}

// ── GET /api/arc — current active ARC cycle & past cycle histories ────────────
r.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user.arcStartDate) {
      return res.json({ started: false, goals: GOALS, days: [], histories: [] });
    }

    const currentCycle = await syncUserCycle(user);
    const start = currentCycle.startDate;

    // Fetch scores for current cycle (30 days)
    const scores = await DailyScore.find({
      userId: user._id,
      date: { $gte: start, $lte: currentCycle.endDate },
    }).sort({ date: 1 }).lean();

    const byDate = Object.fromEntries(scores.map(s => [s.date, s]));
    const days = [];
    for (let i = 0; i < 30; i++) {
      const d = addDays(start, i);
      days.push({
        day:            i + 1,
        date:           d,
        score:          byDate[d]?.score ?? null,
        completedTasks: byDate[d]?.completedTasks ?? 0,
        totalTasks:     byDate[d]?.totalTasks ?? 0,
      });
    }

    // Past completed cycles for history inspection
    const pastCycles = await ArcCycle.find({
      userId: user._id,
      status: 'completed',
    }).sort({ cycleNumber: -1 }).lean();

    const histories = await Promise.all(
      pastCycles.map(async c => {
        const cycleScores = await DailyScore.find({
          userId: user._id,
          date: { $gte: c.startDate, $lte: c.endDate },
        }).sort({ date: 1 }).lean();

        const completedDays = cycleScores.filter(s => (s.score ?? 0) >= 7.5).length;
        const totalLogged = cycleScores.filter(s => s.score !== null).length;
        const avgScore = totalLogged
          ? Math.round((cycleScores.reduce((acc, s) => acc + (s.score || 0), 0) / totalLogged) * 10) / 10
          : 0;

        return {
          cycleNumber: c.cycleNumber,
          goal: c.goal,
          startDate: c.startDate,
          endDate: c.endDate,
          completedDays,
          avgScore,
          days: cycleScores,
        };
      })
    );

    res.json({
      started: true,
      cycleNumber: currentCycle.cycleNumber,
      startDate: currentCycle.startDate,
      endDate: currentCycle.endDate,
      goal: currentCycle.goal,
      goals: GOALS,
      days,
      histories,
    });
  } catch (err) {
    console.error('[GET /arc]', err);
    res.status(500).json({ message: 'Failed to load ARC' });
  }
});

// ── POST /api/arc/start — start first cycle or update current goal ────────────
r.post(
  '/start',
  auth,
  [
    body('goal')
      .optional()
      .trim()
      .isIn(GOALS).withMessage('Invalid goal — must be one of: ' + GOALS.join(', ')),
    body('startDate')
      .optional()
      .trim()
      .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Invalid start date format (use YYYY-MM-DD)'),
  ],
  validate,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).lean();
      const { goal = 'Custom', startDate } = req.body;
      const start = startDate || dateKey();
      const end = addDays(start, 29);

      let active = await ArcCycle.findOne({ userId: user._id, status: 'active' });
      if (!active) {
        const count = await ArcCycle.countDocuments({ userId: user._id });
        active = await ArcCycle.create({
          userId: user._id,
          cycleNumber: count + 1,
          goal,
          startDate: start,
          endDate: end,
          status: 'active',
        });
      } else {
        active.goal = goal;
        await active.save();
      }

      await User.findByIdAndUpdate(req.user._id, { arcStartDate: active.startDate, arcGoal: goal });

      res.json({
        started: true,
        cycleNumber: active.cycleNumber,
        startDate: active.startDate,
        endDate: active.endDate,
        goal: active.goal,
      });
    } catch (err) {
      console.error('[POST /arc/start]', err);
      res.status(500).json({ message: 'Failed to start ARC' });
    }
  }
);

export default r;
