import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ForgotPassword } from '../pages/ForgotPassword';
import { Dashboard } from '../pages/Dashboard';
import { Alerts } from '../pages/Alerts';
import { AlertDetail } from '../pages/AlertDetail';
import { Incidents } from '../pages/Incidents';
import { IncidentDetail } from '../pages/IncidentDetail';
import { Agents } from '../pages/Agents';
import { AgentDetail } from '../pages/AgentDetail';
import { ThreatIntel } from '../pages/ThreatIntel';
import { MitreAttack } from '../pages/MitreAttack';
import { Logs } from '../pages/Logs';
import { AIAnalysisPage } from '../pages/AIAnalysisPage';
import { Reports } from '../pages/Reports';
import { Settings } from '../pages/Settings';
import { NotFound } from '../pages/NotFound';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(...allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes inside SOC Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="alerts/:id" element={<AlertDetail />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="incidents/:id" element={<IncidentDetail />} />
        <Route path="agents" element={<Agents />} />
        <Route path="agents/:id" element={<AgentDetail />} />
        <Route path="threat-intelligence" element={<ThreatIntel />} />
        <Route path="ai-analysis" element={<AIAnalysisPage />} />
        <Route path="mitre" element={<MitreAttack />} />
        <Route path="logs" element={<Logs />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};
