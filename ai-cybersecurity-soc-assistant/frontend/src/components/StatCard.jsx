import React from 'react';

export const StatCard = ({ title, value, icon: Icon, trend, color = 'cyan', subtext }) => {
  const colorMap = {
    cyan: 'border-cyan-500/20 text-cyan-400 group-hover:border-cyan-500/50',
    red: 'border-red-500/20 text-red-400 group-hover:border-red-500/50',
    orange: 'border-orange-500/20 text-orange-400 group-hover:border-orange-500/50',
    yellow: 'border-yellow-500/20 text-yellow-400 group-hover:border-yellow-500/50',
    purple: 'border-purple-500/20 text-purple-400 group-hover:border-purple-500/50',
    green: 'border-emerald-500/20 text-emerald-400 group-hover:border-emerald-500/50',
  };

  const currentTheme = colorMap[color] || colorMap.cyan;

  return (
    <div className={`soc-card group p-5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 border ${currentTheme}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-2xl font-bold font-mono tracking-tight text-white">{value !== undefined ? value : '--'}</span>
        {subtext && <span className="text-xs text-slate-400">{subtext}</span>}
      </div>
    </div>
  );
};
