import React, { useEffect, useState } from 'react';
import { History, Eye, Trash2, Calendar, Award, Zap, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { AnalysisHistoryItem, AnalysisResult } from '../types';
import { formatTimeShort, getScoreColor } from '../utils/formatters';

interface AnalysisHistoryPageProps {
  onSelectAnalysis: (result: AnalysisResult) => void;
}

export const AnalysisHistoryPage: React.FC<AnalysisHistoryPageProps> = ({ onSelectAnalysis }) => {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const items = await api.getHistory();
      setHistory(items);
    } catch (err) {
      console.error('Failed to load analysis history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleOpen = async (analysisId: string) => {
    try {
      const res = await api.getAnalysis(analysisId);
      onSelectAnalysis(res);
    } catch (err) {
      console.error('Failed to load analysis result:', err);
    }
  };

  const handleDelete = async (analysisId: string) => {
    if (!window.confirm(`Delete analysis record "${analysisId}"?`)) return;
    try {
      await api.deleteAnalysis(analysisId);
      loadHistory();
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Analysis History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Persisted speech analysis records and evaluation archives.
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Analysis ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Flaws Grounded</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No stored analysis records found.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.analysis_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">
                      {item.analysis_id}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {item.speech_category}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {formatTimeShort(item.participant_duration)}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-amber-400">
                      {item.flaw_count}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm">
                      <span className={getScoreColor(item.overall_score)}>
                        {item.overall_score.toFixed(1)}
                      </span>
                      <span className="text-slate-500 text-xs"> / 100</span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpen(item.analysis_id)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium inline-flex items-center space-x-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.analysis_id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 hover:text-rose-300 text-slate-400 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
