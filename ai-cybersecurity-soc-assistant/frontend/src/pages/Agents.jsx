import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { wazuhService } from '../services';
import { StatusBadge } from '../components/Badges';
import { LoadingSkeleton } from '../components/JsonViewer';

export const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await wazuhService.getAgents({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setAgents(res?.data?.affected_items || []);
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAgents();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            WAZUH AGENTS & ENDPOINTS INVENTORY
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Monitored servers, workstations, cloud nodes, and active keepalive heartbeats
          </p>
        </div>
        <button
          onClick={fetchAgents}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg soc-card text-xs font-mono text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Agents</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="soc-card rounded-xl p-4 border border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search agent by name, IP, or OS platform..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full soc-input pl-9 pr-4 py-2 rounded-lg text-xs font-mono"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="soc-input px-3 py-2 rounded-lg text-xs bg-slate-900 text-slate-300 font-mono"
          >
            <option value="">All Statuses</option>
            <option value="active">Active / Online</option>
            <option value="disconnected">Disconnected</option>
            <option value="never_connected">Never Connected</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Agents Table */}
      <div className="soc-card rounded-xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={5} />
          </div>
        ) : agents.length === 0 ? (
          <div className="p-12 text-center">
            <Server className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-mono">No Wazuh agents found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Agent ID</th>
                  <th className="py-3 px-4">Agent Name</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Operating System</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Keepalive</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">{agent.id}</td>
                    <td className="py-3 px-4 font-semibold text-white">{agent.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{agent.ip || 'DHCP/Dynamic'}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {agent.os?.name ? `${agent.os.name} ${agent.os.version || ''}` : 'Unknown OS'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{agent.version || 'v4.7'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={agent.status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {agent.lastKeepAlive ? format(new Date(agent.lastKeepAlive), 'yyyy-MM-dd HH:mm') : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/agents/${agent.id}`}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-cyan-500 hover:text-black font-mono text-xs font-bold text-slate-300 border border-slate-700 transition-all"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
