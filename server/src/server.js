import dotenv from 'dotenv';
dotenv.config();

// ── Startup guard: crash early if critical env vars are missing ──────────────
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[startup] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('[startup] JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';

import authRoutes        from './routes/auth.routes.js';
import taskRoutes        from './routes/task.routes.js';
import dashboardRoutes   from './routes/dashboard.routes.js';
import achievementRoutes from './routes/achievement.routes.js';
import arcRoutes         from './routes/arc.routes.js';

const app = express();

// ── Security headers (Helmet) ────────────────────────────────────────────────
app.use(helmet());

// ── CORS — only allow configured origin ─────────────────────────────────────
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl) only in development
    if (!origin && process.env.NODE_ENV !== 'production') return cb(null, true);
    if (origin === allowedOrigin) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

// ── Body parser with size limit to prevent payload flooding ──────────────────
app.use(express.json({ limit: '10kb' }));

// ── Sanitize user input: strip $ and . from MongoDB operators ────────────────
app.use(mongoSanitize());

// ── Prevent HTTP parameter pollution ────────────────────────────────────────
app.use(hpp());

// ── Request logging (only in development) ───────────────────────────────────
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// ── Global rate limiter: 200 req / 15 min per IP ────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
}));

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'winter-arc' }));
app.use('/api/auth',         authRoutes);
app.use('/api/tasks',        taskRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/arc',          arcRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Don't leak internal error details to clients in production
  const isDev = process.env.NODE_ENV !== 'production';
  console.error('[server error]', err);
  res.status(err.status || 500).json({
    message: isDev ? err.message : 'Internal server error',
  });
});

// ── DB + Server start ─────────────────────────────────────────────────────────
const port = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(port, () =>
      console.log(`✅ ARC API running on http://localhost:${port}`)
    );
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
