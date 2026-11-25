import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BrainCircuit,
  ShieldAlert,
  ShieldCheck,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { alertService, incidentService } from '../services';
import { SeverityBadge, StatusBadge, RiskMeter } from '../components/Badges';
import { JsonViewer, LoadingSkeleton } from '../components/JsonViewer';

export const AlertDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [threatIntel, setThreatIntel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [creatingIncident, setCreatingIncident] = useState(false);

  const fetchAlert = async () => {
    try {
      setLoading(true);
      const data = await alertService.getAlertById(id);
      setAlert(data.alert);
      setThreatIntel(data.threatIntel);
    } catch (err) {
      toast.error('Failed to load alert details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlert();
  }, [id]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      const updated = await alertService.updateAlert(id, { status: newStatus });
      setAlert(updated);
      toast.success(`Alert status changed to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update alert status');
    }
  };

  const handleReAnalyze = async () => {
    try {
      setAnalyzing(true);
      const res = await alertService.reAnalyzeAlert(id);
      setAlert(res.alert);
      toast.success('AI threat re-analysis completed');
    } catch (err) {
      toast.error('Re-analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePromoteToIncident = async () => {
    try {
      setCreatingIncident(true);
      const inc = await incidentService.createIncident({
        title: `Security Incident: ${alert.ruleDescription}`,
        description: alert.aiAnalysis?.explanation || alert.fullLog || alert.ruleDescription,
        severity: alert.severity,
        relatedAlerts: [alert._id],
        affectedAgents: [{ agentId: alert.agentId, agentName: alert.agentName, agentIp: alert.agentIp }],
        sourceIps: alert.sourceIp ? [alert.sourceIp] : [],
      });
      toast.success(`Promoted to Incident ${inc.incidentId}`);
      navigate(`/incidents/${inc._id}`);
    } catch (err) {
      toast.error('Failed to promote alert to incident');
    } finally {
      setCreatingIncident(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSkeleton count={8} />
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="text-center py-16 soc-card rounded-xl">
        <p className="text-slate-400 font-mono">Alert not found</p>
        <Link to="/alerts" className="text-xs text-cyan-400 font-mono mt-2 inline-block hover:underline">
          Return to alerts list
        </Link>
      </div>
    );
  }

  const ai = alert.aiAnalysis || {};

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/alerts"
            className="p-2 rounded-lg soc-card text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-mono text-white">ALERT TRIAGE #{alert.wazuhAlertId || alert._id}</h2>
              <SeverityBadge severity={alert.severity} />
              <StatusBadge status={alert.status} />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Detected on {format(new Date(alert.timestamp), 'yyyy-MM-dd HH:mm:ss')} UTC
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold transition-all"
          >
            <BrainCircuit className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Analyzing...' : 'AI Re-Analyze'}</span>
          </button>

          <button
            onClick={handlePromoteToIncident}
            disabled={creatingIncident}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/40 text-xs font-mono font-bold transition-all"
          >
            <Flame className="w-4 h-4" />
            <span>Promote to Incident</span>
          </button>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & AI Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Event Specification
            </h3>
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-sm font-semibold text-slate-200">
              {alert.ruleDescription}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono pt-2">
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Wazuh Rule ID</span>
                <span className="text-white font-bold">{alert.ruleId}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Wazuh Rule Level</span>
                <span className="text-orange-400 font-bold">Level {alert.ruleLevel}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Decoder Name</span>
                <span className="text-cyan-400 font-bold">{alert.decoder || 'N/A'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Target Agent</span>
                <span className="text-white font-bold">{alert.agentName} ({alert.agentId})</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Source IP / Port</span>
                <span className="text-cyan-400 font-bold">{alert.sourceIp || 'Internal'}:{alert.sourcePort || '--'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase">Location</span>
                <span className="text-slate-300 truncate block">{alert.location || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* AI Threat Analysis & Recommendations */}
          <div className="soc-card rounded-xl p-5 border border-purple-500/30 shadow-glow-purple space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-400 font-mono font-bold text-xs uppercase">
                <BrainCircuit className="w-4 h-4" />
                <span>AI Security Analysis & Advisory</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-400 border border-purple-500/40">
                Source: {ai.analysisSource || 'hybrid'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              {ai.explanation || 'Automated AI analysis pending...'}
            </p>

            {/* Recommended Containment Actions */}
            <div>
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                Recommended Containment & Investigation Steps
              </h4>
              <ul className="space-y-2">
                {(ai.recommendedActions || []).map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-mono flex-shrink-0 mt-0.5 font-bold">
                      {i + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Raw Wazuh Log & Payload */}
          <JsonViewer data={alert.rawAlert || alert.fullLog} title="Wazuh Full Raw Event Telemetry" />
        </div>

        {/* Right 1 Col: Risk Score, Triage Status, MITRE, Threat Intel */}
        <div className="space-y-6">
          {/* Risk Score Breakdown */}
          <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Transparent Risk Scoring
            </h3>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold font-mono text-white">{alert.riskScore}</span>
              <span className="text-xs font-mono text-slate-400">/ 100 PTS</span>
            </div>
            <RiskMeter score={alert.riskScore} />

            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
              {(ai.riskFactors || []).map((rf, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{rf.factor}</span>
                  <span className="font-mono text-cyan-400 font-bold">+{rf.contribution} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Update Control */}
          <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Analyst Workflow Status
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusUpdate(st)}
                  className={`py-2 px-2.5 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                    alert.status === st
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* MITRE ATT&CK Mapping */}
          <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              MITRE ATT&CK Framework
            </h3>
            {alert.mitre?.technique?.length > 0 ? (
              <div className="space-y-2">
                {alert.mitre.technique.map((tech, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-xs font-semibold text-slate-200 block">{tech}</span>
                    <span className="text-[10px] font-mono text-purple-400">
                      Tactic: {alert.mitre.tactic?.[i] || 'Unknown'} | ID: {alert.mitre.id?.[i] || 'T0000'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-mono">No direct MITRE ATT&CK technique mapped</p>
            )}
          </div>

          {/* Threat Intel Card */}
          {threatIntel && threatIntel.length > 0 && (
            <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Threat Intelligence
              </h3>
              {threatIntel.map((ti, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="uppercase text-slate-400 text-[10px]">{ti.source}</span>
                    <span className={`font-bold ${ti.reputation === 'malicious' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {ti.reputation}
                    </span>
                  </div>
                  <div className="text-slate-300">Country: {ti.country || 'N/A'}</div>
                  {ti.abuseScore !== undefined && <div className="text-slate-400">Abuse Score: {ti.abuseScore}%</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
