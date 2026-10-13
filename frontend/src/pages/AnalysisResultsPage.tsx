import React, { useState } from 'react';
import { AnalysisResult, FlawInterval } from '../types';
import { api } from '../services/api';
import { AudioPlayer } from '../components/AudioPlayer';
import { FlawTimeline } from '../components/FlawTimeline';
import { FeatureCharts } from '../components/FeatureCharts';
import { FlawCard } from '../components/FlawCard';
import { RubricScoreBreakdown } from '../components/RubricScoreBreakdown';
import { formatTimeShort } from '../utils/formatters';
import { 
  Download, 
  Printer, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Calendar, 
  ArrowLeft 
} from 'lucide-react';

interface AnalysisResultsPageProps {
  analysis: AnalysisResult;
  onBackToUpload: () => void;
}

export const AnalysisResultsPage: React.FC<AnalysisResultsPageProps> = ({
  analysis,
  onBackToUpload,
}) => {
  // Synchronized seek state for participant player
  const [partSeekTime, setPartSeekTime] = useState<number | null>(null);
  const [partCurrentTime, setPartCurrentTime] = useState(0);
  const [selectedFlawId, setSelectedFlawId] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleSeekParticipant = (time: number) => {
    setPartSeekTime(time);
  };

  const handleSelectFlaw = (flawId: string) => {
    setSelectedFlawId(flawId);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(analysis, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${analysis.analysis_id}_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter flaws
  const filteredFlaws = analysis.flaws.filter((f) => {
    if (severityFilter !== 'all' && f.severity.toLowerCase() !== severityFilter.toLowerCase()) {
      return false;
    }
    if (categoryFilter !== 'all' && f.type !== categoryFilter) {
      return false;
    }
    return true;
  });

  const uniqueFlawTypes = Array.from(new Set(analysis.flaws.map((f) => f.type)));

  return (
    <div className="space-y-8 pb-16">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4 no-print">
        <button
          onClick={onBackToUpload}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>New Analysis</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Header Metadata Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm card-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-mono font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                {analysis.speech_category}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {analysis.analysis_id}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Contrastive Delivery Analytics Report
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-2 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(analysis.created_at).toLocaleString()}</span>
              <span>•</span>
              <span>Alignment: {analysis.alignment_method}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-right">
              <div className="text-[11px] text-slate-400">Total Flaws Grounded</div>
              <div className="text-xl font-bold text-amber-400">
                {analysis.flaws.length}
              </div>
            </div>
            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-right">
              <div className="text-[11px] text-slate-400">Participant Duration</div>
              <div className="text-xl font-bold text-slate-200">
                {formatTimeShort(analysis.participant_duration)}
              </div>
            </div>
          </div>
        </div>

        {/* Spoken Transcript Preview */}
        <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-300">
          <strong className="text-slate-400">Validated Speech Transcript: </strong>
          <span className="italic">"{analysis.transcript}"</span>
        </div>

        {/* Quality Warnings */}
        {analysis.warnings && analysis.warnings.length > 0 && (
          <div className="mt-4 p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl space-y-1 text-xs text-amber-300">
            <div className="flex items-center space-x-1.5 font-semibold text-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Analysis Quality Warnings:</span>
            </div>
            {analysis.warnings.map((w, idx) => (
              <p key={idx} className="text-[11px] leading-relaxed">
                • {w}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Rubric Score Breakdown Card */}
      <RubricScoreBreakdown
        overallScore={analysis.overall_score}
        categoryScores={analysis.category_scores}
        evaluation={analysis.rubric_evaluation}
      />

      {/* Dual Synchronized Audio Players */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <AudioPlayer
          label="Reference Audio (Ideal Delivery)"
          src={api.getAudioStreamUrl(analysis.reference_audio_url)}
          duration={analysis.reference_duration}
          badgeText="Ideal Baseline"
        />
        <AudioPlayer
          label="Participant Audio (Recitation Evaluated)"
          src={api.getAudioStreamUrl(analysis.participant_audio_url)}
          duration={analysis.participant_duration}
          seekTime={partSeekTime}
          onTimeUpdate={(t) => setPartCurrentTime(t)}
          badgeText="Target Recording"
        />
      </div>

      {/* Interactive Temporal Flaw Grounding Timeline */}
      <FlawTimeline
        duration={analysis.participant_duration}
        currentTime={partCurrentTime}
        flaws={analysis.flaws}
        onSeek={handleSeekParticipant}
        selectedFlawId={selectedFlawId}
        onSelectFlaw={handleSelectFlaw}
      />

      {/* Time-Series Recharts Graphs */}
      <FeatureCharts
        refFeatures={analysis.features.reference}
        partFeatures={analysis.features.participant}
        currentTime={partCurrentTime}
      />

      {/* Detected Delivery Flaws Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3 no-print">
          <div>
            <h3 className="text-base font-semibold text-white">
              Detected Delivery Deviations ({filteredFlaws.length} / {analysis.flaws.length})
            </h3>
            <p className="text-xs text-slate-400">
              Grounded timestamps with acoustic measurements and corrective coaching
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent text-slate-200 border-none focus:outline-none pr-2 py-0.5"
              >
                <option value="all" className="bg-slate-900">All Severities</option>
                <option value="high" className="bg-slate-900">High Severity</option>
                <option value="medium" className="bg-slate-900">Medium Severity</option>
                <option value="low" className="bg-slate-900">Low Severity</option>
              </select>
            </div>

            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-slate-200 border-none focus:outline-none pr-2 py-0.5"
              >
                <option value="all" className="bg-slate-900">All Categories</option>
                {uniqueFlawTypes.map((t) => (
                  <option key={t} value={t} className="bg-slate-900">
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Flaw Cards Grid */}
        {filteredFlaws.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
            {analysis.flaws.length === 0
              ? 'No delivery flaws detected! The participant matched reference delivery metrics across all evaluated categories.'
              : 'No flaws match the selected filters.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFlaws.map((flaw) => (
              <FlawCard
                key={flaw.id}
                flaw={flaw}
                isSelected={selectedFlawId === flaw.id}
                onPlaySegment={(start) => {
                  setSelectedFlawId(flaw.id);
                  handleSeekParticipant(start);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
