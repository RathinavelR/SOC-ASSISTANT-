import React from 'react';

export const SeverityBadge = ({ severity }) => {
  const sev = (severity || 'low').toLowerCase();

  const styles = {
    critical: 'bg-red-950/80 text-red-400 border-red-500/40 shadow-glow-red animate-pulse-slow',
    high: 'bg-orange-950/80 text-orange-400 border-orange-500/40',
    medium: 'bg-yellow-950/80 text-yellow-400 border-yellow-500/40',
    low: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40',
  };

  const style = styles[sev] || styles.low;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${style}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current"></span>
      {severity || 'LOW'}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const s = (status || 'NEW').toUpperCase();

  const styles = {
    NEW: 'bg-blue-950/80 text-blue-400 border-blue-500/40',
    ACKNOWLEDGED: 'bg-purple-950/80 text-purple-400 border-purple-500/40',
    INVESTIGATING: 'bg-yellow-950/80 text-yellow-400 border-yellow-500/40',
    RESOLVED: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40',
    CLOSED: 'bg-slate-800 text-slate-400 border-slate-700',
    CONTAINED: 'bg-amber-950/80 text-amber-400 border-amber-500/40',
    OPEN: 'bg-red-950/80 text-red-400 border-red-500/40',
    FALSE_POSITIVE: 'bg-gray-800 text-gray-400 border-gray-700',
    ACTIVE: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40',
    DISCONNECTED: 'bg-red-950/80 text-red-400 border-red-500/40',
  };

  const style = styles[s] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium border ${style}`}>
      {status}
    </span>
  );
};

export const RiskMeter = ({ score }) => {
  const val = Math.min(100, Math.max(0, score || 0));

  let colorClass = 'from-cyan-500 to-cyan-400 text-cyan-400';
  if (val >= 80) colorClass = 'from-red-600 to-red-500 text-red-400';
  else if (val >= 60) colorClass = 'from-orange-500 to-orange-400 text-orange-400';
  else if (val >= 30) colorClass = 'from-yellow-500 to-yellow-400 text-yellow-400';

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/60">
        <div
          className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-500`}
          style={{ width: `${val}%` }}
        />
      </div>
      <span className={`font-mono text-xs font-bold ${colorClass.split(' ')[2]}`}>
        {val}/100
      </span>
    </div>
  );
};
