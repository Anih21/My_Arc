import React from "react";
 

// Keep your existing imports below
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login'; import Register from './pages/Register'; import Dashboard from './pages/Dashboard'; import Tasks from './pages/Tasks'; import Progress from './pages/Progress'; import History from './pages/History'; import Achievements from './pages/Achievements'; import Profile from './pages/Profile'; import Onboarding from './pages/Onboarding'; import Challenge from './pages/Challenge';
function Protected({ children }) { const { user, loading } = useAuth(); if (loading) return <div className="screen-center">Loading your ARC…</div>; return user ? children : <Navigate to="/login" replace />; }
export default function App(){return <AuthProvider><Routes><Route path="/" element={<Navigate to="/dashboard" replace/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route path="/onboarding" element={<Protected><Onboarding/></Protected>}/><Route path="/dashboard" element={<Protected><Dashboard/></Protected>}/><Route path="/challenge" element={<Protected><Challenge/></Protected>}/><Route path="/tasks" element={<Protected><Tasks/></Protected>}/><Route path="/progress" element={<Protected><Progress/></Protected>}/><Route path="/history" element={<Protected><History/></Protected>}/><Route path="/achievements" element={<Protected><Achievements/></Protected>}/><Route path="/profile" element={<Protected><Profile/></Protected>}/><Route path="*" element={<Navigate to="/dashboard" replace/>}/></Routes></AuthProvider>}
