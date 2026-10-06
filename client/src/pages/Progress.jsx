import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Layout from '../components/Layout';
import api from '../services/api';

export default function Progress() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard/progress').then(r => setData(r.data)); }, []);
  if (!data) return <Layout><div className="screen-center">Loading your progress…</div></Layout>;
  const chart = data.history.map(x => ({ ...x, label: x.date.slice(5) }));
  return <Layout>
    <div className="page-head"><p className="eyebrow">YOUR ARC</p><h1>Progress 📊</h1><p className="muted">Consistency is the real score.</p></div>
    <div className="stats-row four"><div className="stat card"><span>📈</span><strong>{data.average}</strong><small>Average / 10</small></div><div className="stat card"><span>🔥</span><strong>{data.user.currentStreak}</strong><small>Current streak</small></div><div className="stat card"><span>🏆</span><strong>{data.user.longestStreak}</strong><small>Best streak</small></div><div className="stat card"><span>⚡</span><strong>{data.user.totalXP}</strong><small>Total XP</small></div></div>
    <section className="card chart-card"><div className="section-head"><div><p className="eyebrow">LAST 30 DAYS</p><h2>Daily score</h2></div><span className="level-badge">LEVEL {data.user.level}</span></div>{chart.length ? <ResponsiveContainer width="100%" height={300}><LineChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/><XAxis dataKey="label" stroke="#64748b"/><YAxis domain={[0,10]} stroke="#64748b"/><Tooltip contentStyle={{background:'#0d1422',border:'1px solid #263249',borderRadius:12}}/><Line type="monotone" dataKey="score" stroke="#7dd3fc" strokeWidth={3} dot={{r:3}}/></LineChart></ResponsiveContainer> : <div className="empty">Complete your first day to unlock your chart.</div>}</section>
    <div className="stats-row"><div className="stat card"><span>💯</span><strong>{data.user.perfectDays}</strong><small>Perfect days</small></div><div className="stat card"><span>✅</span><strong>{data.completedTasks}</strong><small>Tasks completed</small></div><div className="stat card"><span>❄️</span><strong>{Math.max(0, data.user.level * 500 - data.user.totalXP)}</strong><small>XP to next level</small></div></div>
  </Layout>;
}
