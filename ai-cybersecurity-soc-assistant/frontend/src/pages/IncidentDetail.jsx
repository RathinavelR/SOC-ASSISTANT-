import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Flame,
  Clock,
  MessageSquare,
  Shield,
  Server,
  UserCheck,
  CheckCircle,
  Plus,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { incidentService } from '../services';
import { SeverityBadge, StatusBadge, RiskMeter } from '../components/Badges';
import { LoadingSkeleton } from '../components/JsonViewer';
import { useAuth } from '../context/AuthContext';

export const IncidentDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [resolutionText, setResolutionText] = useState('');

  const fetchIncident = async () => {
    try {
      setLoading(true);
      const data = await incidentService.getIncidentById(id);
      setIncident(data);
      if (data.resolution) setResolutionText(data.resolution);
    } catch (err) {
      toast.error('Failed to load incident details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const payload = { status: newStatus };
      if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
        payload.resolution = resolutionText || 'Resolved by security team after containment and remediation verification.';
      }
      const updated = await incidentService.updateIncident(id, payload);
      setIncident(updated);
      toast.success(`Incident status updated to ${newStatus}`);
      fetchIncident();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setSubmittingComment(true);
      await incidentService.addComment(id, newComment);
      setNewComment('');
      toast.success('Note added to incident');
      fetchIncident();
    } catch (err) {
      toast.error('Failed to add note');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSkeleton count={7} />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-12 soc-card rounded-xl text-center">
        <p className="text-slate-400 font-mono">Incident not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/incidents" className="p-2 rounded-lg soc-card text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-mono text-white">{incident.incidentId}: {incident.title}</h2>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Created on {format(new Date(incident.createdAt), 'yyyy-MM-dd HH:mm:ss')} UTC
            </p>
          </div>
        </div>

        {/* Status Dropdown / Controls */}
        <div className="flex items-center gap-2">
          {['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => handleStatusChange(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                incident.status === st
                  ? 'bg-cyan-500 text-black border-cyan-400'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left 2 Cols (Details & Timeline), Right 1 Col (Metadata & Comments) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Incident Scope & Executive Brief
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              {incident.description || 'No detailed scope provided.'}
            </p>

            {/* Target Assets & IPs */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Affected Agents</span>
                <div className="flex flex-wrap gap-1.5">
                  {incident.affectedAgents?.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono text-xs border border-slate-700">
                      {a.agentName || a.agentId} ({a.agentIp || 'IP'})
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Source Threat IPs</span>
                <div className="flex flex-wrap gap-1.5">
                  {incident.sourceIps?.map((ip, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 font-mono text-xs border border-red-500/40">
                      {ip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Incident Timeline */}
          <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Incident Investigation Timeline
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {incident.timeline?.map((item, idx) => (
                <div key={idx} className="relative">
                  <span className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 ${
                    item.automated ? 'bg-cyan-500 border-slate-900' : 'bg-purple-500 border-slate-900'
                  }`} />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 font-mono">{item.action}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {item.timestamp ? format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm:ss') : '--'}
                    </span>
                    {item.automated && (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        Automated
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Correlated Alerts List */}
          <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Correlated Security Alerts ({incident.relatedAlerts?.length || 0})
            </h3>
            <div className="space-y-2">
              {incident.relatedAlerts?.map((alert) => (
                <div key={alert._id} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={alert.severity} />
                      <span className="text-xs font-semibold text-slate-200">{alert.ruleDescription}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      Agent: {alert.agentName} | Rule Level: {alert.ruleLevel}
                    </span>
                  </div>
                  <Link
                    to={`/alerts/${alert._id}`}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-black font-mono text-xs text-slate-300 transition-all"
                  >
                    View Alert
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Comments & Analyst Notes */}
        <div className="space-y-6">
          <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Analyst Investigation Notes
            </h3>

            {/* Comments Stream */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {incident.comments?.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4 font-mono">No analyst notes recorded yet</p>
              ) : (
                incident.comments?.map((c, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-cyan-400 font-bold">
                        {c.user ? `${c.user.firstName} ${c.user.lastName}` : 'Analyst'}
                      </span>
                      <span className="text-slate-500">
                        {c.createdAt ? format(new Date(c.createdAt), 'HH:mm') : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="pt-2 border-t border-slate-800 space-y-2">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Log findings, memory triage artifacts, or containment steps..."
                className="w-full soc-input px-3 py-2 rounded-lg text-xs"
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Analyst Note</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
