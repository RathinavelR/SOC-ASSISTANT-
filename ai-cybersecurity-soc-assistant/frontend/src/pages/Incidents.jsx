import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Search,
  Plus,
  RefreshCw,
  Clock,
  UserCheck,
  Server,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { incidentService } from '../services';
import { SeverityBadge, StatusBadge, RiskMeter } from '../components/Badges';
import { LoadingSkeleton } from '../components/JsonViewer';

export const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [filters, setFilters] = useState({ severity: '', status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    severity: 'high',
  });

  const fetchIncidents = async (page = 1) => {
    try {
      setLoading(true);
      const data = await incidentService.getIncidents({
        page,
        limit: pagination.limit,
        severity: filters.severity || undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
      });
      setIncidents(data?.incidents || []);
      setPagination(data?.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents(1);
  }, [filters]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await incidentService.createIncident(newIncident);
      toast.success('Security incident created');
      setShowCreateModal(false);
      setNewIncident({ title: '', description: '', severity: 'high' });
      fetchIncidents(1);
    } catch (err) {
      toast.error('Failed to create incident');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-500" />
            INCIDENT RESPONSE & LIFECYCLE MANAGEMENT
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Automated correlation cases, containment workflows, and analyst triage timelines
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Incident</span>
          </button>
          <button
            onClick={() => fetchIncidents(pagination.page)}
            className="p-2 rounded-lg soc-card text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="soc-card rounded-xl p-4 border border-slate-800 flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incident ID, title, or target asset..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full soc-input pl-9 pr-4 py-2 rounded-lg text-xs"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="soc-input px-3 py-2 rounded-lg text-xs bg-slate-900 text-slate-300"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="soc-input px-3 py-2 rounded-lg text-xs bg-slate-900 text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="CONTAINED">Contained</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Incidents Cards / Table */}
      {loading ? (
        <LoadingSkeleton count={5} />
      ) : incidents.length === 0 ? (
        <div className="p-12 soc-card rounded-xl text-center">
          <Flame className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-mono">No security incidents found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {incidents.map((inc) => (
            <Link
              key={inc._id}
              to={`/incidents/${inc._id}`}
              className="soc-card rounded-xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-cyan-400 group-hover:underline">
                    {inc.incidentId}
                  </span>
                  <SeverityBadge severity={inc.severity} />
                  <StatusBadge status={inc.status} />
                  <span className="text-xs text-slate-500 font-mono">
                    {format(new Date(inc.createdAt), 'yyyy-MM-dd HH:mm')}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  {inc.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">{inc.description}</p>
              </div>

              <div className="flex items-center gap-6 text-xs font-mono text-slate-400 flex-shrink-0">
                <div className="text-center">
                  <span className="block text-[10px] uppercase text-slate-500">Alerts</span>
                  <span className="text-white font-bold">{inc.relatedAlerts?.length || 0}</span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] uppercase text-slate-500">Timeline Events</span>
                  <span className="text-white font-bold">{inc.timeline?.length || 0}</span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] uppercase text-slate-500">Assigned</span>
                  <span className="text-cyan-400 font-medium">
                    {inc.assignedTo ? `${inc.assignedTo.firstName} ${inc.assignedTo.lastName}` : 'Unassigned'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="soc-card rounded-2xl p-6 border border-slate-700 w-full max-w-lg shadow-2xl space-y-4">
            <h3 className="text-base font-bold font-mono text-white">Create Security Incident</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newIncident.title}
                  onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                  placeholder="e.g. Unauthorized Lateral Movement attempt"
                  className="w-full soc-input px-3 py-2 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  placeholder="Provide incident context, affected subnets, and initial indicator hashes..."
                  className="w-full soc-input px-3 py-2 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">Severity</label>
                <select
                  value={newIncident.severity}
                  onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value })}
                  className="w-full soc-input px-3 py-2 rounded-lg text-xs bg-slate-900 text-white"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg soc-card text-xs font-mono text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono"
                >
                  Create Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
