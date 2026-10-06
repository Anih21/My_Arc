import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('winterArcToken');
    if (!token) return setLoading(false);
    api.get('/auth/me').then(r => setUser(r.data.user)).catch(() => localStorage.removeItem('winterArcToken')).finally(() => setLoading(false));
  }, []);

  const login = async credentials => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem('winterArcToken', data.token);
    setUser(data.user);
  };
  const logout = () => { localStorage.removeItem('winterArcToken'); setUser(null); };

  return <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>{children}</AuthContext.Provider>;
}
