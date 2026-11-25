import React from 'react';
import { ShieldCheck, ShieldAlert, Radio } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const WazuhStatusBanner = () => {
  const { wazuhLiveStatus } = useSocket();
  const isConnected = wazuhLiveStatus?.connected;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
      isConnected 
        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' 
        : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
    }`}>
      <span className="relative flex h-2 w-2">
        {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
      </span>
      <span>Wazuh: {isConnected ? `CONNECTED (${wazuhLiveStatus.version || 'v4.7'})` : 'DISCONNECTED'}</span>
    </div>
  );
};
