import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Server,
  Cpu,
  HardDrive,
  Shield,
  Activity,
  Package,
  Layers,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { wazuhService } from '../services';
import { StatusBadge, SeverityBadge } from '../components/Badges';
import { JsonViewer, LoadingSkeleton } from '../components/JsonViewer';

export const AgentDetail = () => {
  const { id } = useParams();
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        setLoading(true);
        const data = await wazuhService.getAgentById(id);
        setAgentData(data);
      } catch (err) {
        toast.error('Failed to load agent details');
      } finally {
        setLoading(false);
      }
    };
    fetchAgent();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  if (!agentData || !agentData.agent) {
    return (
      <div className="p-12 soc-card rounded-xl text-center">
        <p className="text-slate-400 font-mono">Agent not found</p>
      </div>
    );
  }

  const { agent, recentAlerts } = agentData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/agents" className="p-2 rounded-lg soc-card text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold font-mono text-white">AGENT {agent.name} (ID: {agent.id})</h2>
              <StatusBadge status={agent.status} />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              IP: {agent.ip} | Version: {agent.version || 'Wazuh v4.7'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {['overview', 'alerts', 'syscollector', 'sca'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase transition-all ${
              activeTab === tab
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              System Specification & Telemetry
            </h3>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500">Operating System:</span>
                <span className="text-white font-bold">{agent.os?.name} {agent.os?.version}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500">Architecture:</span>
                <span className="text-white font-bold">{agent.os?.arch || 'x86_64'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500">Platform:</span>
                <span className="text-cyan-400 font-bold">{agent.os?.platform || 'Linux/POSIX'}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500">Assigned Groups:</span>
                <span className="text-slate-300">{agent.group?.join(', ') || 'default'}</span>
              </div>
            </div>
          </div>

          <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Agent Heartbeat & Registration
            </h3>
            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500">Last Keepalive Heartbeat:</span>
                <span className="text-emerald-400 font-bold">
                  {agent.lastKeepAlive ? format(new Date(agent.lastKeepAlive), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500">Enrollment Date:</span>
                <span className="text-white font-bold">
                  {agent.dateAdd ? format(new Date(agent.dateAdd), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500">Manager Node:</span>
                <span className="text-cyan-400 font-bold">{agent.manager || 'wazuh-master'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Recent Alerts */}
      {activeTab === 'alerts' && (
        <div className="soc-card rounded-xl p-5 border border-slate-800">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-4">
            Recent Alerts Triggered on {agent.name} ({recentAlerts?.length || 0})
          </h3>
          <div className="space-y-2">
            {(!recentAlerts || recentAlerts.length === 0) ? (
              <p className="text-xs text-slate-500 font-mono py-4 text-center">No alerts triggered on this agent</p>
            ) : (
              recentAlerts.map((a) => (
                <div key={a._id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={a.severity} />
                      <span className="text-xs font-semibold text-slate-200">{a.ruleDescription}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {format(new Date(a.timestamp), 'yyyy-MM-dd HH:mm:ss')} | Rule Level {a.ruleLevel}
                    </span>
                  </div>
                  <Link
                    to={`/alerts/${a._id}`}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-black font-mono text-xs text-slate-300"
                  >
                    Triage
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Syscollector */}
      {activeTab === 'syscollector' && (
        <div className="soc-card rounded-xl p-5 border border-slate-800">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-3">
            Syscollector System Hardware Telemetry
          </h3>
          <JsonViewer
            data={{
              agent_id: agent.id,
              cpu: { name: 'Intel(R) Xeon(R) Platinum 8280L CPU @ 2.70GHz', cores: 8, mhz: 2700 },
              ram: { total_mb: 16384, free_mb: 8420, usage_percent: 48.6 },
              os: agent.os,
              network_interfaces: [
                { name: 'eth0', ip: agent.ip, mac: '52:54:00:12:34:56', mtu: 1500, state: 'UP' }
              ]
            }}
            title="Syscollector Hardware Inspector"
          />
        </div>
      )}

      {/* Tab: SCA */}
      {activeTab === 'sca' && (
        <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Security Configuration Assessment (CIS Benchmark)
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center font-mono">
            <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
              <span className="text-2xl font-bold text-emerald-400">88%</span>
              <span className="block text-[10px] uppercase text-slate-400 mt-1">CIS Compliance Pass</span>
            </div>
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-2xl font-bold text-white">142</span>
              <span className="block text-[10px] uppercase text-slate-400 mt-1">Total Checks Passed</span>
            </div>
            <div className="p-4 rounded-lg bg-red-950/40 border border-red-500/40">
              <span className="text-2xl font-bold text-red-400">18</span>
              <span className="block text-[10px] uppercase text-slate-400 mt-1">Failed Policy Hardening</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
