import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BellRing,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowUpDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { alertService } from '../services';
import { SeverityBadge, StatusBadge, RiskMeter } from '../components/Badges';
import { LoadingSkeleton } from '../components/JsonViewer';

export const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [filters, setFilters] = useState({
    severity: '',
    status: '',
    search: '',
    sort: '-timestamp',
  });
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async (page = 1) => {
    try {
      setLoading(true);
      const data = await alertService.getAlerts({
        page,
        limit: pagination.limit,
        severity: filters.severity || undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
        sort: filters.sort,
      });
      setAlerts(data?.alerts || []);
      setPagination(data?.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(1);
  }, [filters]);

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-cyan-400" />
            SECURITY ALERTS INVENTORY
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Normalized Wazuh alert telemetry with automated AI triage & risk evaluation
          </p>
        </div>
        <button
          onClick={() => fetchAlerts(pagination.page)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg soc-card text-xs font-mono text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="soc-card rounded-xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by description, agent, IP, or raw log..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full soc-input pl-9 pr-4 py-2 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Severity Filter */}
          <select
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            className="soc-input px-3 py-2 rounded-lg text-xs bg-slate-900 text-slate-300"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="soc-input px-3 py-2 rounded-lg text-xs bg-slate-900 text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </select>

          {/* Sort Filter */}
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="soc-input px-3 py-2 rounded-lg text-xs bg-slate-900 text-slate-300"
          >
            <option value="-timestamp">Newest First</option>
            <option value="timestamp">Oldest First</option>
            <option value="-riskScore">Highest Risk Score</option>
            <option value="-ruleLevel">Highest Rule Level</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="soc-card rounded-xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={6} />
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-mono">No security alerts matched the selected filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Rule & Description</th>
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4">Source IP</th>
                  <th className="py-3 px-4">Risk</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {alerts.map((alert) => (
                  <tr key={alert._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {format(new Date(alert.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-slate-200 truncate">{alert.ruleDescription}</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Rule ID: {alert.ruleId} | Level {alert.ruleLevel}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      <div>{alert.agentName}</div>
                      <div className="text-[10px] text-slate-500">ID: {alert.agentId}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-400">
                      {alert.sourceIp || 'Internal'}
                    </td>
                    <td className="py-3 px-4">
                      <RiskMeter score={alert.riskScore} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/alerts/${alert._id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-black font-mono text-xs font-bold text-slate-300 border border-slate-700 transition-all"
                      >
                        Investigate
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-900/40 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>
            Showing Page <strong className="text-white">{pagination.page}</strong> of{' '}
            <strong className="text-white">{pagination.pages}</strong> ({pagination.total} Total Alerts)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchAlerts(pagination.page - 1)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchAlerts(pagination.page + 1)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
