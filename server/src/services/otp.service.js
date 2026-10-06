import nodemailer from 'nodemailer';
import OtpCode from '../models/OtpCode.js';

const MAX_ATTEMPTS = 5;
const OTP_TTL_MS   = 10 * 60 * 1000; // 10 minutes

// ── Mailer transport ─────────────────────────────────────────────────────────
// In development  → Ethereal (catches all emails, nothing reaches real inboxes)
// In production   → Real SMTP credentials from environment variables
// Supported: Gmail, Outlook, any SMTP provider

let _transporter = null;

async function getTransporter() {
  if (_transporter) return _transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const isDev = process.env.NODE_ENV !== 'production';
    const allowSelfSigned = process.env.SMTP_ALLOW_SELF_SIGNED === 'true' || isDev;
    const cleanPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

    const isGmail = (process.env.SMTP_HOST || '').toLowerCase().includes('gmail');
    const transportConfig = isGmail
      ? {
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: cleanPass,
          },
          tls: {
            rejectUnauthorized: !allowSelfSigned,
          },
        }
      : {
          host:   process.env.SMTP_HOST,
          port:   Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: cleanPass,
          },
          tls: {
            rejectUnauthorized: !allowSelfSigned,
          },
        };

    _transporter = nodemailer.createTransport(transportConfig);
    return _transporter;
  }

  // Fallback for development without external SMTP:
  // Try Ethereal, but if network/SSL intercept blocks api.nodemailer.com, fallback to mock console
  try {
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
      tls: { rejectUnauthorized: false }
    });
    return _transporter;
  } catch (err) {
    console.warn('[mailer] Ethereal account creation unavailable (using console mock):', err.message);
    return null;
  }
}

// ── Send OTP ─────────────────────────────────────────────────────────────────
export async function sendOtp(email) {
  const normalised = email.trim().toLowerCase();

  // Send real email if SMTP_HOST or SMTP_USER is set, or if OTP_PROVIDER is smtp
  const isMock = (process.env.OTP_PROVIDER === 'mock') && !process.env.SMTP_HOST && !process.env.SMTP_USER;
  const code = isMock
    ? '123456'
    : String(Math.floor(100000 + Math.random() * 900000));

  // Upsert: overwrite any existing pending OTP for this email
  await OtpCode.findOneAndUpdate(
    { email: normalised },
    { code, attempts: 0, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
    { upsert: true, new: true }
  );

  // In mock mode without external SMTP configured, log to console immediately
  if (isMock) {
    console.log(`\n==============================`);
    console.log(`[DEV OTP] Email: ${normalised}`);
    console.log(`[DEV OTP] Code:  ${code}`);
    console.log(`==============================\n`);
    return { sent: true };
  }

  const transporter = await getTransporter();

  if (!transporter) {
    // If transporter could not be initialized, log code as development fallback so user is never blocked
    console.log(`\n[DEV OTP FALLBACK] ${normalised}: ${code}\n`);
    return { sent: true };
  }

  try {
    const info = await transporter.sendMail({
      from:    process.env.SMTP_FROM || '"ARC ⚡" <noreply@winterarc.app>',
      to:      normalised,
      subject: 'Your ARC OTP',
      text:    `Your OTP is: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0d1422;color:#e2e8f0;border-radius:16px">
          <h2 style="margin:0 0 8px;color:#7dd3fc">⚡ ARC</h2>
          <p style="color:#94a3b8;margin:0 0 24px">Your one-time password</p>
          <div style="font-size:40px;font-weight:700;letter-spacing:12px;color:#f1f5f9;text-align:center;padding:24px;background:#1e293b;border-radius:12px">
            ${code}
          </div>
          <p style="color:#64748b;font-size:13px;margin:20px 0 0">
            Expires in <strong>10 minutes</strong>. Don't share this code with anyone.
          </p>
        </div>
      `,
    });

    if (info && info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('[mailer] Ethereal Preview URL:', previewUrl);
      }
    }
  } catch (err) {
    console.error('[mailer] Failed to send email via SMTP:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV OTP FALLBACK] Code for ${normalised} is: ${code}`);
      return { sent: true };
    }
    throw err;
  }

  return { sent: true };
}

// ── Verify OTP ────────────────────────────────────────────────────────────────
export async function verifyOtp(email, code, consume = true) {
  const normalised = email.trim().toLowerCase();
  const item = await OtpCode.findOne({ email: normalised });
  if (!item) return false;

  // Belt-and-suspenders expiry check (on top of MongoDB TTL)
  if (Date.now() > item.expiresAt.getTime()) {
    await OtpCode.deleteOne({ email: normalised });
    return false;
  }

  // Brute-force protection
  item.attempts += 1;
  if (item.attempts > MAX_ATTEMPTS) {
    await OtpCode.deleteOne({ email: normalised });
    return false;
  }

  if (item.code !== String(code)) {
    await item.save(); // persist incremented attempt count
    return false;
  }

  // Correct code
  if (consume) await OtpCode.deleteOne({ email: normalised });
  return true;
}
