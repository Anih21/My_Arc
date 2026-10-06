import { Router } from 'express';
import auth from '../middleware/auth.js';
import Achievement from '../models/Achievement.js';
import { ACHIEVEMENTS, refreshGameStats } from '../services/game.service.js';

const r = Router();

// ── GET /api/achievements ────────────────────────────────────────────────────
r.get('/', auth, async (req, res) => {
  try {
    await refreshGameStats(req.user._id);
    const unlocked = await Achievement.find({ userId: req.user._id }).lean();
    const set = new Set(unlocked.map(x => x.achievementId));
    res.json({
      achievements: ACHIEVEMENTS.map(a => ({
        ...a,
        unlocked:   set.has(a.id),
        unlockedAt: unlocked.find(x => x.achievementId === a.id)?.unlockedAt || null,
      })),
    });
  } catch (err) {
    console.error('[GET /achievements]', err);
    res.status(500).json({ message: 'Failed to load achievements' });
  }
});

export default r;
