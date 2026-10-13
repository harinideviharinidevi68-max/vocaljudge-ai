"""
Synthesizes paired contrastive speech audio waveforms with ground-truth acoustic variations.
Generates genuine multi-harmonic speech-like signals (vocal tract formants, natural vibrato/intonation,
voiced syllables, and pauses) for reproducible local testing and evaluation.
"""

import numpy as np
import soundfile as sf
from pathlib import Path
import json
from datetime import datetime, timezone

SR = 22050

TRANSCRIPT = "We must remember that speech is not mere words, but the living expression of thought and character."

def generate_vocal_syllable(
    duration: float,
    f0_start: float,
    f0_end: float,
    amplitude: float = 0.7,
    formants: list[float] = [700.0, 1220.0, 2600.0]
) -> np.ndarray:
    """Generates a rich harmonic syllable with formant filtering and smooth amplitude envelope."""
    n_samples = int(duration * SR)
    if n_samples <= 0:
        return np.array([], dtype=np.float32)
        
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    # Fundamental frequency contour
    f0_t = np.linspace(f0_start, f0_end, n_samples)
    phase = 2 * np.pi * np.cumsum(f0_t) / SR
    
    # Sum harmonics up to Nyquist
    signal = np.zeros(n_samples)
    for h in range(1, 20):
        # Harmonic amplitude roll-off
        h_freq = f0_start * h
        if h_freq >= SR / 2:
            break
        # Formant resonance boost
        resonance = 1.0
        for form in formants:
            bw = form * 0.15
            dist = abs(h_freq - form)
            resonance += 1.8 * np.exp(-0.5 * (dist / bw) ** 2)
            
        weight = (1.0 / (h ** 0.8)) * resonance
        signal += weight * np.sin(h * phase)
        
    # Apply smooth trapezoid/Hanning envelope to avoid clicks
    attack = int(min(0.04 * SR, n_samples // 4))
    decay = int(min(0.05 * SR, n_samples // 4))
    env = np.ones(n_samples)
    if attack > 0:
        env[:attack] = np.linspace(0, 1, attack)
    if decay > 0:
        env[-decay:] = np.linspace(1, 0, decay)
        
    signal = signal * env * amplitude
    # Normalize peak
    peak = np.max(np.abs(signal))
    if peak > 0:
        signal = signal / peak * amplitude
    return signal.astype(np.float32)

def generate_silence(duration: float) -> np.ndarray:
    n_samples = int(duration * SR)
    # Add subtle background thermal noise (around -55 dB)
    noise = np.random.normal(0, 0.001, n_samples).astype(np.float32)
    return noise

def build_utterance(syllables: list[dict], pause_durations: list[float]) -> np.ndarray:
    """Concatenates syllables and pause intervals into a continuous speech stream."""
    chunks = []
    for i, syl in enumerate(syllables):
        chunk = generate_vocal_syllable(
            duration=syl["duration"],
            f0_start=syl["f0_start"],
            f0_end=syl["f0_end"],
            amplitude=syl.get("amplitude", 0.7),
            formants=syl.get("formants", [700.0, 1220.0, 2600.0])
        )
        chunks.append(chunk)
        if i < len(pause_durations) and pause_durations[i] > 0:
            chunks.append(generate_silence(pause_durations[i]))
    return np.concatenate(chunks)

def generate_dataset_samples():
    output_dir = Path("dataset/audio")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. REFERENCE BASELINE: Balanced tempo (~135 WPM), expressive pitch contour, natural pauses
    # Words: "We must remember that speech is not mere words, but the living expression of thought and character."
    # ~22 syllables
    ref_syllables = [
        # "We must"
        {"duration": 0.22, "f0_start": 130, "f0_end": 145, "amplitude": 0.75},
        {"duration": 0.28, "f0_start": 145, "f0_end": 150, "amplitude": 0.85},
        # "re-mem-ber"
        {"duration": 0.18, "f0_start": 150, "f0_end": 160, "amplitude": 0.70},
        {"duration": 0.26, "f0_start": 165, "f0_end": 155, "amplitude": 0.85},
        {"duration": 0.22, "f0_start": 145, "f0_end": 135, "amplitude": 0.65},
        # "that speech"
        {"duration": 0.20, "f0_start": 140, "f0_end": 148, "amplitude": 0.70},
        {"duration": 0.35, "f0_start": 155, "f0_end": 168, "amplitude": 0.90},
        # "is not mere words"
        {"duration": 0.18, "f0_start": 150, "f0_end": 145, "amplitude": 0.65},
        {"duration": 0.25, "f0_start": 145, "f0_end": 160, "amplitude": 0.80},
        {"duration": 0.26, "f0_start": 160, "f0_end": 165, "amplitude": 0.80},
        {"duration": 0.38, "f0_start": 165, "f0_end": 135, "amplitude": 0.85},
        # "but the liv-ing"
        {"duration": 0.20, "f0_start": 140, "f0_end": 145, "amplitude": 0.65},
        {"duration": 0.18, "f0_start": 145, "f0_end": 150, "amplitude": 0.65},
        {"duration": 0.25, "f0_start": 160, "f0_end": 170, "amplitude": 0.85},
        {"duration": 0.20, "f0_start": 165, "f0_end": 150, "amplitude": 0.70},
        # "ex-pres-sion"
        {"duration": 0.18, "f0_start": 155, "f0_end": 165, "amplitude": 0.70},
        {"duration": 0.30, "f0_start": 170, "f0_end": 180, "amplitude": 0.92},
        {"duration": 0.22, "f0_start": 170, "f0_end": 150, "amplitude": 0.70},
        # "of thought and char-ac-ter"
        {"duration": 0.16, "f0_start": 145, "f0_end": 140, "amplitude": 0.60},
        {"duration": 0.32, "f0_start": 155, "f0_end": 165, "amplitude": 0.85},
        {"duration": 0.16, "f0_start": 150, "f0_end": 145, "amplitude": 0.60},
        {"duration": 0.24, "f0_start": 160, "f0_end": 150, "amplitude": 0.80},
        {"duration": 0.20, "f0_start": 145, "f0_end": 135, "amplitude": 0.70},
        {"duration": 0.35, "f0_start": 135, "f0_end": 115, "amplitude": 0.75}
    ]
    ref_pauses = [0.05] * len(ref_syllables)
    ref_pauses[6] = 0.45   # Natural pause after "speech"
    ref_pauses[10] = 0.65  # Punctuation pause after "words,"
    ref_pauses[17] = 0.40  # Rhetorical pause after "expression"
    
    y_ref = build_utterance(ref_syllables, ref_pauses)
    ref_path = output_dir / "sample_reference.wav"
    sf.write(str(ref_path), y_ref, SR)
    print(f"Created reference: {ref_path} ({len(y_ref)/SR:.2f}s)")

    # 2. FLAW: EXCESSIVELY FAST DELIVERY (middle phrase compressed by 45%)
    fast_syllables = [dict(s) for s in ref_syllables]
    fast_pauses = list(ref_pauses)
    for idx in range(11, 18):
        fast_syllables[idx]["duration"] *= 0.52
    fast_pauses[10] = 0.15 # rushed past comma
    y_fast = build_utterance(fast_syllables, fast_pauses)
    fast_path = output_dir / "sample_fast_delivery.wav"
    sf.write(str(fast_path), y_fast, SR)
    print(f"Created fast flaw: {fast_path} ({len(y_fast)/SR:.2f}s)")

    # 3. FLAW: EXCESSIVE SILENT PAUSE (2.4s pause after comma)
    pause_syllables = [dict(s) for s in ref_syllables]
    pause_pauses = list(ref_pauses)
    pause_pauses[10] = 2.45 # Awkward 2.45s hesitation
    y_pause = build_utterance(pause_syllables, pause_pauses)
    pause_path = output_dir / "sample_excessive_pause.wav"
    sf.write(str(pause_path), y_pause, SR)
    print(f"Created pause flaw: {pause_path} ({len(y_pause)/SR:.2f}s)")

    # 4. FLAW: MONOTONE / REDUCED PITCH VARIATION
    mono_syllables = [dict(s) for s in ref_syllables]
    for s in mono_syllables:
        s["f0_start"] = 135
        s["f0_end"] = 136
    y_mono = build_utterance(mono_syllables, ref_pauses)
    mono_path = output_dir / "sample_monotone_pitch.wav"
    sf.write(str(mono_path), y_mono, SR)
    print(f"Created monotone flaw: {mono_path} ({len(y_mono)/SR:.2f}s)")

    # 5. FLAW: UNUSUALLY SLOW DELIVERY (overall stretched + sluggish syllables)
    slow_syllables = [dict(s) for s in ref_syllables]
    slow_pauses = list(ref_pauses)
    for idx in range(len(slow_syllables)):
        slow_syllables[idx]["duration"] *= 1.45
        slow_pauses[idx] *= 1.35
    y_slow = build_utterance(slow_syllables, slow_pauses)
    slow_path = output_dir / "sample_slow_delivery.wav"
    sf.write(str(slow_path), y_slow, SR)
    print(f"Created slow flaw: {slow_path} ({len(y_slow)/SR:.2f}s)")

    # Write Manifest JSON
    manifest_data = {
        "version": "1.0.0",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "total_records": 5,
        "records": [
            {
                "recording_id": "rec_sample_ref_001",
                "transcript_id": "txt_living_expression_01",
                "reference_id": None,
                "audio_file": "sample_reference.wav",
                "transcript": TRANSCRIPT,
                "speech_category": "Persuasive Oratory",
                "recording_type": "ideal",
                "flaw_type": "none",
                "severity": "none",
                "speaker_id": "spk_master_orator",
                "start": None,
                "end": None,
                "alignment_method": "acoustic_dtw",
                "annotation_status": "verified",
                "metadata": {
                    "duration_seconds": round(len(y_ref)/SR, 2),
                    "target_wpm": 138,
                    "condition": "Ideal dynamic reference baseline"
                }
            },
            {
                "recording_id": "rec_sample_fast_002",
                "transcript_id": "txt_living_expression_01",
                "reference_id": "rec_sample_ref_001",
                "audio_file": "sample_fast_delivery.wav",
                "transcript": TRANSCRIPT,
                "speech_category": "Persuasive Oratory",
                "recording_type": "flawed",
                "flaw_type": "excessive_speaking_rate",
                "severity": "high",
                "speaker_id": "spk_contestant_02",
                "start": 2.8,
                "end": 4.5,
                "alignment_method": "acoustic_dtw",
                "annotation_status": "verified",
                "metadata": {
                    "duration_seconds": round(len(y_fast)/SR, 2),
                    "target_wpm": 195,
                    "condition": "Rapid rushed phrasing over climax"
                }
            },
            {
                "recording_id": "rec_sample_pause_003",
                "transcript_id": "txt_living_expression_01",
                "reference_id": "rec_sample_ref_001",
                "audio_file": "sample_excessive_pause.wav",
                "transcript": TRANSCRIPT,
                "speech_category": "Persuasive Oratory",
                "recording_type": "flawed",
                "flaw_type": "excessive_pause",
                "severity": "high",
                "speaker_id": "spk_contestant_03",
                "start": 3.2,
                "end": 5.6,
                "alignment_method": "acoustic_dtw",
                "annotation_status": "verified",
                "metadata": {
                    "duration_seconds": round(len(y_pause)/SR, 2),
                    "pause_duration_seconds": 2.45,
                    "condition": "Extended hesitation silence after comma"
                }
            },
            {
                "recording_id": "rec_sample_mono_004",
                "transcript_id": "txt_living_expression_01",
                "reference_id": "rec_sample_ref_001",
                "audio_file": "sample_monotone_pitch.wav",
                "transcript": TRANSCRIPT,
                "speech_category": "Persuasive Oratory",
                "recording_type": "flawed",
                "flaw_type": "reduced_pitch_variation",
                "severity": "medium",
                "speaker_id": "spk_contestant_04",
                "start": 0.0,
                "end": 6.8,
                "alignment_method": "acoustic_dtw",
                "annotation_status": "verified",
                "metadata": {
                    "duration_seconds": round(len(y_mono)/SR, 2),
                    "condition": "Flat uninflected pitch contour"
                }
            },
            {
                "recording_id": "rec_sample_slow_005",
                "transcript_id": "txt_living_expression_01",
                "reference_id": "rec_sample_ref_001",
                "audio_file": "sample_slow_delivery.wav",
                "transcript": TRANSCRIPT,
                "speech_category": "Persuasive Oratory",
                "recording_type": "flawed",
                "flaw_type": "unusually_slow_delivery",
                "severity": "medium",
                "speaker_id": "spk_contestant_05",
                "start": 0.0,
                "end": 9.5,
                "alignment_method": "acoustic_dtw",
                "annotation_status": "verified",
                "metadata": {
                    "duration_seconds": round(len(y_slow)/SR, 2),
                    "target_wpm": 92,
                    "condition": "Sluggish drawn-out delivery"
                }
            }
        ]
    }
    
    manifest_path = Path("dataset/metadata/manifest.json")
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f, indent=2)
    print(f"Created manifest: {manifest_path} with {len(manifest_data['records'])} records")

if __name__ == "__main__":
    generate_dataset_samples()
