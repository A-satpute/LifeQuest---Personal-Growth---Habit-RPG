import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Goals } from './pages/Goals';
import { Tasks } from './pages/Tasks';
import { CharacterPage } from './pages/CharacterPage';
import { AiGoalArchitectPage } from './pages/AiGoalArchitectPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { HistoryPage } from './pages/HistoryPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/character" element={<CharacterPage />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/ai-architect" element={<AiGoalArchitectPage />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
