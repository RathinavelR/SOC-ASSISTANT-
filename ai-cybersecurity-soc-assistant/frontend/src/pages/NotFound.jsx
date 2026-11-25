import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h2 className="text-3xl font-bold font-mono text-white">404 - ENDPOINT NOT FOUND</h2>
      <p className="text-xs text-slate-400 font-mono max-w-md">
        The requested Security Operations Center route does not exist or access has been restricted.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs uppercase"
      >
        <ArrowLeft className="w-4 h-4" /> Return to SOC Dashboard
      </Link>
    </div>
  );
};
