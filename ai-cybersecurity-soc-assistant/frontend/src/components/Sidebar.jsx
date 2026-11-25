import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BellRing,
  Flame,
  Server,
  ShieldAlert,
  BrainCircuit,
  Grid,
  ScrollText,
  FileBarChart2,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const Sidebar = () => {
  const { unreadAlertsCount } = useSocket();

  const navItems = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Alerts', to: '/alerts', icon: BellRing, badge: unreadAlertsCount },
    { name: 'Incidents', to: '/incidents', icon: Flame },
    { name: 'Agents', to: '/agents', icon: Server },
    { name: 'Threat Intel', to: '/threat-intelligence', icon: ShieldAlert },
    { name: 'AI Analysis', to: '/ai-analysis', icon: BrainCircuit },
    { name: 'MITRE ATT&CK', to: '/mitre', icon: Grid },
    { name: 'Event Logs', to: '/logs', icon: ScrollText },
    { name: 'Reports', to: '/reports', icon: FileBarChart2 },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#070e1e]/90 border-r border-slate-800/80 flex flex-col h-screen fixed left-0 top-0 z-30 backdrop-blur-md">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-white tracking-wide font-mono">SOC ASSISTANT</h1>
          <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-mono">AI CYBER DEFENSE</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center justify-between font-mono">
            <span>SOC Engine:</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
          <div className="flex items-center justify-between font-mono mt-1">
            <span>AI Isolation Forest:</span>
            <span className="text-cyan-400">ACTIVE</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
