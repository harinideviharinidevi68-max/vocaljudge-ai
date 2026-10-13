import React from 'react';
import { FlawInterval } from '../types';
import { formatTimeShort } from '../utils/formatters';
import { AlertCircle, Zap } from 'lucide-react';

interface FlawTimelineProps {
  duration: number;
  currentTime?: number;
  flaws: FlawInterval[];
  onSeek: (time: number) => void;
  selectedFlawId?: string | null;
  onSelectFlaw?: (flawId: string) => void;
}

export const FlawTimeline: React.FC<FlawTimelineProps> = ({
  duration,
  currentTime = 0,
  flaws,
  onSeek,
  selectedFlawId,
  onSelectFlaw,
}) => {
  const totalDuration = Math.max(duration, 1.0);
  const currentPercent = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  const getFlawColor = (type: string, severity: string) => {
    switch (type) {
      case 'excessive_speaking_rate':
      case 'unusually_slow_delivery':
        return severity === 'high' ? 'bg-amber-500' : 'bg-amber-400';
      case 'excessive_pause':
        return severity === 'high' ? 'bg-rose-500' : 'bg-rose-400';
      case 'reduced_pitch_variation':
        return severity === 'high' ? 'bg-purple-500' : 'bg-purple-400';
      case 'unusual_energy_variation':
      case 'inconsistent_emphasis':
        return severity === 'high' ? 'bg-sky-500' : 'bg-sky-400';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-100">Temporal Flaw Grounding Timeline</h3>
          <span className="text-xs text-slate-400 font-mono">({flaws.length} flagged intervals)</span>
        </div>
        <div className="text-xs text-slate-400">
          Click any interval marker to seek audio playback
        </div>
      </div>

      {/* Main Timeline Bar */}
      <div 
        className="relative h-14 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden cursor-pointer select-none group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          onSeek(ratio * totalDuration);
        }}
      >
        {/* Subtle grid lines at every 10% */}
        <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="h-full border-r border-slate-600 w-0" />
          ))}
        </div>

        {/* Flaw Highlight Regions */}
        {flaws.map((flaw) => {
          const leftPercent = (flaw.start / totalDuration) * 100;
          const widthPercent = Math.max(1.5, ((flaw.end - flaw.start) / totalDuration) * 100);
          const isSelected = selectedFlawId === flaw.id;
          const colorClass = getFlawColor(flaw.type, flaw.severity);

          return (
            <div
              key={flaw.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectFlaw?.(flaw.id);
                onSeek(flaw.start);
              }}
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
              }}
              className={`absolute top-1 bottom-1 rounded transition-all cursor-pointer group/flaw ${colorClass} ${
                isSelected 
                  ? 'ring-2 ring-white z-20 opacity-100 shadow-lg' 
                  : 'opacity-75 hover:opacity-100 z-10'
              }`}
            >
              {/* Tooltip on hover */}
              <div className="hidden group-hover/flaw:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-slate-800 text-white text-[11px] rounded shadow-xl border border-slate-700 whitespace-nowrap z-50 pointer-events-none">
                <div className="font-semibold text-slate-100">{flaw.category_name}</div>
                <div className="text-slate-400 font-mono">
                  {formatTimeShort(flaw.start)} – {formatTimeShort(flaw.end)} ({flaw.severity})
                </div>
                <div className="text-blue-300">{flaw.threshold_rule}</div>
              </div>
            </div>
          );
        })}

        {/* Current Playback Cursor */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white z-30 pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{ left: `${currentPercent}%` }}
        >
          <div className="w-2.5 h-2.5 bg-white -ml-1 rounded-full shadow -top-1 absolute" />
        </div>
      </div>

      {/* Timestamp labels */}
      <div className="flex justify-between items-center mt-2 text-[11px] font-mono text-slate-400">
        <span>0:00.0</span>
        <span>{formatTimeShort(totalDuration * 0.25)}</span>
        <span>{formatTimeShort(totalDuration * 0.5)}</span>
        <span>{formatTimeShort(totalDuration * 0.75)}</span>
        <span>{formatTimeShort(totalDuration)}</span>
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-amber-500" />
          <span>Speaking Rate / Tempo</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-rose-500" />
          <span>Pause & Timing</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-purple-500" />
          <span>Pitch & Monotone</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-sky-500" />
          <span>Energy & Emphasis</span>
        </div>
      </div>
    </div>
  );
};
