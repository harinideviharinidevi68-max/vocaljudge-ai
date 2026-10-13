# Rubric & Scoring Methodology

**VocalJudge AI — 100-Point Objective Delivery Rubric**  
*Multimodal AI Hackathon 2026 — Track C*

---

## 1. Principles of Contrastive Scoring

The VocalJudge AI scoring engine replaces subjective ballot opinions with reproducible, rule-based acoustic deductions.

**Guiding Principles:**
1. **Bounded Deductions**: All category scores remain within $[0.0, \text{MaxScore}]$ and the overall score remains within $[0.0, 100.0]$.
2. **Transparent Formulas**: Every deduction displays its contributing measurement, formula, and acoustic threshold.
3. **No Fabricated Intelligibility Claims**: Articulation clarity is transparently flagged as a provisional spectral brightness proxy, not an unverified automatic speech recognition WER score.

---

## 2. Category Weights & Formulations

The total score is 100 points, distributed across five categories:

| Category | Max Points | Measurement Method |
|---|---|---|
| **Pacing & Rhythm** | 25.0 | Macro WPM ratio + Local speedup/slowdown flaws |
| **Pitch & Vocal Variation** | 20.0 | Semitone dispersion range + Monotone segment penalties |
| **Pauses & Timing** | 20.0 | Pause-to-speech ratio + Awkward hesitation gap penalties |
| **Energy & Emphasis** | 20.0 | Dynamic RMS range contrast on stressed phrases |
| **Clarity & Intelligibility** | 15.0 | STFT Spectral centroid & Zero-crossing rate proxy |

### 2.1 Pacing & Rhythm (25 pts)
$$\text{Score}_{\text{pacing}} = \max\left(0, 25 - \min\left(25, \text{Penalty}_{\text{macro}} + \sum \text{Deduction}_{\text{flaw}}\right)\right)$$
- $\text{Penalty}_{\text{macro}} = \min(8.0, |1.0 - \text{Ratio}_{\text{wpm}}| \times 16.0)$
- Flaw Deductions: $-4.0\text{ pts}$ per high severity rate flaw; $-2.5\text{ pts}$ per medium severity.

### 2.2 Pitch & Vocal Variation (20 pts)
$$\text{Score}_{\text{pitch}} = \max\left(0, 20 - \min\left(20, \text{Deficit}_{\text{semitones}} + \sum \text{Deduction}_{\text{monotone}}\right)\right)$$
- Measures semitone dispersion: $\Delta\text{st} = 12 \log_2(P_{90}(F_0)/P_{10}(F_0))$.
- If semitone ratio $< 1.0$, deficit penalty applies up to $10.0\text{ pts}$.
- Monotone phrase flaws deduct $-3.5\text{ pts}$ (high) or $-2.0\text{ pts}$ (medium).

### 2.3 Pauses & Timing (20 pts)
$$\text{Score}_{\text{pauses}} = \max\left(0, 20 - \min\left(20, \text{Discrepancy}_{\text{pause\_ratio}} + \sum \text{Deduction}_{\text{hesitation}}\right)\right)$$
- Pause ratio discrepancy: $|R_{\text{pause, part}} - R_{\text{pause, ref}}| \times 25.0$ (capped at $7.0\text{ pts}$).
- Unprompted hesitation gaps ($> 1.40\text{s}$) deduct $-4.0\text{ pts}$ (high) or $-2.5\text{ pts}$ (medium).

### 2.4 Energy & Emphasis (20 pts)
$$\text{Score}_{\text{energy}} = \max\left(0, 20 - \min\left(20, \text{Deficit}_{\text{dynamic\_range}} + \sum \text{Deduction}_{\text{energy}}\right)\right)$$
- Evaluates dynamic RMS contrast across stressed rhetorical clauses.
- Muted dynamic contrast deducts $-3.0\text{ pts}$ (high) or $-1.5\text{ pts}$ (medium).

### 2.5 Clarity & Intelligibility (15 pts) [Provisional]
$$\text{Score}_{\text{clarity}} = \max(0, 15 - \text{Deficit}_{\text{spectral\_centroid}})$$
- Compares mean spectral centroid $C_{\text{mean}}$ against reference baseline. If centroid ratio $< 0.70$, deduction applies up to $6.0\text{ pts}$.
- Status is clearly marked as **Provisional** in API and UI.
