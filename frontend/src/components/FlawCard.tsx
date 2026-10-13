import React from 'react';
import { FlawInterval } from '../types';
import { formatTimeShort, formatPercent, getSeverityBadgeClass } from '../utils/formatters';
import { Play, AlertTriangle, Lightbulb, Compass, FileText } from 'lucide-react';

interface FlawCardProps {
  flaw: FlawInterval;
  onPlaySegment: (start: number) => void;
  isSelected?: boolean;
}

export const FlawCard: React.FC<FlawCardProps> = ({
  flaw,
  onPlaySegment,
  isSelected = false,
}) => {
  return (
    <div
      className={`bg-slate-900 border rounded-xl p-5 transition-all shadow-sm ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30 bg-slate-900/90'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-sm text-slate-100">
            {flaw.category_name}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${getSeverityBadgeClass(
              flaw.severity
            )}`}
          >
            {flaw.severity} severity
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-medium px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {formatTimeShort(flaw.start)} – {formatTimeShort(flaw.end)}
          </span>
          <button
            onClick={() => onPlaySegment(flaw.start)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-medium transition-colors shadow-sm"
            title="Seek playback to this timestamp"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Play Segment</span>
          </button>
        </div>
      </div>

      {/* Transcript Segment Quote */}
      {flaw.transcript_segment && (
        <div className="flex items-start space-x-2 mb-3 px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs">
          <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
          <span className="text-slate-300 italic">
            "{flaw.transcript_segment}"
          </span>
        </div>
      )}

      {/* Mathematical Measurement Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 py-2.5 px-3 mb-3 bg-slate-950/60 rounded-lg border border-slate-800/60 text-xs font-mono">
        <div>
          <div className="text-[11px] text-slate-400">Reference Baseline</div>
          <div className="font-semibold text-sky-400 mt-0.5">
            {flaw.reference_value}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Participant Measured</div>
          <div className="font-semibold text-amber-400 mt-0.5">
            {flaw.participant_value}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Deviation</div>
          <div
            className={`font-semibold mt-0.5 ${
              flaw.relative_deviation_percent > 0 ? 'text-rose-400' : 'text-blue-400'
            }`}
          >
            {formatPercent(flaw.relative_deviation_percent)}
          </div>
        </div>
      </div>

      {/* Acoustic Evidence Statement */}
      <div className="mb-2 text-xs text-slate-300 flex items-start space-x-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div>
          <strong className="text-slate-200">Evidence: </strong>
          <span>{flaw.evidence}</span>
        </div>
      </div>

      {/* Causal Explanation */}
      <div className="mb-2 text-xs text-slate-300 flex items-start space-x-2">
        <Compass className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
        <div>
          <strong className="text-slate-200">Delivery Analysis: </strong>
          <span>{flaw.explanation}</span>
        </div>
      </div>

      {/* Actionable Coaching Recommendation */}
      <div className="text-xs text-emerald-300/90 bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-2.5 flex items-start space-x-2">
        <Lightbulb className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
        <div>
          <strong className="text-emerald-200">Recommendation: </strong>
          <span>{flaw.recommendation}</span>
        </div>
      </div>
    </div>
  );
};
