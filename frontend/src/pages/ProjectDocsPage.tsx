import React from 'react';
import { BookOpen, Layers, Zap, Cpu, Award, ShieldCheck, Terminal, GitBranch } from 'lucide-react';

export const ProjectDocsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 text-slate-300">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="inline-flex items-center space-x-2 text-xs font-mono font-semibold text-blue-400 uppercase">
          <BookOpen className="w-4 h-4" />
          <span>System Documentation & Methodology</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
          VocalJudge AI Architecture & Technical Specifications
        </h1>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Contrastive Speech Analytics & Temporal Flaw Grounding for Competitive Vocal Delivery Evaluation.
        </p>
      </div>

      {/* Track & Problem Statement */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>1. Problem Statement & Track Alignment</span>
        </h2>
        <p className="text-sm leading-relaxed text-slate-300">
          In competitive speech and rhetorical forensics (Interpretive Reading, Declamation, Extemporaneous Speaking, and Persuasive Oratory), evaluation has historically remained subjective and uncalibrated. Judges frequently dispute delivery pace, vocal inflection, pause timing, and emphasis, offering competitors vague feedback such as <em>"speak more expressively"</em> without exact timestamps or measurable acoustic causes.
        </p>
        <p className="text-sm leading-relaxed text-slate-300">
          <strong>The VocalJudge Innovation:</strong> We compare the <em>exact same spoken transcript</em> under controlled delivery variations against an ideal reference performance, temporally align the recordings using acoustic Dynamic Time Warping (DTW), flag anomalous intervals with exact second-level timestamps, and compute evidence-based rubric scores.
        </p>
      </section>

      {/* System Architecture */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <span>2. End-to-End System Architecture</span>
        </h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
            [Frontend: React 19 + TypeScript + Tailwind CSS + Recharts]
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;↕ HTTP REST API (Upload, Alignment, Streaming, Analytics)
            <br />
            [Backend: FastAPI + Uvicorn + Pydantic v2]
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;├── Audio Preprocessing (SoundFile + Librosa 22.05 kHz resampling)
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;├── Acoustic Feature Extraction (YIN Pitch, RMS Energy, Centroids, MFCCs)
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;├── Temporal Aligner (MFCC-Guided Dynamic Time Warping + Phrase Tokens)
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;├── Contrastive Comparison Engine (Deviation Ratios & Sliding Windows)
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;├── Temporal Flaw Grounding (Frame Coalescence & Grounded Causal Reasoning)
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;└── 100-Point Transparent Rubric Engine (Bounded Deterministic Deductions)
          </div>
        </div>
      </section>

      {/* Mathematical Formulations */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <span>3. Mathematical Acoustic Formulations</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="font-semibold text-white">Dynamic Semitone Range (Pitch)</h4>
            <code className="block bg-slate-950 p-2 rounded border border-slate-800 text-sky-300 font-mono">
              Δst = 12 · log₂( P90(F₀) / P10(F₀) )
            </code>
            <p className="text-slate-400 leading-relaxed">
              Eliminates pitch register differences (e.g. bass vs soprano) by measuring musical semitone dispersion rather than raw Hz offsets.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="font-semibold text-white">Relative Speaking Rate Deviation</h4>
            <code className="block bg-slate-950 p-2 rounded border border-slate-800 text-amber-300 font-mono">
              ΔRate% = ((WPM_part - WPM_ref) / WPM_ref) · 100
            </code>
            <p className="text-slate-400 leading-relaxed">
              Triggers an excessive speed flaw when ΔRate% ≥ +35% (&gt; 175 WPM) or sluggish delivery when ΔRate% ≤ -35% (&lt; 110 WPM).
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="font-semibold text-white">Silence & Pause Detection</h4>
            <code className="block bg-slate-950 p-2 rounded border border-slate-800 text-rose-300 font-mono">
              Silence: RMS_dB &lt; -26 dB, Duration ≥ 250ms
            </code>
            <p className="text-slate-400 leading-relaxed">
              Flags hesitation gaps exceeding 1.40s where no corresponding rhetorical pause existed in the reference baseline.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="font-semibold text-white">Dynamic Time Warping Distance</h4>
            <code className="block bg-slate-950 p-2 rounded border border-slate-800 text-emerald-300 font-mono">
              D(i, j) = ||MFCC_ref(i) - MFCC_part(j)||₂ + min(D)
            </code>
            <p className="text-slate-400 leading-relaxed">
              Finds optimal nonlinear temporal alignment path between varying recitation tempos without stretching or corrupting raw audio.
            </p>
          </div>
        </div>
      </section>

      {/* CLI & Reproduction Commands */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <span>4. Local Execution & Evaluation Commands</span>
        </h2>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-2 text-slate-300">
          <div className="text-slate-500"># 1. Run Automated Pytest Suite (19 tests)</div>
          <div className="text-white">python -m pytest backend/tests -v</div>
          
          <div className="text-slate-500 pt-2"># 2. Run Temporal Flaw Benchmark Evaluation Script</div>
          <div className="text-white">python scripts/evaluate_flaws.py</div>

          <div className="text-slate-500 pt-2"># 3. Start Backend FastAPI Server</div>
          <div className="text-white">uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload</div>

          <div className="text-slate-500 pt-2"># 4. Start Vite Frontend Dashboard</div>
          <div className="text-white">cd frontend &amp;&amp; npm run dev</div>
        </div>
      </section>
    </div>
  );
};
