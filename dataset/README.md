# Contrastive Speech Audio Repository

**Directory Layout:**
- `audio/`: WAV format speech recordings (22,050 Hz mono).
- `metadata/manifest.json`: Validated paired metadata manifest.

**Paired Test Recordings:**
1. `sample_reference.wav`: Ideal balanced persuasive speech delivery (~138 WPM, rich pitch contour, natural pauses).
2. `sample_fast_delivery.wav`: Flawed recitation with rushed climax phrase (>190 WPM).
3. `sample_excessive_pause.wav`: Flawed recitation with awkward 2.45s mid-sentence hesitation.
4. `sample_monotone_pitch.wav`: Flawed recitation with flattened fundamental frequency contour.
5. `sample_slow_delivery.wav`: Flawed recitation with sluggish elongated phrasing.

**Re-generation & Validation:**
```bash
python scripts/generate_synthetic_samples.py
python scripts/prepare_dataset.py
```
