import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Globe,
  FileCode,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Server,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { threatIntelService } from '../services';
import { LoadingSkeleton } from '../components/JsonViewer';

export const ThreatIntel = () => {
  const [indicator, setIndicator] = useState('');
  const [indicatorType, setIndicatorType] = useState('ip');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentLookups, setRecentLookups] = useState([]);

  const fetchRecent = async () => {
    try {
      const data = await threatIntelService.getRecentLookups();
      setRecentLookups(data || []);
    } catch (err) {
      console.error('Failed to load recent lookups:', err);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!indicator.trim()) return;
    try {
      setLoading(true);
      setResult(null);
      let data = null;
      if (indicatorType === 'ip') {
        data = await threatIntelService.getIpIntel(indicator.trim());
      } else {
        data = await threatIntelService.getHashIntel(indicator.trim());
      }
      setResult(data);
      toast.success('Threat Intelligence lookup completed');
      fetchRecent();
    } catch (err) {
      toast.error('Lookup failed or indicator unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            THREAT INTELLIGENCE & REPUTATION ENGINE
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Query VirusTotal, AbuseIPDB, and Shodan indicators of compromise (IOCs)
          </p>
        </div>
      </div>

      {/* Query Bar */}
      <div className="soc-card rounded-xl p-6 border border-slate-800 space-y-4">
        <form onSubmit={handleLookup} className="flex flex-col md:flex-row items-center gap-3">
          <select
            value={indicatorType}
            onChange={(e) => setIndicatorType(e.target.value)}
            className="soc-input px-3 py-2.5 rounded-lg text-xs bg-slate-900 text-slate-200 font-mono"
          >
            <option value="ip">IP Address</option>
            <option value="hash">File Hash (MD5 / SHA256)</option>
          </select>

          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              placeholder={indicatorType === 'ip' ? 'e.g. 185.220.101.45' : 'e.g. 8b1a9953c4611296a827abf8c47804d7'}
              className="w-full soc-input pl-9 pr-4 py-2.5 rounded-lg text-xs font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {loading ? 'LOOKING UP...' : 'ENRICH INDICATOR'}
          </button>
        </form>
      </div>

      {/* Results View */}
      {result && (
        <div className="soc-card rounded-xl p-6 border border-cyan-500/40 shadow-glow-cyan space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Indicator Intelligence</span>
              <h3 className="text-lg font-bold font-mono text-white">{result.indicator}</h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                result.reputation === 'malicious'
                  ? 'bg-red-950/80 text-red-400 border-red-500/40'
                  : result.reputation === 'suspicious'
                  ? 'bg-orange-950/80 text-orange-400 border-orange-500/40'
                  : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
              }`}
            >
              {result.reputation} REPUTATION
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Country</span>
              <span className="text-white font-bold">{result.country || 'Unknown'}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">ISP / ASN</span>
              <span className="text-cyan-400 font-bold truncate block">{result.isp || 'N/A'}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Abuse Score</span>
              <span className={`font-bold ${result.abuseScore > 50 ? 'text-red-400' : 'text-slate-200'}`}>
                {result.abuseScore !== undefined ? `${result.abuseScore}%` : 'N/A'}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase">Cache Status</span>
              <span className="text-emerald-400 font-bold">24h Mongo Cache</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Lookups History */}
      <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
          Cached Indicators History ({recentLookups.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Indicator</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Reputation</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Last Checked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentLookups.map((item) => (
                <tr key={item._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">{item.indicator}</td>
                  <td className="py-3 px-4 font-mono uppercase text-[10px] text-slate-400">{item.indicatorType}</td>
                  <td className="py-3 px-4 font-mono uppercase text-[10px] text-purple-400">{item.source}</td>
                  <td className="py-3 px-4 font-mono uppercase font-bold text-xs">
                    <span className={item.reputation === 'malicious' ? 'text-red-400' : 'text-slate-300'}>
                      {item.reputation}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{item.country || 'N/A'}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {item.lastChecked ? format(new Date(item.lastChecked), 'yyyy-MM-dd HH:mm') : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
