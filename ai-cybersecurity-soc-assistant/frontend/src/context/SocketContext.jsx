import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [wazuhLiveStatus, setWazuhLiveStatus] = useState({ connected: false, status: 'CHECKING' });
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const token = localStorage.getItem('soc_token');

    const socketClient = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });

    socketClient.on('connect', () => {
      setConnected(true);
      console.log('⚡ Connected to SOC Real-Time WebSocket stream');
    });

    socketClient.on('disconnect', () => {
      setConnected(false);
      console.log('WebSocket disconnected');
    });

    socketClient.on('wazuh_status', (data) => {
      setWazuhLiveStatus(data);
    });

    socketClient.on('new_alert', (payload) => {
      const alert = payload.alert;
      setLiveAlerts((prev) => [alert, ...prev.slice(0, 49)]);
      setUnreadAlertsCount((prev) => prev + 1);

      // Trigger visual toast
      if (alert.severity === 'critical') {
        toast.error(`🚨 CRITICAL: ${alert.ruleDescription || 'High Impact Anomaly'} (${alert.agentName || 'Agent'})`, {
          duration: 6000,
          position: 'top-right',
        });
      } else if (alert.severity === 'high') {
        toast((t) => (
          <span className="flex items-center gap-2 text-orange-400 font-medium">
            ⚠️ HIGH: {alert.ruleDescription}
          </span>
        ), { duration: 5000, position: 'top-right' });
      }
    });

    socketClient.on('new_notification', (notification) => {
      if (notification.type === 'incident') {
        toast(`🚨 ${notification.title}`, { icon: '🔥', duration: 7000 });
      }
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, [user]);

  const clearUnreadAlerts = () => setUnreadAlertsCount(0);

  return (
    <SocketContext.Provider value={{ socket, connected, wazuhLiveStatus, liveAlerts, unreadAlertsCount, clearUnreadAlerts }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
