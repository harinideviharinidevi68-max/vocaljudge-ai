import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Upload, 
  Database, 
  Award, 
  Layers, 
  Activity, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  FileText 
} from 'lucide-react';
import { api } from '../services/api';
import { SystemHealthStats, AnalysisHistoryItem } from '../types';
import { formatTimeShort, getScoreColor } from '../utils/formatters';

interface HomeDashboardProps {
  onStartAnalysis: () => void;
  onOpenDataset: () => void;
  onViewAnalysis: (analysisId: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onStartAnalysis,
  onOpenDataset,
  onViewAnalysis,
}) => {
  const [healthStats, setHealthStats] = useState<SystemHealthStats | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [health, history] = await Promise.all([
          api.getHealth(),
          api.getHistory(),
        ]);
        setHealthStats(health);
        setRecentAnalyses(history.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-slate-800 p-8 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>Multimodal AI Hackathon 2026 • Track C</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Speak Better. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300">
              Understand Every Flaw.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Contrastive speech delivery analytics and temporal flaw grounding. Compare spoken performances against ideal acoustic reference speeches with verifiable evidence and rubric-based scoring.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onStartAnalysis}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              <Upload className="w-4 h-4" />
              <span>Start New Analysis</span>
            </button>

            <button
              onClick={onOpenDataset}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 font-semibold text-sm transition-all hover:-translate-y-0.5"
            >
              <Database className="w-4 h-4" />
              <span>Explore Contrastive Dataset</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Real Application Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase font-semibold">Total Dataset Recordings</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {healthStats?.stats.dataset_recordings ?? (loading ? '...' : 0)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Paired ground-truth speech recordings</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase font-semibold">Completed Analyses</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {healthStats?.stats.completed_analyses ?? (loading ? '...' : 0)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Stored speech evaluation sessions</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase font-semibold">Flaws Grounded</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {healthStats?.stats.total_flaws_detected ?? (loading ? '...' : 0)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Timestamped acoustic delivery deviations</p>
        </div>
      </div>

      {/* Feature Architecture Workflow Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-white mb-4">
          Core Analytical Workflow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Acoustic Feature Extraction</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extracts pitch (F0 via Librosa YIN), RMS energy dynamics, spectral centroids, MFCCs, and pause intervals.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Temporal Alignment</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maps participant speech to reference baseline using acoustic Dynamic Time Warping (DTW) and phrase chunking.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Temporal Flaw Grounding</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Flags local tempo rushes, sluggish delivery, monotone pitch, and excessive silences with exact start and end timestamps.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Transparent Rubric Scoring</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Calculates a bounded 100-point delivery score across Pacing, Pitch, Pauses, Energy, and Articulation Clarity.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Analyses List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Recent Analyses</h2>
          {recentAnalyses.length > 0 && (
            <span className="text-xs font-mono text-slate-400">{recentAnalyses.length} stored</span>
          )}
        </div>

        {recentAnalyses.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-lg">
            No completed analyses yet. Upload reference and participant audio recordings to begin.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentAnalyses.map((item) => (
              <div 
                key={item.analysis_id}
                onClick={() => onViewAnalysis(item.analysis_id)}
                className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-3 rounded-lg cursor-pointer transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-200 font-mono">
                      {item.analysis_id}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {item.speech_category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(item.created_at).toLocaleString()} • {formatTimeShort(item.participant_duration)} duration • {item.flaw_count} flaws detected
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className={`text-base font-bold ${getScoreColor(item.overall_score)}`}>
                      {item.overall_score.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400"> / 100</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
