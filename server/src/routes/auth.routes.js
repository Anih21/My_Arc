import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';
import {
  sendOtpController,
  verifyOtpController,
  register,
  login,
  me,
} from '../controllers/auth.controller.js';

const r = Router();

// ── Per-route rate limiters ──────────────────────────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: { message: 'Too many OTP requests. Please wait before trying again.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many login attempts. Please try again later.' },
});

// ── Shared validation helper ─────────────────────────────────────────────────
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  next();
}

// ── Input validators ─────────────────────────────────────────────────────────
const validateEmail = body('email')
  .trim()
  .notEmpty().withMessage('Email address is required')
  .isEmail().withMessage('Enter a valid email address')
  .normalizeEmail();

const validateOtp = body('otp')
  .trim()
  .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
  .isNumeric().withMessage('OTP must contain only digits');

const validateSendOtp   = [validateEmail];
const validateVerifyOtp = [validateEmail, validateOtp];

const validateRegister = [
  validateEmail,
  validateOtp,
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username may only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8–128 characters'),
];

const validateLogin = [
  body('identifier').trim().notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Routes ───────────────────────────────────────────────────────────────────
r.post('/send-otp',   otpLimiter,   validateSendOtp,   validate, sendOtpController);
r.post('/verify-otp', otpLimiter,   validateVerifyOtp, validate, verifyOtpController);
r.post('/register',   otpLimiter,   validateRegister,  validate, register);
r.post('/login',      loginLimiter, validateLogin,     validate, login);
r.get('/me', auth, me);

export default r;
