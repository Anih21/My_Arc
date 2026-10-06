import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import api from '../services/api';

const mood = s =>
  s === null ? '—' : s >= 9.5 ? '🗿🔥' : s >= 8.5 ? '🔥' : s >= 7.5 ? '😄' : s >= 6 ? '🙂' : s >= 4 ? '😐' : s >= 2 ? '😔' : '😭';

export default function Challenge() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selectedHistory, setSelectedHistory] = useState(null);

  useEffect(() => {
    api
      .get('/arc')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.message || 'Could not load ARC'));
  }, []);

  if (error) return <Layout><div className="card error">{error}</div></Layout>;
  if (!data) return <Layout><div className="screen-center">Loading your ARC…</div></Layout>;
  if (!data.started) {
    return (
      <Layout>
        <div className="card">
          <h2>Your ARC has not started.</h2>
          <a className="primary inline-btn" href="/onboarding">Start now</a>
        </div>
      </Layout>
    );
  }

  const done = data.days.filter(d => d.score !== null).length;
  const scored = data.days.filter(d => d.score !== null);
  const avg = scored.length ? (scored.reduce((a, d) => a + d.score, 0) / scored.length).toFixed(1) : '0.0';

  return (
    <Layout>
      <div className="page-head">
        <p className="eyebrow">MONTHLY CYCLE {data.cycleNumber ? `#${data.cycleNumber}` : ''}</p>
        <h1>ARC ⚡</h1>
        <p className="muted">
          Goal: <b>{data.goal}</b> · Cycle: {data.startDate} to {data.endDate} (Refreshes monthly)
        </p>
      </div>

      <div className="challenge-hero card">
        <div>
          <span className="eyebrow">ACTIVE CYCLE PROGRESS</span>
          <h2>{done}/30 days logged</h2>
          <p className="muted">Average score: <b>{avg}/10</b></p>
        </div>
        <div className="challenge-progress">
          <div style={{ width: `${Math.min(100, (done / 30) * 100)}%` }} />
        </div>
      </div>

      <h3 style={{ marginTop: '28px', marginBottom: '14px' }}>Current Month Grid</h3>
      <div className="arc-grid">
        {data.days.map(d => (
          <motion.div key={d.day} whileHover={{ y: -3 }} className={`arc-day card ${d.score === null ? 'future' : ''}`}>
            <span>DAY {d.day}</span>
            <strong>{mood(d.score)}</strong>
            <b>{d.score === null ? '—' : d.score.toFixed(1)}</b>
            <small>{d.date}</small>
          </motion.div>
        ))}
      </div>

      {/* Past Cycle Histories Section */}
      <section style={{ marginTop: '40px' }}>
        <div className="section-head">
          <div>
            <p className="eyebrow">ARCHIVED DATA</p>
            <h2>Past ARC Histories 📜</h2>
          </div>
        </div>

        {(!data.histories || data.histories.length === 0) ? (
          <div className="card empty">
            No past monthly cycles yet. Once this month's 30-day cycle completes, it will be automatically archived here.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {data.histories.map(h => (
              <div key={h.cycleNumber} className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px' }}>Cycle #{h.cycleNumber} — {h.goal}</h3>
                    <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
                      {h.startDate} → {h.endDate}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '20px', color: '#7dd3fc' }}>{h.avgScore}/10</strong>
                      <small style={{ display: 'block', color: '#94a3b8' }}>Avg Score</small>
                    </div>
                    <button
                      className="primary"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                      onClick={() => setSelectedHistory(selectedHistory?.cycleNumber === h.cycleNumber ? null : h)}
                    >
                      {selectedHistory?.cycleNumber === h.cycleNumber ? 'Hide Breakdown' : 'View Breakdown →'}
                    </button>
                  </div>
                </div>

                {selectedHistory?.cycleNumber === h.cycleNumber && (
                  <div style={{ marginTop: '20px', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
                    <p className="eyebrow">CYCLE #{h.cycleNumber} DAILY SCORES</p>
                    <div className="arc-grid" style={{ marginTop: '12px' }}>
                      {h.days.map((d, i) => (
                        <div key={d.date} className="arc-day card" style={{ padding: '12px' }}>
                          <span>DAY {i + 1}</span>
                          <strong>{mood(d.score)}</strong>
                          <b>{d.score === null ? '—' : Number(d.score).toFixed(1)}</b>
                          <small>{d.date}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
