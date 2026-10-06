import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const goals = ['Fitness', 'Studies', 'Coding', 'Career', 'Reading', 'Sleep', 'Mindset', 'Custom'];

export default function Onboarding() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [goal, setGoal]   = useState('Fitness');
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await api.post('/arc/start', { goal });
      setUser(u => ({ ...u, arcStartDate: r.data.startDate, arcGoal: r.data.goal }));
      nav('/dashboard', { replace: true });
    } catch (e) {
      setError(e.response?.data?.message || 'Could not start your ARC');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="onboarding">
      <motion.div className="onboard-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="snow-icon">⚡</div>
        <p className="eyebrow">THE CHALLENGE BEGINS</p>
        <h1>Your ARC.</h1>
        <p className="lead">Monthly cycles. Your rules. One checkbox at a time.</p>
        <div className="onboard-quote">“You don't need motivation. You need consistency.”</div>
        <h3>What do you want to improve this cycle?</h3>
        <div className="goal-grid">
          {goals.map(g => (
            <button
              key={g}
              className={goal === g ? 'goal active' : 'goal'}
              onClick={() => setGoal(g)}
            >
              {g}
            </button>
          ))}
        </div>
        {error && <div className="error">{error}</div>}
        <button className="primary start-btn" onClick={start} disabled={busy}>
          {busy ? 'Starting…' : 'START MY ARC →'}
        </button>
        <p className="muted center">Your monthly journey starts today. Cycles refresh automatically each month.</p>
      </motion.div>
    </main>
  );
}