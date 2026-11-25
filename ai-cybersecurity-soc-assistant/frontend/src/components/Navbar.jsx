import React, { useState, useEffect } from 'react';
import { Search, Bell, LogOut, User as UserIcon, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { WazuhStatusBanner } from './WazuhStatusBanner';
import { notificationService } from '../services';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { liveAlerts, unreadAlertsCount, clearUnreadAlerts } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getNotifications();
        if (data?.notifications) {
          setNotifications(data.notifications);
        }
      } catch (err) {
        // Non-blocking
      }
    };
    fetchNotifications();
  }, [liveAlerts]);

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    clearUnreadAlerts();
  };

  return (
    <header className="h-16 bg-[#070e1e]/80 border-b border-slate-800/80 fixed top-0 right-0 left-64 z-20 px-6 flex items-center justify-between backdrop-blur-md">
      {/* Search Bar */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search alerts, IPs, agents, or MITRE techniques..."
            className="w-full soc-input pl-9 pr-4 py-1.5 rounded-lg text-xs placeholder:text-slate-500 font-mono"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Wazuh Status */}
        <WazuhStatusBanner />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={handleOpenNotifications}
            className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 relative transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Notification Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 soc-card rounded-xl p-3 border border-slate-700 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Security Notifications</span>
                <button
                  onClick={() => notificationService.markAsRead('all')}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto mt-2 space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No active notifications</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div key={n._id} className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 text-xs">
                      <div className="font-semibold text-slate-200">{n.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{n.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="flex flex-col text-right">
            <span className="text-xs font-medium text-white">{user?.firstName} {user?.lastName}</span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">{user?.role || 'VIEWER'}</span>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/40 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
