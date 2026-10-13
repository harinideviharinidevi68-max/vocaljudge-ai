# Contrastive Speech Dataset Methodology

**VocalJudge AI — Benchmark Dataset Construction Protocol**  
*Multimodal AI Hackathon 2026 — Track C*

---

## 1. Motivation & Contrastive Paradigm

Traditional speech datasets evaluate phonetic recognition or emotion categorization, but rarely capture fine-grained rhetorical delivery flaws under controlled identical text.

In speech forensics, adjudicators evaluate the speaker's vocal control rather than their vocabulary choice. To isolate vocal delivery from lexical semantics, the VocalJudge dataset is structured around **contrastive pairs**:

$$\text{Pair}(R, P) = \{ (R, T), (P, T) \mid T_R \equiv T_P \}$$

Where:
- $T$: Identical speech transcript.
- $R$: Ideal reference baseline performance reciting $T$.
- $P$: Participant recording exhibiting deliberate or natural delivery deviations reciting $T$.

---

## 2. Controlled Delivery Flaw Taxonomy

The dataset captures five primary categories of delivery variations:

| Category Code | Human Label | Typical Cause | Acoustic Signature |
|---|---|---|---|
| `excessive_speaking_rate` | Pushed / Rushed Cadence | Nervousness, poor pacing | Local WPM $\ge 1.35 \times$ reference, compressed phrase duration |
| `unusually_slow_delivery` | Sluggish / Dragging Tempo | Hesitation, over-deliberation | Local WPM $\le 0.65 \times$ reference, elongated phrase duration |
| `excessive_pause` | Awkward Hesitation | Memory lapse, awkward breathing | Continuous silence $\ge 1.40\text{s}$ with RMS $< -26\text{ dB}$ |
| `reduced_pitch_variation` | Monotone Reading | Flat affect, lack of emotional engagement | $\sigma(F_0) < 55\%$ of reference, dynamic semitone range $< 2.0\text{ st}$ |
| `unusual_energy_variation` | Muted / Inconsistent Stress | Lack of vocal projection | Phrase $\Delta\text{RMS} < 45\%$ of reference contrast |

---

## 3. Annotation & Ground-Truth Labeling Protocol

Each record in `dataset/metadata/manifest.json` contains:
```json
{
  "recording_id": "rec_sample_fast_002",
  "transcript_id": "txt_living_expression_01",
  "reference_id": "rec_sample_ref_001",
  "audio_file": "sample_fast_delivery.wav",
  "transcript": "We must remember that speech is not mere words, but the living expression of thought and character.",
  "speech_category": "Persuasive Oratory",
  "recording_type": "flawed",
  "flaw_type": "excessive_speaking_rate",
  "severity": "high",
  "speaker_id": "spk_contestant_02",
  "start": 2.8,
  "end": 4.5,
  "alignment_method": "acoustic_dtw",
  "annotation_status": "verified"
}
```

1. **Temporal Boundaries**: Ground-truth intervals `[start, end]` are annotated in seconds relative to recording onset.
2. **Severity Grading**:
   - `high`: Deviation exceeds $45\%$ relative discrepancy or degrades intelligibility.
   - `medium`: Deviation between $25\%$ and $45\%$ relative discrepancy.
   - `low`: Deviation between $15\%$ and $25\%$ noticeable deviation.
3. **Anonymization**: All recordings use synthetic or anonymized speaker keys (`spk_anon_XX`).
4. **Licensing**: Publicly released baseline transcripts are derived from public domain competitive oratory or synthetically rendered waveforms to avoid copyright infringement.

---

## 4. Verification & Validation Pipeline

Run the automated dataset validator:
```bash
python scripts/prepare_dataset.py
```
This script ensures:
- JSON schema conformance to `DatasetManifest` Pydantic model.
- Every audio file exists in `dataset/audio/`.
- Every audio file is safely decodable and non-empty.
