import api from './api';

export const authService = {
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (data) => {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },
};

export const dashboardService = {
  getSummary: async () => {
    const res = await api.get('/dashboard/summary');
    return res.data.data;
  },
  getTrends: async (days = 7) => {
    const res = await api.get(`/dashboard/trends?days=${days}`);
    return res.data.data;
  },
  getSeverity: async () => {
    const res = await api.get('/dashboard/severity');
    return res.data.data;
  },
  getTopThreats: async () => {
    const res = await api.get('/dashboard/top-threats');
    return res.data.data;
  },
};

export const alertService = {
  getAlerts: async (params = {}) => {
    const res = await api.get('/alerts', { params });
    return res.data.data;
  },
  getAlertById: async (id) => {
    const res = await api.get(`/alerts/${id}`);
    return res.data.data;
  },
  updateAlert: async (id, data) => {
    const res = await api.patch(`/alerts/${id}`, data);
    return res.data.data;
  },
  reAnalyzeAlert: async (id) => {
    const res = await api.post(`/alerts/${id}/analyze`);
    return res.data.data;
  },
};

export const incidentService = {
  getIncidents: async (params = {}) => {
    const res = await api.get('/incidents', { params });
    return res.data.data;
  },
  getIncidentById: async (id) => {
    const res = await api.get(`/incidents/${id}`);
    return res.data.data;
  },
  createIncident: async (data) => {
    const res = await api.post('/incidents', data);
    return res.data.data;
  },
  updateIncident: async (id, data) => {
    const res = await api.patch(`/incidents/${id}`, data);
    return res.data.data;
  },
  addComment: async (id, text) => {
    const res = await api.post(`/incidents/${id}/comments`, { text });
    return res.data.data;
  },
};

export const wazuhService = {
  getStatus: async () => {
    const res = await api.get('/wazuh/status');
    return res.data.data;
  },
  getAgents: async (params = {}) => {
    const res = await api.get('/wazuh/agents', { params });
    return res.data;
  },
  getAgentById: async (id) => {
    const res = await api.get(`/wazuh/agents/${id}`);
    return res.data.data;
  },
  getManager: async () => {
    const res = await api.get('/wazuh/manager');
    return res.data.data;
  },
  getRules: async (params = {}) => {
    const res = await api.get('/wazuh/rules', { params });
    return res.data.data;
  },
  getMitre: async (params = {}) => {
    const res = await api.get('/wazuh/mitre', { params });
    return res.data;
  },
};

export const threatIntelService = {
  getIpIntel: async (ip) => {
    const res = await api.get(`/threat-intel/ip/${ip}`);
    return res.data.data;
  },
  getHashIntel: async (hash) => {
    const res = await api.get(`/threat-intel/hash/${hash}`);
    return res.data.data;
  },
  getRecentLookups: async () => {
    const res = await api.get('/threat-intel/recent');
    return res.data.data;
  },
};

export const aiService = {
  analyzeText: async (payload) => {
    const res = await api.post('/ai/analyze', payload);
    return res.data.data;
  },
  getInsights: async () => {
    const res = await api.get('/ai/insights');
    return res.data.data;
  },
  calculateRisk: async (data) => {
    const res = await api.post('/ai/calculate-risk', data);
    return res.data.data;
  },
};

export const reportService = {
  getReports: async () => {
    const res = await api.get('/reports');
    return res.data.data;
  },
  getReportById: async (id) => {
    const res = await api.get(`/reports/${id}`);
    return res.data.data;
  },
  generateReport: async (data) => {
    const res = await api.post('/reports', data);
    return res.data.data;
  },
};

export const settingsService = {
  getSettings: async () => {
    const res = await api.get('/settings');
    return res.data.data;
  },
  updateSettings: async (data) => {
    const res = await api.patch('/settings', data);
    return res.data;
  },
  getAuditLogs: async (params = {}) => {
    const res = await api.get('/settings/audit-logs', { params });
    return res.data.data;
  },
  getUsers: async () => {
    const res = await api.get('/settings/users');
    return res.data.data;
  },
  updateUserRole: async (id, data) => {
    const res = await api.patch(`/settings/users/${id}/role`, data);
    return res.data.data;
  },
};

export const notificationService = {
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data.data;
  },
  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },
};
