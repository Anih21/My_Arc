import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const mood = s =>
  s >= 9.5 ? '🗿🔥' : s >= 8.5 ? '🔥' : s >= 7.5 ? '😄' : s >= 6 ? '🙂' : s >= 4 ? '😐' : s >= 2 ? '😔' : '😭';

export default function History() {
  const [days, setDays]       = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/dashboard/history').then(r => {
      setDays(r.data.days);
      setSelected(r.data.days[0] || null);
    });
  }, []);

  return (
    <Layout>
      <div className="page-head">
        <p className="eyebrow">LOOK BACK</p>
        <h1>History 🗓️</h1>
        <p className="muted">Every checkbox counts. Nothing gets forgotten.</p>
      </div>

      <div className="history-grid">
        <section className="card">
          <div className="history-list">
            {days.length ? (
              days.map(day => (
                <button
                  key={day.date}
                  className={`history-day ${selected?.date === day.date ? 'selected' : ''}`}
                  onClick={() => setSelected(day)}
                >
                  <div>
                    <strong>
                      {new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric',
                      })}
                    </strong>
                    {/* Guard: completedTasks / totalTasks may be undefined for old records */}
                    <small>{day.completedTasks ?? 0}/{day.totalTasks ?? 0} completed</small>
                  </div>
                  <span>{mood(day.score ?? 0)}</span>
                  {/* Fix: null-safe toFixed — prevents crash when score is null */}
                  <b>{(day.score ?? 0).toFixed(1)}</b>
                </button>
              ))
            ) : (
              <div className="empty">Your completed days will appear here.</div>
            )}
          </div>
        </section>

        <section className="card day-detail">
          {selected ? (
            <>
              <p className="eyebrow">{selected.date}</p>
              <div className="detail-score">
                <strong>{(selected.score ?? 0).toFixed(1)}</strong>
                <span>/10 {mood(selected.score ?? 0)}</span>
              </div>
              <p className="muted">
                {selected.completedTasks ?? 0} of {selected.totalTasks ?? 0} tasks completed
              </p>
              {(selected.tasks ?? []).map(t => (
                <div className={`detail-task ${t.completed ? 'done' : ''}`} key={t._id}>
                  <span>{t.completed ? '✓' : '○'}</span>
                  {t.title}
                </div>
              ))}
            </>
          ) : (
            <div className="empty">Select a day.</div>
          )}
        </section>
      </div>
    </Layout>
  );
}
