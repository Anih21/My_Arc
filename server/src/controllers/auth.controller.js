import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sendOtp, verifyOtp } from '../services/otp.service.js';
import { publicUser, signToken } from '../utils/auth.js';

// ── Send OTP to email ─────────────────────────────────────────────────────────
export async function sendOtpController(req, res) {
  try {
    const { email } = req.body;
    await sendOtp(email);
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error('[sendOtp]', err);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
}

// ── Verify OTP (without consuming — preview step before registration) ─────────
export async function verifyOtpController(req, res) {
  try {
    const { email, otp } = req.body;
    const ok = await verifyOtp(email, otp, false);
    if (!ok) return res.status(400).json({ message: 'Invalid or expired OTP' });
    res.json({ verified: true });
  } catch (err) {
    console.error('[verifyOtp]', err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
}

// ── Register ──────────────────────────────────────────────────────────────────
export async function register(req, res) {
  try {
    const { email, otp, username, password } = req.body;

    // Re-verify and consume the OTP in one step
    const ok = await verifyOtp(email, otp, true);
    if (!ok) return res.status(400).json({ message: 'OTP is invalid or expired. Please request a new one.' });

    // Check for duplicate username or email
    const normalised = email.trim().toLowerCase();
    const existing = await User.findOne({ $or: [{ username }, { email: normalised }] });
    if (existing) return res.status(409).json({ message: 'Username or email already in use' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email: normalised, passwordHash });

    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
}

// ── Login (username OR email + password) ──────────────────────────────────────
export async function login(req, res) {
  try {
    const { identifier, password } = req.body;
    const normalised = identifier.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ username: identifier.trim() }, { email: normalised }],
    });

    // Timing-attack protection: always call bcrypt even when user is not found
    const DUMMY_HASH = '$2b$12$invalidhashfortimingprotection000000000000000000';
    const match = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, DUMMY_HASH).then(() => false);

    if (!user || !match) {
      return res.status(401).json({ message: 'Invalid username/email or password' });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
}

// ── Me ────────────────────────────────────────────────────────────────────────
export function me(req, res) {
  res.json({ user: publicUser(req.user) });
}
