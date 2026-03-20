import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import JarvisPage from './pages/JarvisPage';
import TasksPage from './pages/TasksPage';
import GoalsPage from './pages/GoalsPage';
import HabitsPage from './pages/HabitsPage';
import MoodPage from './pages/MoodPage';
import AchievementsPage from './pages/AchievementsPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function FullScreenLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 40, height: 40, border: '3px solid var(--border2)',
        borderTopColor: 'var(--purple)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ color: 'var(--text3)', fontSize: 13, fontFamily: 'Syne, sans-serif' }}>
        Loading NexOS...
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="jarvis" element={<JarvisPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="mood" element={<MoodPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
