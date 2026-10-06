import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';

const mood = s =>
  s >= 9.5 ? '🗿🔥' : s >= 8.5 ? '🔥' : s >= 7.5 ? '😄' : s >= 6 ? '🙂' : s >= 4 ? '😐' : s >= 2 ? '😔' : '😭';

const message = s =>
  s >= 9.5
    ? 'PERFECT DAY. NO EXCUSES.'
    : s >= 8
    ? 'Another day conquered. Keep going.'
    : s >= 6
    ? 'Consistency is being built.'
    : s >= 4
    ? 'Reset. Tomorrow is another rep.'
    : 'Bad day, not a bad journey.';

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [data, setData]   = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.message || 'Could not load dashboard'));
  }, []);

  if (user && !user.arcStartDate) return <Navigate to="/onboarding" replace />;

  // Toggle a task's completion — keeps arcStartDate intact in state
  const toggle = async id => {
    try {
      const r = await api.patch(`/tasks/${id}/complete`);
      setData(prev => ({
        ...prev,
        tasks:     r.data.tasks,
        score:     r.data.score,
        completed: r.data.completed,
        total:     r.data.total,
        // Merge user fields without overwriting arcStartDate / arcGoal
        user: { ...prev.user, ...r.data.user },
      }));
      // Keep AuthContext user in sync too
      if (r.data.user) setUser(u => ({ ...u, ...r.data.user }));
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update task');
    }
  };

  if (error) return <Layout><div className="card error">{error}</div></Layout>;
  if (!data)  return <Layout><div className="screen-center">Loading your day…</div></Layout>;

  return (
    <Layout>
      <section className="hero-row">
        <div>
          <p className="eyebrow">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1>{timeGreeting()}, {data.user.username} 👋</h1>
          <p className="muted">Don't chase motivation. Chase the checkboxes.</p>
        </div>
        <div className="streak-pill">🔥 {data.user.currentStreak} day streak</div>
      </section>

      <div className="dashboard-grid">
        <motion.div className="score-card card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="eyebrow">TODAY'S SCORE</p>
          <div className="score-ring">
            <div>
              <strong>{data.score.toFixed(1)}</strong>
              <span>/10</span>
            </div>
          </div>
          <div className="mood">{mood(data.score)}</div>
          <h2>{message(data.score)}</h2>
          <p className="muted">{data.completed}/{data.total} tasks completed</p>
        </motion.div>

        <div className="card tasks-card">
          <div className="section-head">
            <div>
              <p className="eyebrow">TODAY'S QUEST</p>
              <h2>Your tasks</h2>
            </div>
            <a className="link" href="/tasks">Manage →</a>
          </div>
          {data.tasks.length === 0 ? (
            <div className="empty">No tasks yet. Add your first one and start your arc.</div>
          ) : (
            data.tasks.map(t => (
              <button
                className={`task-row ${t.completed ? 'done' : ''}`}
                key={t.id}
                onClick={() => toggle(t.id)}
              >
                <span className="checkbox">{t.completed ? '✓' : ''}</span>
                <span>{t.title}</span>
                <small>+1</small>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="stats-row">
        <div className="stat card"><span>⚡</span><strong>{data.user.totalXP}</strong><small>XP</small></div>
        <div className="stat card"><span>🏆</span><strong>{data.user.level}</strong><small>Level</small></div>
        <div className="stat card"><span>💯</span><strong>{data.user.perfectDays}</strong><small>Perfect days</small></div>
      </div>
    </Layout>
  );
}
