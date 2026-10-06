import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';
import Task from '../models/Task.js';
import DailyTask from '../models/DailyTask.js';
import { dateKey } from '../utils/date.js';
import { syncToday, scoreToday } from '../utils/sync.js';

const r = Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
}

// ── GET /api/tasks — list all active tasks with today's status ──────────────
r.get('/', auth, async (req, res) => {
  try {
    const todayList = await syncToday(req.user._id);
    const completedMap = new Map(todayList.map(item => [String(item.taskId), item.completed]));

    const tasks = await Task.find({ userId: req.user._id, active: true }).sort({ createdAt: 1 }).lean();
    const tasksWithStatus = tasks.map(t => ({
      ...t,
      completed: !!completedMap.get(String(t._id)),
    }));

    res.json({ tasks: tasksWithStatus });
  } catch (err) {
    console.error('[GET /tasks]', err);
    res.status(500).json({ message: 'Failed to load tasks' });
  }
});

// ── POST /api/tasks — create a new task ─────────────────────────────────────
r.post(
  '/',
  auth,
  [
    body('title')
      .trim()
      .notEmpty().withMessage('Task title is required')
      .isLength({ max: 100 }).withMessage('Task title must be at most 100 characters'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Category must be at most 50 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      const { title, category = 'General' } = req.body;
      const task = await Task.create({ userId: req.user._id, title, category });
      res.status(201).json({ task });
    } catch (err) {
      console.error('[POST /tasks]', err);
      res.status(500).json({ message: 'Failed to create task' });
    }
  }
);

// ── DELETE /api/tasks/:id — soft-delete and remove from today's list ─────────
r.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { active: false },
      { new: false }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Also remove the DailyTask for today so it doesn't ghost on the dashboard
    await DailyTask.deleteOne({ userId: req.user._id, taskId: task._id, date: dateKey() });

    res.json({ message: 'Task removed' });
  } catch (err) {
    console.error('[DELETE /tasks/:id]', err);
    res.status(500).json({ message: 'Failed to remove task' });
  }
});

// ── PATCH /api/tasks/:id/complete — toggle today's completion ────────────────
r.patch('/:id/complete', auth, async (req, res) => {
  try {
    const item = await DailyTask.findOne({
      taskId: req.params.id,
      userId: req.user._id,
      date: dateKey(),
    });
    if (!item) return res.status(404).json({ message: 'Daily task not found' });

    item.completed   = !item.completed;
    item.completedAt = item.completed ? new Date() : undefined;
    await item.save();

    res.json(await scoreToday(req.user._id));
  } catch (err) {
    console.error('[PATCH /tasks/:id/complete]', err);
    res.status(500).json({ message: 'Failed to update task' });
  }
});

export default r;
