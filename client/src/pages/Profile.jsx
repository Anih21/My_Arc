import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  return (
    <Layout>
      <div className="page-head">
        <p className="eyebrow">YOUR IDENTITY</p>
        <h1>Profile 👤</h1>
      </div>
      <div className="card profile-card">
        <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
        <h2>{user?.username}</h2>
        <p className="muted">{user?.email}</p>
        <div className="profile-stats">
          <span>🔥 {user?.currentStreak || 0}<small>Current streak</small></span>
          <span>🏆 {user?.longestStreak || 0}<small>Best streak</small></span>
          <span>⚡ {user?.totalXP || 0}<small>XP</small></span>
        </div>
        <p className="quote">"You don't need a perfect day. You need another honest one."</p>
      </div>
    </Layout>
  );
}
