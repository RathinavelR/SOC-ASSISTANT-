import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const JsonViewer = ({ data, title = 'Raw Event Data' }) => {
  const [copied, setCopied] = useState(false);

  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="soc-card rounded-xl overflow-hidden border border-slate-800">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800">
        <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">{title}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 font-mono transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy JSON'}</span>
        </button>
      </div>
      <div className="p-4 bg-[#050811] overflow-x-auto max-h-96">
        <pre className="text-xs font-mono text-cyan-300 leading-relaxed">{jsonString || '{}'}</pre>
      </div>
    </div>
  );
};

export const LoadingSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-800/40 rounded-lg border border-slate-800/60" />
      ))}
    </div>
  );
};
