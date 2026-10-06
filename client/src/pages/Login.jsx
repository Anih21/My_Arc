import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm]   = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const submit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo-big">❄️</div>
        <p className="eyebrow">YOUR RESET STARTS HERE</p>
        <h1>Welcome back.</h1>
        <p className="muted">Show up. Check the boxes. Build the streak.</p>

        <form onSubmit={submit}>
          <label>
            Username or email
            <input
              value={form.identifier}
              onChange={e => setForm({ ...form, identifier: e.target.value })}
              placeholder="username or you@example.com"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button className="primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Enter ARC →'}
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/register">Start your arc</Link>
        </p>
      </div>
    </div>
  );
}
