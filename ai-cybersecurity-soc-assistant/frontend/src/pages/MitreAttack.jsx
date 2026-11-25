import React, { useState, useEffect } from 'react';
import {
  Grid,
  Search,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { wazuhService } from '../services';
import { LoadingSkeleton } from '../components/JsonViewer';

export const MitreAttack = () => {
  const [mitreData, setMitreData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchMitre = async () => {
    try {
      setLoading(true);
      const res = await wazuhService.getMitre({ search: search || undefined });
      setMitreData(res?.data?.affected_items || []);
    } catch (err) {
      console.error('Failed to load MITRE techniques:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMitre();
  }, []);

  const tactics = [
    'Initial Access',
    'Execution',
    'Persistence',
    'Privilege Escalation',
    'Defense Evasion',
    'Credential Access',
    'Discovery',
    'Lateral Movement',
    'Command and Control',
    'Impact',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <Grid className="w-5 h-5 text-purple-400" />
            MITRE ATT&CK® ENTERPRISE MATRIX
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Adversarial tactics, techniques, and observed attack signatures across monitored hosts
          </p>
        </div>
        <button
          onClick={fetchMitre}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg soc-card text-xs font-mono text-slate-300 hover:text-cyan-400 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh MITRE</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="soc-card rounded-xl p-4 border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search technique name (e.g. PowerShell, Brute Force, T1059)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full soc-input pl-9 pr-4 py-2 rounded-lg text-xs font-mono"
          />
        </div>
      </div>

      {/* MITRE Tactics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full">
            <LoadingSkeleton count={6} />
          </div>
        ) : (
          tactics.map((tactic) => {
            const matchingTechniques = mitreData.filter((item) =>
              (item.tactic || '').toLowerCase().includes(tactic.toLowerCase())
            );

            return (
              <div key={tactic} className="soc-card rounded-xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                    {tactic}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {matchingTechniques.length} Techniques
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {matchingTechniques.length === 0 ? (
                    <p className="text-[11px] text-slate-500 font-mono italic py-2">No active detections in this tactic</p>
                  ) : (
                    matchingTechniques.map((t, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-200">{t.technique || t.name}</span>
                          {t.alertCount && (
                            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                              {t.alertCount} events
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                          ID: {t.id || 'T' + (1000 + idx)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
