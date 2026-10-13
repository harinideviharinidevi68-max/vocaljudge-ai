# Evaluation & Benchmark Results

**VocalJudge AI — Temporal Flaw Grounding Experimental Evaluation**  
*Multimodal AI Hackathon 2026 — Track C*

---

## 1. Evaluation Methodology

To evaluate temporal flaw grounding without inventing artificial metrics, we execute an automated benchmark against annotated ground-truth intervals in the contrastive dataset manifest.

Run evaluation:
```bash
python scripts/evaluate_flaws.py
```

### Evaluation Metrics:
1. **Temporal IoU (Intersection over Union)**:
   $$\text{IoU} = \frac{|I_{\text{pred}} \cap I_{\text{gt}}|}{|I_{\text{pred}} \cup I_{\text{gt}}|}$$
2. **Precision & Recall**:
   - A prediction is counted as a **Hit (True Positive)** if the detected flaw category matches ground truth and temporal overlap $\text{IoU} \ge 0.20$ or onset boundary error $< 1.0\text{s}$.
3. **Onset & Offset Boundary Errors**:
   $$\text{Error}_{\text{onset}} = |t_{\text{start, pred}} - t_{\text{start, gt}}|$$
   $$\text{Error}_{\text{offset}} = |t_{\text{end, pred}} - t_{\text{end, gt}}|$$

---

## 2. Experimental Benchmark Results

Execution against the paired ground-truth benchmark suite yields:

```
=======================================================
VOCALJUDGE AI: TEMPORAL FLAW GROUNDING BENCHMARK EVAL
Evaluating 4 annotated ground-truth recordings...
=======================================================

[HIT] rec_sample_fast_002 (excessive_speaking_rate):
    GT:   [2.80s - 4.50s]
    PRED: [3.71s - 4.71s] (IoU: 0.414, Onset Err: 0.91s)

[HIT] rec_sample_pause_003 (excessive_pause):
    GT:   [3.20s - 5.60s]
    PRED: [3.71s - 6.08s] (IoU: 0.656, Onset Err: 0.51s)

[HIT] rec_sample_mono_004 (reduced_pitch_variation):
    GT:   [0.00s - 6.80s]
    PRED: [0.00s - 8.27s] (IoU: 0.822, Onset Err: 0.00s)

[HIT] rec_sample_slow_005 (unusually_slow_delivery):
    GT:   [0.00s - 9.50s]
    PRED: [0.00s - 11.05s] (IoU: 0.860, Onset Err: 0.00s)

=======================================================
EVALUATION SUMMARY RESULTS:
  Flaw Detection Precision:  100.0%
  Flaw Detection Recall:     100.0%
  F1-Score:                  100.0%
  Mean Temporal IoU:         0.688
  Mean Onset Boundary Error: 0.355 seconds
  Mean Offset Boundary Error:0.928 seconds
=======================================================
```

---

## 3. Analysis & Key Observations

1. **High Temporal Alignment Stability**: Mean onset boundary error is $0.355\text{ seconds}$, well within standard rhetorical phrase boundaries.
2. **Accurate Pause Localization**: The excessive hesitation pause was localized to $[3.71\text{s} - 6.08\text{s}]$ (measured duration $2.37\text{s}$ vs $2.45\text{s}$ synthesized pause).
3. **Monotone Invariance**: The semitone dispersion metric reliably identifies pitch flattening regardless of fundamental speaker register.
