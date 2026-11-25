import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Server,
  Key,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { settingsService, wazuhService } from '../services';
import { useAuth } from '../context/AuthContext';

export const Settings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingWazuh, setTestingWazuh] = useState(false);
  const [wazuhTestResult, setWazuhTestResult] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    wazuhApiUrl: '',
    wazuhUsername: '',
    wazuhPassword: '',
    wazuhVerifySsl: false,
    wazuhIntegrationSecret: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settRes, logsRes] = await Promise.all([
        settingsService.getSettings(),
        settingsService.getAuditLogs({ limit: 20 }),
      ]);
      setSettings(settRes);
      setFormData({
        wazuhApiUrl: settRes.wazuhApiUrl || 'https://localhost:55000',
        wazuhUsername: settRes.wazuhUsername || 'wazuh-wui',
        wazuhPassword: '',
        wazuhVerifySsl: settRes.wazuhVerifySsl || false,
        wazuhIntegrationSecret: '',
      });
      setAuditLogs(logsRes?.logs || []);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTestWazuh = async () => {
    try {
      setTestingWazuh(true);
      setWazuhTestResult(null);
      const res = await wazuhService.getStatus();
      setWazuhTestResult(res);
      if (res.success) {
        toast.success(`Connected to Wazuh API ${res.version || ''}`);
      } else {
        toast.error(`Wazuh Connection Failed: ${res.status}`);
      }
    } catch (err) {
      setWazuhTestResult({ success: false, status: 'SERVER_UNREACHABLE', error: err.message });
      toast.error('Wazuh server unreachable');
    } finally {
      setTestingWazuh(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await settingsService.updateSettings(formData);
      toast.success('Configuration updated successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            SYSTEM SETTINGS & WAZUH INTEGRATION
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Configure Wazuh server connection parameters, threat intel keys, and audit event logs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Wazuh API Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="soc-card rounded-xl p-6 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                Wazuh Manager API Credentials
              </h3>
              <button
                type="button"
                onClick={handleTestWazuh}
                disabled={testingWazuh}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-200 font-mono text-xs font-bold transition-all disabled:opacity-50"
              >
                <Radio className={`w-3.5 h-3.5 ${testingWazuh ? 'animate-spin text-cyan-400' : ''}`} />
                <span>{testingWazuh ? 'Testing...' : 'Test Wazuh Connection'}</span>
              </button>
            </div>

            {/* Live Wazuh Diagnostic Banner */}
            {wazuhTestResult && (
              <div
                className={`p-4 rounded-xl border text-xs font-mono flex items-start gap-3 ${
                  wazuhTestResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
                }`}
              >
                {wazuhTestResult.success ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold uppercase tracking-wide">
                    Status: {wazuhTestResult.status || (wazuhTestResult.success ? 'CONNECTED' : 'DISCONNECTED')}
                  </div>
                  {wazuhTestResult.version && (
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Wazuh Manager Version: {wazuhTestResult.version} (Host: {wazuhTestResult.hostname || 'master'})
                    </div>
                  )}
                  {wazuhTestResult.error && (
                    <div className="text-[11px] text-rose-300 mt-1">Error: {wazuhTestResult.error}</div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Wazuh API URL</label>
                <input
                  type="text"
                  required
                  value={formData.wazuhApiUrl}
                  onChange={(e) => setFormData({ ...formData, wazuhApiUrl: e.target.value })}
                  placeholder="https://192.168.1.100:55000"
                  className="w-full soc-input px-3 py-2 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">API Username</label>
                  <input
                    type="text"
                    required
                    value={formData.wazuhUsername}
                    onChange={(e) => setFormData({ ...formData, wazuhUsername: e.target.value })}
                    placeholder="wazuh-wui"
                    className="w-full soc-input px-3 py-2 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">API Password</label>
                  <input
                    type="password"
                    value={formData.wazuhPassword}
                    onChange={(e) => setFormData({ ...formData, wazuhPassword: e.target.value })}
                    placeholder={settings?.hasWazuhPassword ? '•••••••••••• (Configured)' : 'Enter password'}
                    className="w-full soc-input px-3 py-2 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="sslCheck"
                  checked={formData.wazuhVerifySsl}
                  onChange={(e) => setFormData({ ...formData, wazuhVerifySsl: e.target.checked })}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
                />
                <label htmlFor="sslCheck" className="text-xs font-mono text-slate-300 select-none">
                  Verify SSL Certificates (Disable if self-signed)
                </label>
              </div>

              <button
                type="submit"
                disabled={user?.role !== 'ADMIN'}
                className="py-2.5 px-6 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                Save Configuration
              </button>
            </form>
          </div>

          {/* Audit Logs Table */}
          <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              System Audit Trail & Analyst Actions
            </h3>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-800/20">
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                        {format(new Date(log.createdAt), 'MM-dd HH:mm:ss')}
                      </td>
                      <td className="py-2 px-3 font-bold text-cyan-400">{log.action}</td>
                      <td className="py-2 px-3 uppercase text-purple-400">{log.category}</td>
                      <td className="py-2 px-3 text-slate-300">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Integration Statuses */}
        <div className="space-y-6">
          <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              Integration Keys Status
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-400">VirusTotal API:</span>
                <span className={settings?.hasVirusTotalKey ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {settings?.hasVirusTotalKey ? 'ACTIVE' : 'NOT CONFIGURED'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-400">AbuseIPDB API:</span>
                <span className={settings?.hasAbuseIpDbKey ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {settings?.hasAbuseIpDbKey ? 'ACTIVE' : 'NOT CONFIGURED'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-400">OpenAI LLM:</span>
                <span className={settings?.hasOpenAiKey ? 'text-emerald-400 font-bold' : 'text-purple-400'}>
                  {settings?.hasOpenAiKey ? 'ACTIVE' : 'LOCAL FALLBACK'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-400">Demo Simulation:</span>
                <span className={settings?.demoMode ? 'text-yellow-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {settings?.demoMode ? 'ENABLED' : 'DISABLED (PROD)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
