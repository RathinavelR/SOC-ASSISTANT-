import React, { useState, useEffect } from 'react';
import {
  FileBarChart2,
  Plus,
  Download,
  Calendar,
  Shield,
  Activity,
  Printer,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { reportService } from '../services';
import { LoadingSkeleton } from '../components/JsonViewer';

export const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportType, setReportType] = useState('daily');
  const [days, setDays] = useState(7);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await reportService.getReports();
      setReports(data || []);
      if (data?.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const newRep = await reportService.generateReport({
        type: reportType,
        days: parseInt(days, 10),
      });
      toast.success('Security report generated');
      setSelectedReport(newRep);
      fetchReports();
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5 text-cyan-400" />
            SECURITY AUDIT REPORTS & EXECUTIVE METRICS
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Automated intelligence dossiers, incident summaries, and CIS agent posture reports
          </p>
        </div>
      </div>

      {/* Generator Form */}
      <div className="soc-card rounded-xl p-5 border border-slate-800">
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full soc-input px-3 py-2 rounded-lg text-xs bg-slate-900 text-white font-mono"
            >
              <option value="daily">Daily SOC Operations Summary</option>
              <option value="weekly">Weekly Threat Assessment</option>
              <option value="incident">Incident Response Audit</option>
              <option value="threat_intel">Threat Intelligence Dossier</option>
              <option value="agent_health">Agent Fleet Health & Compliance</option>
            </select>
          </div>

          <div className="w-full sm:w-40">
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Lookback Period</label>
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="w-full soc-input px-3 py-2 rounded-lg text-xs bg-slate-900 text-white font-mono"
            >
              <option value="1">Last 24 Hours</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>

          <div className="w-full sm:w-auto pt-4">
            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 px-5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{generating ? 'GENERATING...' : 'GENERATE REPORT'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Grid: Left reports list, Right report preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Past Reports */}
        <div className="soc-card rounded-xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Generated Reports ({reports.length})
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {reports.map((rep) => (
              <button
                key={rep._id}
                onClick={() => setSelectedReport(rep)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedReport?._id === rep._id
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-white shadow-glow-cyan'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-semibold truncate">{rep.title}</div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span className="uppercase text-cyan-400">{rep.type}</span>
                  <span>{format(new Date(rep.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right 2 Cols: Report Viewer / Printable Document */}
        <div className="lg:col-span-2 space-y-4">
          {selectedReport ? (
            <div className="soc-card rounded-xl p-8 border border-slate-800 space-y-6 print:p-0 print:bg-white print:text-black">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">Executive Report</span>
                  <h2 className="text-lg font-bold font-mono text-white mt-0.5">{selectedReport.title}</h2>
                  <span className="text-xs text-slate-500 font-mono">
                    Generated on {format(new Date(selectedReport.createdAt), 'yyyy-MM-dd HH:mm:ss')} UTC
                  </span>
                </div>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg soc-card text-xs font-mono text-slate-300 hover:text-white"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-xl font-bold text-white">{selectedReport.data?.alertStats?.total || 0}</span>
                  <span className="block text-[10px] uppercase text-slate-500 mt-1">Total Alerts</span>
                </div>
                <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-500/40">
                  <span className="text-xl font-bold text-red-400">{selectedReport.data?.alertStats?.critical || 0}</span>
                  <span className="block text-[10px] uppercase text-slate-400 mt-1">Critical Events</span>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-xl font-bold text-cyan-400">{selectedReport.data?.incidents?.length || 0}</span>
                  <span className="block text-[10px] uppercase text-slate-500 mt-1">Incidents Triaged</span>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-xl font-bold text-emerald-400">
                    {selectedReport.data?.summary?.activeAgentsCount || 0} / {selectedReport.data?.summary?.totalAgentsCount || 0}
                  </span>
                  <span className="block text-[10px] uppercase text-slate-500 mt-1">Online Agents</span>
                </div>
              </div>

              {/* AI Key Insights */}
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                <span className="text-xs font-mono font-bold text-purple-400 uppercase">AI Threat Synthesis</span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedReport.data?.aiInsights?.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Top Threats in Period */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Dominant Security Rules Observed
                </h4>
                <div className="space-y-2 text-xs font-mono">
                  {selectedReport.data?.topThreats?.map((th, i) => (
                    <div key={i} className="p-2.5 rounded bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-300 truncate max-w-md">{th.description}</span>
                      <span className="text-cyan-400 font-bold">{th.count} occurrences</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 soc-card rounded-xl text-center">
              <p className="text-slate-400 font-mono">Select or generate a report to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
