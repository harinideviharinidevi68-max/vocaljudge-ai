# VocalJudge AI — Contrastive Speech Analytics & Temporal Flaw Grounding

> **Tagline:** Speak Better. Understand Every Flaw.  
> **Multimodal AI Hackathon 2026 — Track C: Audio & Speech AI**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6.svg)](https://www.typescriptlang.org)
[![Librosa](https://img.shields.io/badge/Acoustics-Librosa_1.0-orange.svg)](https://librosa.org)
[![Tests](https://img.shields.io/badge/Pytest-19_Passed-brightgreen.svg)](https://pytest.org)

---

## 1. Project Overview & Problem Statement

Speech competitions such as **Interpretive Reading, Declamation, Extemporaneous Speaking, and Persuasive Oratory** involve subjective evaluation of vocal delivery. Judges often disagree on tempo, vocal inflection, pauses, and rhetorical emphasis, frequently providing competitors with vague ballot feedback (*"speak more expressively"* or *"pacing felt off"*) without citing exact audio timestamps or measurable causes.

### The Core Innovation
**VocalJudge AI** compares the **exact same spoken transcript** under different delivery conditions against an ideal reference baseline. It identifies precisely where delivery deviates from the reference, calculates verifiable acoustic measurements, grounds flaws with exact second-level timestamps, and calculates reproducible rubric scores.

---

## 2. Key Features

- **Contrastive Acoustic Comparison**: Aligns participant performance with an ideal baseline performance reciting identical text.
- **Real Acoustic Measurements**: Extracted locally via **Librosa** and **SciPy** (F0 pitch via YIN, RMS energy dynamics, STFT spectral centroid, MFCCs, zero-crossing rate, pause distribution).
- **Acoustic Dynamic Time Warping (DTW)**: Maps varying speaking velocities onto a unified alignment path with phrase token grounding.
- **Temporal Flaw Grounding**: Every detected flaw is pinned with exact `[start, end]` timestamps, baseline value, measured value, relative percentage deviation, threshold rule, and actionable coaching feedback.
- **Deterministic 100-Point Rubric**:
  - Pacing & Rhythm: 25 points
  - Pitch & Vocal Variation: 20 points
  - Pauses & Timing: 20 points
  - Energy & Emphasis: 20 points
  - Clarity & Intelligibility: 15 points (provisional acoustic proxy)
- **Interactive Analytics Dashboard**:
  - Synchronized dual HTML5 audio playback (Reference & Participant)
  - Interactive visual timeline bar with clickable flaw markers that seek audio playback
  - Time-series Recharts (Pitch F0 contour, RMS energy dynamics, Speaking Rate WPM)
  - Detailed flaw cards with "Play This Segment" one-click seek
  - Filter by severity and flaw category
  - One-click JSON export and printable report view
- **Contrastive Dataset Explorer**:
  - Manage and query paired recordings by transcript ID, flaw type, or severity
  - In-browser playback of dataset audio
  - Automated integrity validator verifying filesystem audio presence
- **Analysis History**: Persisted evaluation records with score trends and management.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React, HTML5 Audio API.
- **Backend**: Python 3.13, FastAPI, Uvicorn, Librosa 1.0, SoundFile, NumPy 2.2, SciPy 1.15, Pydantic v2, Pytest.
- **Storage**: Modular JSON metadata storage and filesystem-based audio vaults.
- **No Paid APIs Required**: 100% of the extraction, alignment, scoring, and dashboard works locally out of the box with zero external API dependencies.

---

## 4. Project Structure

```
AI_Multimodel/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entrypoint
│   │   ├── core/                    # Config settings and logging
│   │   ├── schemas/                 # Pydantic models (Audio, Flaw, Rubric, Analysis, Dataset)
│   │   ├── audio_processing/        # Safe loader and Librosa feature extraction
│   │   ├── alignment/               # Acoustic DTW and phrase temporal aligner
│   │   ├── comparison/              # Contrastive comparison engine
│   │   ├── scoring/                 # 100-point rubric scoring engine
│   │   ├── dataset/                 # Dataset manifest manager
│   │   ├── services/                # Analysis orchestration and storage services
│   │   └── api/                     # REST API route handlers
│   ├── tests/                       # Pytest automated test suite (19 tests)
│   ├── requirements.txt             # Python dependencies
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/              # AudioPlayer, FlawTimeline, FeatureCharts, FlawCard, etc.
│   │   ├── pages/                   # Home, Upload, Results, Dataset, Rubric, History, Docs
│   │   ├── services/                # API client
│   │   ├── types/                   # TypeScript interfaces
│   │   └── utils/                   # Time and badge formatting helpers
│   ├── package.json
│   └── vite.config.ts
├── dataset/
│   ├── audio/                       # Paired WAV speech recordings
│   ├── metadata/manifest.json       # Validated dataset metadata manifest
│   └── README.md
├── scripts/
│   ├── generate_synthetic_samples.py # Synthesizes paired test waveforms
│   ├── prepare_dataset.py           # Dataset integrity validator
│   └── evaluate_flaws.py            # Temporal grounding benchmark evaluation
├── docs/
│   ├── architecture.md              # Technical system specifications
│   ├── dataset_methodology.md       # Contrastive dataset construction protocol
│   ├── scoring_methodology.md       # 100-point rubric formulation
│   └── evaluation.md                # Experimental benchmark results
├── pytest.ini
├── .gitignore
└── README.md
```

---

## 5. Quickstart & Installation

### Step 1: Clone & Setup Environment
```bash
git clone <your-repo-url>
cd AI_Multimodel
```

### Step 2: Backend Setup
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Generate synthetic audio samples (creates sample_reference, fast, pause, monotone, slow)
python scripts/generate_synthetic_samples.py

# Verify dataset integrity
python scripts/prepare_dataset.py

# Start FastAPI backend server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API documentation is now live at: `http://127.0.0.1:8000/docs`.

### Step 3: Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Open your browser at `http://127.0.0.1:5173`.

---

## 6. Running Tests & Benchmark Evaluation

### Automated Unit Tests (Pytest)
```bash
python -m pytest backend/tests -v
```
Output:
```
======================== 19 passed in 3.75s ========================
```

### Benchmark Temporal Grounding Evaluation
```bash
python scripts/evaluate_flaws.py
```
Output:
```
=======================================================
VOCALJUDGE AI: TEMPORAL FLAW GROUNDING BENCHMARK EVAL
Evaluating 4 annotated ground-truth recordings...
=======================================================
[HIT] rec_sample_fast_002 (excessive_speaking_rate): GT: [2.80s - 4.50s] PRED: [3.71s - 4.71s] (IoU: 0.414)
[HIT] rec_sample_pause_003 (excessive_pause):         GT: [3.20s - 5.60s] PRED: [3.71s - 6.08s] (IoU: 0.656)
[HIT] rec_sample_mono_004 (reduced_pitch_variation):  GT: [0.00s - 6.80s] PRED: [0.00s - 8.27s] (IoU: 0.822)
[HIT] rec_sample_slow_005 (unusually_slow_delivery):  GT: [0.00s - 9.50s] PRED: [0.00s - 11.05s] (IoU: 0.860)

EVALUATION SUMMARY RESULTS:
  Flaw Detection Precision:  100.0%
  Flaw Detection Recall:     100.0%
  F1-Score:                  100.0%
  Mean Temporal IoU:         0.688
  Mean Onset Boundary Error: 0.355 seconds
=======================================================
```

### Frontend Production Build
```bash
cd frontend
npm run build
```
Output:
```
✓ built in 12.42s
```

---

## 7. Known Limitations & Technical Scope

1. **Exact Transcript Requirement**: The contrastive alignment pipeline requires both reference and participant recordings to recite the same transcript text. Unrelated speeches cannot be compared.
2. **Clarity Evaluation**: Clarity is evaluated via acoustic spectral centroid and zero-crossing proxies; it is marked as **Provisional** rather than a full speech-to-text word error rate evaluation.
3. **Microphone Differences**: Normalized relative metrics (semitone dispersion and dynamic range ratios) are used to minimize hardware sensitivity; however, extreme acoustic background noise can impact pitch extraction fidelity.

---

## 8. License

This project is released under the **MIT License**.
