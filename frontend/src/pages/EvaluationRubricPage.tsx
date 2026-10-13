import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Sliders, ShieldAlert, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import { RubricConfig } from '../types';

export const EvaluationRubricPage: React.FC = () => {
  const [rubric, setRubric] = useState<RubricConfig | null>(null);

  useEffect(() => {
    api.getRubric().then(setRubric).catch(console.error);
  }, []);

  const rubricCategories = [
    {
      key: 'pacing',
      name: 'Pacing & Rhythm',
      weight: 25,
      formula: 'score = 25 - min(25, macro_tempo_penalty + sum(local_rate_flaws))',
      description:
        'Evaluates macro words-per-minute (WPM) ratio and local syllable velocity. Penalizes rushing through core rhetorical assertions or dragging sluggishly.',
      acousticRules: [
        'Macro WPM Ratio: Deviation between participant WPM and reference baseline WPM.',
        'Local Flaws: Phrase speedup > 35% (> 175 WPM) or slowdown > 35% (< 110 WPM).',
        'Deduction: -4.0 pts for High severity, -2.5 pts for Medium severity.',
      ],
    },
    {
      key: 'pitch_variation',
      name: 'Pitch & Vocal Variation',
      weight: 20,
      formula: 'score = 20 - min(20, semitone_range_deficit + sum(monotone_flaws))',
      description:
        'Quantifies melodic pitch range (semitones) and fundamental frequency (F0) standard deviation over voiced speech segments.',
      acousticRules: [
        'F0 Tracking: Librosa YIN pitch estimator masked by RMS voicing gate.',
        'Dynamic Semitone Range: 12 * log2(P90_F0 / P10_F0).',
        'Monotone Flag: Phrase pitch std < 55% of reference dynamic inflection.',
      ],
    },
    {
      key: 'pauses',
      name: 'Pauses & Timing',
      weight: 20,
      formula: 'score = 20 - min(20, pause_ratio_discrepancy + sum(excessive_pause_flaws))',
      description:
        'Distinguishes natural punctuation pauses (0.4s - 0.8s) from unprompted awkward hesitation gaps (> 1.5s).',
      acousticRules: [
        'Silence Threshold: RMS energy < -26 dB relative to peak amplitude.',
        'Minimum Silence Interval: Contiguous unvoiced frames >= 250 milliseconds.',
        'Excessive Pause Flaw: Silence duration >= 1.40s without corresponding reference rhetorical pause.',
      ],
    },
    {
      key: 'energy',
      name: 'Energy & Emphasis',
      weight: 20,
      formula: 'score = 20 - min(20, dynamic_contrast_deficit + sum(energy_flaws))',
      description:
        'Measures frame-level RMS energy dynamic range and stress contrast on emphasized keywords and rhetorical climax phrases.',
      acousticRules: [
        'Dynamic Range: max(RMS) - min(RMS) across phrase windows.',
        'Muted Dynamics Flaw: Participant energy contrast < 45% of reference contrast on stressed phrase.',
        'Normalized to eliminate distance-from-microphone volume biases.',
      ],
    },
    {
      key: 'clarity',
      name: 'Clarity & Intelligibility',
      weight: 15,
      formula: 'score = 15 - spectral_brightness_clarity_deficit (provisional acoustic proxy)',
      description:
        'Uses short-time Fourier transform (STFT) spectral centroid and zero-crossing rate as an acoustic brightness and articulation proxy.',
      acousticRules: [
        'Spectral Centroid: Center of mass of the frequency spectrum.',
        'Muffled Articulation Warning: Centroid ratio < 70% of reference baseline.',
        'Transparently labeled as provisional acoustic proxy, avoiding fabricated ASR claims.',
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-blue-400 uppercase">
          <Award className="w-4 h-4" />
          <span>Rubric Specification • Track C</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Objective 100-Point Delivery Rubric
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Version {rubric?.version || '1.0.0'} — Fully deterministic, evidence-based mathematical evaluation.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {rubricCategories.map((c) => (
          <div key={c.key} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center shadow-sm">
            <div className="text-2xl font-black text-blue-400">{c.weight}</div>
            <div className="text-xs font-semibold text-slate-200 mt-1">{c.name}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.weight}% Weight</div>
          </div>
        ))}
      </div>

      {/* Detailed Categories */}
      <div className="space-y-4">
        {rubricCategories.map((c) => (
          <div
            key={c.key}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  {c.weight}pt
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">{c.name}</h3>
                  <p className="text-xs text-slate-400">{c.description}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-medium px-2.5 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
                Max: {c.weight}.0
              </span>
            </div>

            {/* Formula Block */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-xs text-indigo-300">
              <code>{c.formula}</code>
            </div>

            {/* Acoustic Rules List */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold text-slate-300">
                Measurable Acoustic Rules:
              </span>
              <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
                {c.acousticRules.map((rule, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Scientific Transparency Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-2 text-xs text-slate-400 shadow-sm">
        <div className="flex items-center space-x-2 text-slate-200 font-semibold">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span>Scientific Disclaimer & Ethical Grounding:</span>
        </div>
        <p className="leading-relaxed">
          The VocalJudge AI evaluation rubric is designed specifically for contrastive speech competitions with identical recitation transcripts. Acoustic similarity does not replace rhetorical charisma; rather, it anchors subjective adjudication in reproducible, temporal ground-truth deviations.
        </p>
      </div>
    </div>
  );
};
