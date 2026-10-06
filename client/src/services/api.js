import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// ── Request interceptor — attach JWT on every request ────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('winterArcToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — handle expired/invalid tokens globally ─────────────
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Token expired or invalid — clear stored credentials and bounce to login
      localStorage.removeItem('winterArcToken');
      // Avoid redirect loop if user is already on the login page
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
