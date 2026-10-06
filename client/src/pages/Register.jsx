import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const [step, setStep]   = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp]     = useState('');
  const [form, setForm]   = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const stepLabel = {
    1: 'Enter your email to get started.',
    2: 'Check your inbox for a 6-digit OTP.',
    3: 'Choose your username and password.',
  };

  // Step 1 — send OTP to email
  const sendOtp = async e => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await api.post('/auth/send-otp', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Step 2 — verify OTP
  const verify = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    }
  };

  // Step 3 — create account
  const register = async e => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', { ...form, email, otp });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo-big">❄️</div>
        <p className="eyebrow">BUILD YOUR ROUTINE</p>
        <h1>Start your arc.</h1>
        <p className="muted">{stepLabel[step]}</p>

        {/* Step indicator */}
        <div className="step-dots">
          {[1, 2, 3].map(s => (
            <span key={s} className={`step-dot ${step >= s ? 'active' : ''}`} />
          ))}
        </div>

        {/* Step 1 — Email */}
        {step === 1 && (
          <form onSubmit={sendOtp}>
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>
            <button className="primary" disabled={sending}>
              {sending ? 'Sending…' : 'Send OTP →'}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <form onSubmit={verify}>
            <div className="email-pill">
              <span>✉️</span>
              <strong>{email}</strong>
              <button
                type="button"
                onClick={() => { setStep(1); setOtp(''); setError(''); }}
              >
                Change
              </button>
            </div>
            <label>
              Enter 6-digit code
              <input
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                autoComplete="one-time-code"
                required
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold' }}
              />
            </label>
            <button className="primary" type="submit">Verify OTP →</button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setStep(1); setOtp(''); setError(''); }}
            >
              ← Use a different email
            </button>
          </form>
        )}

        {/* Step 3 — Username + Password */}
        {step === 3 && (
          <form onSubmit={register}>
            <label>
              Username
              <input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. iron_will"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                minLength={8}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
              />
            </label>
            <button className="primary">Create my ARC →</button>
          </form>
        )}

        {error && <div className="error">{error}</div>}
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
