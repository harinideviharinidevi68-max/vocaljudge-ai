# VocalJudge AI — Architecture & Technical Specifications

**Contrastive Speech Analytics & Temporal Flaw Grounding**  
*Multimodal AI Hackathon 2026 — Track C*

---

## 1. Executive Summary

Competitive speech forensics (Interpretive Reading, Declamation, Extemporaneous Speaking, and Persuasive Oratory) requires fine-grained adjudication of spoken delivery. Historically, human judge ballots provide subjective remarks (*"good pacing"*, *"needs more expression"*) without pointing to specific audio timestamps or measurable acoustic causes.

**VocalJudge AI** introduces contrastive delivery analytics:
1. Compares a participant's spoken recording against an ideal reference speech reciting the **exact same transcript**.
2. Extracts frame-level acoustic features using **Librosa** and **SciPy** (F0 pitch, RMS energy, spectral centroids, MFCCs, pauses).
3. Temporally aligns recordings using **acoustic Dynamic Time Warping (DTW)** and phrase tokens.
4. Detects delivery deviations grounded with **exact timestamps `[start, end]`**, reference baseline values, participant values, and percentage discrepancies.
5. Evaluates performances using a transparent, deterministic **100-point rubric**.

---

## 2. System Topology

```
+-------------------------------------------------------------------------+
|                              FRONTEND                                   |
|   React 19 + TypeScript + Vite + Tailwind CSS + Recharts + Lucide      |
|                                                                         |
|  [Home Dashboard]  [Upload Page]  [Results Dashboard] [Dataset Explorer]|
|  [Rubric Docs]     [Analysis History]  [Interactive Timeline & Player]  |
+------------------------------------+------------------------------------+
                                     | REST API (JSON / Audio Streams)
                                     v
+------------------------------------+------------------------------------+
|                               BACKEND                                   |
|                     FastAPI + Uvicorn + Pydantic v2                     |
+-------------------------------------------------------------------------+
| 1. AUDIO LOADER & PREPROCESSOR                                          |
|    - SoundFile + Librosa mono conversion, 22.05 kHz resampling          |
|    - Duration bounding (1s - 600s), zero-signal / silence protection   |
+-------------------------------------------------------------------------+
| 2. ACOUSTIC FEATURE EXTRACTION ENGINE                                   |
|    - Pitch (F0): Librosa YIN + RMS voicing gate (65 Hz - 400 Hz)        |
|    - RMS Energy: Frame-level amplitude + dynamic contrast range        |
|    - Spectral: Spectral centroid & zero-crossing rate (clarity proxy)   |
|    - MFCCs: 13 Mel-frequency cepstral coefficients                      |
|    - Speaking Rate: Dynamic windowed WPM & syllable nucleus peaks       |
|    - Pauses: RMS dB < -26 dB, duration >= 250ms                         |
+-------------------------------------------------------------------------+
| 3. TEMPORAL ALIGNMENT SERVICE                                           |
|    - Cost matrix distance over normalized MFCCs                         |
|    - Dynamic Time Warping path mapping participant -> reference frames  |
|    - Rhetorical phrase token segmentation                               |
+-------------------------------------------------------------------------+
| 4. CONTRASTIVE ENGINE & TEMPORAL FLAW GROUNDING                         |
|    - Excessive Speaking Rate (>= 35% speedup, > 175 WPM)                |
|    - Unusually Slow Delivery (>= 35% slowdown, < 110 WPM)               |
|    - Excessive Pauses (silence >= 1.40s without reference pause)        |
|    - Monotone Pitch (pitch std < 55% of reference dynamic inflection)   |
|    - Unusual Energy Variation (RMS dynamic range < 45% of reference)    |
|    - Coalesces adjacent flagged frames into continuous intervals        |
+-------------------------------------------------------------------------+
| 5. RUBRIC-BASED SCORING ENGINE                                          |
|    - 100-Point Rule Engine (Pacing 25, Pitch 20, Pauses 20,             |
|                             Energy 20, Clarity 15)                      |
|    - Bounded [0.0, 100.0] reproducible deductions                       |
+-------------------------------------------------------------------------+
| 6. DATASET & PERSISTENCE STORAGE                                        |
|    - File-based JSON manifests & audio vault                            |
+-------------------------------------------------------------------------+
```

---

## 3. Acoustic Processing Pipelines

### 3.1 Audio Resampling & Normalization
Incoming recordings in WAV or MP3 format are decoded via SoundFile and Librosa, resampled to standard sample rate $f_s = 22,050\text{ Hz}$, downmixed to mono, and peak-normalized:
$$y_{\text{norm}}(t) = \frac{y(t)}{\max |y(t)|}$$

### 3.2 Pitch Estimation (F0)
Fundamental frequency tracking uses the YIN algorithm with search bounds $[65\text{ Hz}, 400\text{ Hz}]$, frame length $N_{\text{fft}} = 2048$, and hop length $H = 512$:
- Unvoiced masking: Frames with RMS energy below $5\%$ of peak energy or outside valid frequency bounds are masked as unvoiced ($\text{NaN}$).
- Pitch Semitone Dispersion:
$$\Delta\text{st} = 12 \cdot \log_2\left(\frac{P_{90}(F_0)}{P_{10}(F_0)}\right)$$

### 3.3 Dynamic Time Warping (DTW) Alignment
Normalized 13-dimensional MFCC vectors are computed for reference $X \in \mathbb{R}^{13 \times M}$ and participant $Y \in \mathbb{R}^{13 \times N}$. The optimal temporal warping path $W = \{(w_{r, 1}, w_{p, 1}), \dots, (w_{r, K}, w_{p, K})\}$ minimizes total Euclidean distance:
$$\mathcal{D}(X, Y) = \min_W \sum_{k=1}^K \|X(w_{r, k}) - Y(w_{p, k})\|_2$$
Phrase tokens from the shared transcript are mapped onto the warping path, providing continuous temporal anchors.

---

## 4. API Specification

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | System status, sample rate, capabilities, and data counts |
| `/api/audio/upload` | POST | Upload and validate audio file, returns metadata |
| `/api/audio/stream/{audio_id}` | GET | HTML5 audio streaming |
| `/api/analyze` | POST | Runs feature extraction, alignment, flaw grounding, scoring |
| `/api/analysis/{analysis_id}` | GET | Retrieves stored analysis JSON |
| `/api/analysis/{analysis_id}` | DELETE | Deletes stored analysis safely |
| `/api/dataset` | GET / POST | Contrastive dataset records CRUD & filters |
| `/api/dataset/validate` | GET | Validates dataset manifest schema & file presence |
| `/api/rubric` | GET | Active rubric weights and formulas |
| `/api/history` | GET | List of historical analyses |
