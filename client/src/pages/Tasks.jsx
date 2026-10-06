import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/tasks')
      .then(r => {
        setTasks(r.data?.tasks || []);
        setError('');
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load tasks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const add = async e => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.post('/tasks', { title: title.trim() });
      setTitle('');
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add task');
    }
  };

  const remove = async id => {
    try {
      await api.delete(`/tasks/${id}`);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to delete task');
    }
  };

  const toggle = async id => {
    try {
      await api.patch(`/tasks/${id}/complete`);
      // Update local state immediately
      setTasks(prev =>
        prev.map(t => (t._id === id ? { ...t, completed: !t.completed } : t))
      );
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to update task');
    }
  };

  return (
    <Layout>
      <div className="page-head">
        <div>
          <p className="eyebrow">BUILD YOUR ROUTINE</p>
          <h1>Tasks</h1>
          <p className="muted">Check off your daily tasks here or directly from the Home Dashboard.</p>
        </div>
      </div>

      <div className="card add-task">
        <form onSubmit={add}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Study DSA for 2 hours, Hit gym, Read 20 pages"
          />
          <button className="primary">+ Add task</button>
        </form>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card task-list">
        {loading ? (
          <div className="empty">Loading tasks…</div>
        ) : tasks.length === 0 ? (
          <div className="empty">No tasks yet. Add your daily habits above to start tracking!</div>
        ) : (
          tasks.map(t => (
            <div className={`manage-row ${t.completed ? 'done' : ''}`} key={t._id}>
              {/* Checkbox button to mark task complete */}
              <button
                type="button"
                className={`checkbox ${t.completed ? 'checked' : ''}`}
                style={{ cursor: 'pointer', border: 'none' }}
                onClick={() => toggle(t._id)}
                title={t.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {t.completed ? '✓' : ''}
              </button>
              <div style={{ cursor: 'pointer' }} onClick={() => toggle(t._id)}>
                <strong style={{ textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#64748b' : '#f8fafc' }}>
                  {t.title}
                </strong>
                <small>{t.completed ? 'Completed today ✨' : 'Click checkbox to complete'}</small>
              </div>
              <button onClick={() => remove(t._id)} className="danger-btn">
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
