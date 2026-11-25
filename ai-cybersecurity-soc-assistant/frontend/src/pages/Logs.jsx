import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { alertService } from '../services';
import { SeverityBadge } from '../components/Badges';
import { JsonViewer, LoadingSkeleton } from '../components/JsonViewer';

export const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const data = await alertService.getAlerts({
        page,
        limit: pagination.limit,
        search: search || undefined,
        sort: '-timestamp',
      });
      setLogs(data?.alerts || []);
      setPagination(data?.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-cyan-400" />
            SECURITY TELEMETRY LOG VIEWER
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Full audit log of syslog, authentication events, system calls, and decoded Wazuh streams
          </p>
        </div>
        <button
          onClick={() => fetchLogs(pagination.page)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg soc-card text-xs font-mono text-slate-300 hover:text-cyan-400 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="soc-card rounded-xl p-4 border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search raw syslog messages, decoder names, IPs, or agent IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full soc-input pl-9 pr-4 py-2 rounded-lg text-xs font-mono"
          />
        </form>
      </div>

      {/* Logs Table */}
      <div className="soc-card rounded-xl border border-slate-800 overflow-hidden font-mono">
        {loading ? (
          <div className="p-6">
            <LoadingSkeleton count={6} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4">Decoder</th>
                  <th className="py-3 px-4">Log Message</th>
                  <th className="py-3 px-4 text-right">Raw JSON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-orange-400 font-bold">Lvl {log.ruleLevel}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {log.agentName || log.agentId}
                    </td>
                    <td className="py-3 px-4 text-cyan-400">
                      {log.decoder || 'syslog'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-md truncate">
                      {log.fullLog || log.ruleDescription}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log.rawAlert || log)}
                        className="p-1.5 rounded bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-300 transition-colors"
                        title="View Raw JSON"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="p-4 bg-slate-900/40 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Page {pagination.page} of {pagination.pages} ({pagination.total} Total Logs)</span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchLogs(pagination.page + 1)}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* JSON Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl soc-card rounded-xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-mono text-white">Full Event Payload</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                Close ✕
              </button>
            </div>
            <JsonViewer data={selectedLog} title="Wazuh Telemetry" />
          </div>
        </div>
      )}
    </div>
  );
};
