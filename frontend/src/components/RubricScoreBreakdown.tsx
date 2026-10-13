import React from 'react';
import { RubricEvaluationResult } from '../types';
import { getScoreColor, getScoreBgColor } from '../utils/formatters';
import { Award, Info } from 'lucide-react';

interface RubricScoreBreakdownProps {
  overallScore: number;
  categoryScores: Record<string, number>;
  evaluation?: RubricEvaluationResult;
}

export const RubricScoreBreakdown: React.FC<RubricScoreBreakdownProps> = ({
  overallScore,
  categoryScores,
  evaluation,
}) => {
  const categories = [
    { key: 'pacing', name: 'Pacing & Rhythm', max: 25 },
    { key: 'pitch_variation', name: 'Pitch & Vocal Variation', max: 20 },
    { key: 'pauses', name: 'Pauses & Timing', max: 20 },
    { key: 'energy', name: 'Energy & Emphasis', max: 20 },
    { key: 'clarity', name: 'Clarity & Intelligibility', max: 15 },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      {/* Overall Score Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Rubric Delivery Evaluation
            </h2>
            <p className="text-xs text-slate-400">
              Version {evaluation?.rubric_version || '1.0.0'} • Transparent 100-Point Rule Engine
            </p>
          </div>
        </div>

        <div className="flex items-baseline space-x-2 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
          <span className={`text-4xl font-extrabold tracking-tight ${getScoreColor(overallScore)}`}>
            {overallScore.toFixed(1)}
          </span>
          <span className="text-sm font-medium text-slate-400">/ 100.0</span>
        </div>
      </div>

      {/* Category Score Bars */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const score = categoryScores[cat.key] ?? cat.max;
          const percent = (score / cat.max) * 100;
          const detail = evaluation?.details?.[cat.key];

          return (
            <div key={cat.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 font-medium text-slate-200">
                  <span>{cat.name}</span>
                  {detail?.status === 'provisional' && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      Provisional
                    </span>
                  )}
                </div>
                <div className="font-mono text-slate-300">
                  <span className="font-semibold text-white">{score.toFixed(1)}</span>
                  <span className="text-slate-400"> / {cat.max} pts</span>
                  <span className="text-slate-400 ml-2">({percent.toFixed(0)}%)</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${getScoreBgColor(percent)}`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Formula & Deduction Note */}
              {detail && (
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="truncate max-w-[85%]">{detail.formula}</span>
                  {detail.deductions > 0 ? (
                    <span className="text-rose-400">-{detail.deductions.toFixed(1)} pts</span>
                  ) : (
                    <span className="text-emerald-400">Full Score</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Methodology Disclaimer */}
      {evaluation?.methodology_notes && (
        <div className="mt-5 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
          <div className="flex items-center space-x-1 text-slate-300 font-medium mb-1">
            <Info className="w-3.5 h-3.5" />
            <span>Evaluation Notes:</span>
          </div>
          {evaluation.methodology_notes.map((note, idx) => (
            <p key={idx} className="text-[11px] leading-relaxed">
              • {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
