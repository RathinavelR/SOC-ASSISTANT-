import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BellRing,
  Flame,
  Server,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { dashboardService, alertService } from '../services';
import { StatCard } from '../components/StatCard';
import { SeverityBadge, StatusBadge, RiskMeter } from '../components/Badges';
import { useSocket } from '../context/SocketContext';

export const Dashboard = () => {
  const { liveAlerts } = useSocket();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [severityDist, setSeverityDist] = useState([]);
  const [topThreats, setTopThreats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, trendRes, sevRes, threatsRes, alertsRes] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getTrends(7),
        dashboardService.getSeverity(),
        dashboardService.getTopThreats(),
        alertService.getAlerts({ limit: 10, sort: '-timestamp' }),
      ]);
      setSummary(sumRes);
      setTrends(trendRes);
      setSeverityDist(sevRes);
      setTopThreats(threatsRes);
      setRecentAlerts(alertsRes?.alerts || []);
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Prepend live WebSocket alerts to the table in real-time
  useEffect(() => {
    if (liveAlerts.length > 0) {
      setRecentAlerts((prev) => [liveAlerts[0], ...prev.slice(0, 9)]);
      if (summary) {
        setSummary((prev) => ({
          ...prev,
          totalAlerts: (prev.totalAlerts || 0) + 1,
          criticalAlerts: liveAlerts[0].severity === 'critical' ? (prev.criticalAlerts || 0) + 1 : prev.criticalAlerts,
          highAlerts: liveAlerts[0].severity === 'high' ? (prev.highAlerts || 0) + 1 : prev.highAlerts,
          eventsToday: (prev.eventsToday || 0) + 1,
        }));
      }
    }
  }, [liveAlerts]);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            SECURITY OPERATIONS CENTER OVERVIEW
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time Wazuh event correlation & automated threat intelligence
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg soc-card text-xs font-mono text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* 10 Core Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total Alerts" value={summary?.totalAlerts} icon={BellRing} color="cyan" />
        <StatCard title="Critical" value={summary?.criticalAlerts} icon={AlertTriangle} color="red" />
        <StatCard title="High" value={summary?.highAlerts} icon={Flame} color="orange" />
        <StatCard title="Medium" value={summary?.mediumAlerts} icon={ShieldAlert} color="yellow" />
        <StatCard title="Low" value={summary?.lowAlerts} icon={ShieldCheck} color="cyan" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Active Incidents" value={summary?.activeIncidents} icon={Flame} color="red" />
        <StatCard title="Online Agents" value={summary?.onlineAgents} icon={Server} color="green" />
        <StatCard title="Offline Agents" value={summary?.offlineAgents} icon={Server} color="orange" />
        <StatCard title="Events Today" value={summary?.eventsToday} icon={Activity} color="purple" />
        <StatCard title="High Risk Threats" value={summary?.threatsDetected} icon={Cpu} color="red" />
      </div>

      {/* Charts Section: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 soc-card rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Alert Volume Trends (Last 7 Days)
            </h3>
            <span className="text-[11px] font-mono text-cyan-400">Total & Severity Trends</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1e3a8a', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="total" stroke="#06b6d4" fillOpacity={1} fill="url(#colorTotal)" name="Total Events" />
                <Area type="monotone" dataKey="critical" stroke="#ef4444" fillOpacity={1} fill="url(#colorCrit)" name="Critical" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Donut */}
        <div className="soc-card rounded-xl p-5 border border-slate-800">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-4">
            Severity Distribution
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1527', borderColor: '#1e3a8a', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Triggered Rules */}
        <div className="soc-card rounded-xl p-5 border border-slate-800">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-4">
            Top Triggered Alert Rules
          </h3>
          <div className="space-y-3">
            {topThreats?.topRules?.map((rule, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                <div className="flex flex-col max-w-[80%]">
                  <span className="text-xs font-medium text-slate-200 truncate">{rule.description}</span>
                  <span className="text-[10px] font-mono text-cyan-400">Rule ID: {rule.ruleId}</span>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-800 text-xs font-mono font-bold text-white border border-slate-700">
                  {rule.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top MITRE ATT&CK Techniques */}
        <div className="soc-card rounded-xl p-5 border border-slate-800">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-4">
            Observed MITRE ATT&CK Techniques
          </h3>
          <div className="space-y-3">
            {topThreats?.mitreTechniques?.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                <span className="text-xs font-medium text-slate-200">{m.technique}</span>
                <span className="px-2.5 py-1 rounded bg-purple-950/60 text-xs font-mono font-bold text-purple-400 border border-purple-500/40">
                  {m.count} hits
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-Time Live Alert Feed Table */}
      <div className="soc-card rounded-xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Live Alert Ingestion Stream
            </h3>
          </div>
          <Link to="/alerts" className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1">
            View All Alerts <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Rule / Description</th>
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentAlerts.map((alert) => (
                <tr key={alert._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {alert.timestamp ? format(new Date(alert.timestamp), 'HH:mm:ss') : '--'}
                  </td>
                  <td className="py-3 px-4">
                    <SeverityBadge severity={alert.severity} />
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-200 max-w-xs truncate">
                    {alert.ruleDescription || 'Wazuh Security Event'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {alert.agentName || alert.agentId || '000'}
                  </td>
                  <td className="py-3 px-4 font-mono text-cyan-400">
                    {alert.sourceIp || 'Internal / N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <RiskMeter score={alert.riskScore} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/alerts/${alert._id}`}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-black font-mono text-[11px] font-bold text-slate-300 border border-slate-700 transition-all"
                    >
                      Triage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
