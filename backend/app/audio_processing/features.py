import numpy as np
import librosa
from scipy.signal import find_peaks
from typing import Dict, Any, List, Tuple, Optional
from backend.app.core.config import settings
from backend.app.core.logging import logger

def extract_features(
    y: np.ndarray,
    sr: int = settings.SAMPLE_RATE,
    hop_length: int = settings.HOP_LENGTH,
    n_fft: int = settings.N_FFT,
    transcript_words_count: Optional[int] = None
) -> Dict[str, Any]:
    """
    Extracts real acoustic features from audio waveform using Librosa and SciPy.
    Returns both time-indexed contours (for visualization and alignment)
    and aggregate summary statistics.
    """
    duration = float(len(y) / sr)

    # 1. RMS Energy (frame-level)
    rms = librosa.feature.rms(y=y, frame_length=n_fft, hop_length=hop_length)[0]
    n_frames = len(rms)
    times = librosa.frames_to_time(np.arange(n_frames), sr=sr, hop_length=hop_length)

    # 2. Zero Crossing Rate
    zcr = librosa.feature.zero_crossing_rate(y=y, frame_length=n_fft, hop_length=hop_length)[0]

    # 3. Spectral Centroid and Spectral Flatness
    spec_cent = librosa.feature.spectral_centroid(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length)[0]
    spec_flat = librosa.feature.spectral_flatness(y=y, n_fft=n_fft, hop_length=hop_length)[0]

    # 4. MFCCs (13 coefficients)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=settings.N_MFCC, n_fft=n_fft, hop_length=hop_length)
    mfcc_mean = np.mean(mfcc, axis=1).tolist()
    mfcc_std = np.std(mfcc, axis=1).tolist()

    # 5. Pitch / Fundamental Frequency (F0) estimation
    # Use librosa.yin with fmin=65Hz (deep male) to fmax=400Hz (high female)
    try:
        f0 = librosa.yin(
            y=y,
            fmin=65,
            fmax=400,
            sr=sr,
            frame_length=n_fft,
            hop_length=hop_length
        )
    except Exception as e:
        logger.warning(f"librosa.yin error: {e}. Falling back to zero pitch array.")
        f0 = np.zeros(n_frames)

    # Clean pitch: unvoiced regions often produce spurious or boundary fmin/fmax estimates
    # We use RMS energy gating and extreme boundaries to mask unvoiced frames
    energy_threshold = 0.05 * np.max(rms) if np.max(rms) > 0 else 0.01
    voiced_mask = (rms > energy_threshold) & (f0 > 70) & (f0 < 390)
    
    clean_f0 = np.copy(f0)
    clean_f0[~voiced_mask] = np.nan

    voiced_f0_values = clean_f0[~np.isnan(clean_f0)]
    if len(voiced_f0_values) > 5:
        mean_pitch = float(np.mean(voiced_f0_values))
        std_pitch = float(np.std(voiced_f0_values))
        pitch_p10 = float(np.percentile(voiced_f0_values, 10))
        pitch_p90 = float(np.percentile(voiced_f0_values, 90))
        # Semitone range (12 * log2(p90 / p10))
        if pitch_p10 > 0 and pitch_p90 > pitch_p10:
            semitone_range = float(12.0 * np.log2(pitch_p90 / pitch_p10))
        else:
            semitone_range = 0.0
    else:
        mean_pitch = 0.0
        std_pitch = 0.0
        semitone_range = 0.0

    # 6. Pause Detection & Silence Intervals
    # Silence is defined when RMS falls below relative dB threshold for >= 250ms
    rms_db = librosa.amplitude_to_db(rms, ref=np.max(rms) if np.max(rms) > 0 else 1.0)
    silence_mask = rms_db < -26.0  # Frames quieter than -26 dB from peak
    
    # Identify contiguous silence intervals
    min_pause_frames = int(0.25 * sr / hop_length)  # at least 250ms
    pauses: List[Dict[str, float]] = []
    
    in_pause = False
    p_start_idx = 0
    for idx, is_silent in enumerate(silence_mask):
        if is_silent and not in_pause:
            in_pause = True
            p_start_idx = idx
        elif not is_silent and in_pause:
            in_pause = False
            duration_frames = idx - p_start_idx
            if duration_frames >= min_pause_frames:
                start_t = float(times[p_start_idx])
                end_t = float(times[idx - 1])
                pauses.append({
                    "start": round(start_t, 3),
                    "end": round(end_t, 3),
                    "duration": round(end_t - start_t, 3)
                })
    if in_pause:
        duration_frames = n_frames - p_start_idx
        if duration_frames >= min_pause_frames:
            start_t = float(times[p_start_idx])
            end_t = float(times[-1])
            pauses.append({
                "start": round(start_t, 3),
                "end": round(end_t, 3),
                "duration": round(end_t - start_t, 3)
            })

    total_pause_time = sum(p["duration"] for p in pauses)
    pause_time_ratio = float(total_pause_time / duration) if duration > 0 else 0.0

    # 7. Speaking Rate Estimation
    # Two complementary approaches:
    # A. Acoustic syllable nucleus detection via envelope peak counting
    # B. Transcript word count / active speech time
    active_speech_time = max(duration - total_pause_time, 0.5)
    
    # Syllable bursts from smoothed envelope peaks in voiced regions
    peaks, _ = find_peaks(rms, height=0.15 * np.max(rms) if np.max(rms) > 0 else 0.01, distance=int(0.18 * sr / hop_length))
    estimated_syllables = len(peaks)
    
    if transcript_words_count and transcript_words_count > 0:
        # WPM based on total active speech duration
        estimated_wpm = float((transcript_words_count / (active_speech_time / 60.0)))
    else:
        # Average English word is ~1.5 syllables
        estimated_words = estimated_syllables / 1.5
        estimated_wpm = float((estimated_words / (active_speech_time / 60.0)))

    # Windowed speaking rate contour (words per minute over 3-second sliding window)
    window_sec = 3.0
    window_frames = int(window_sec * sr / hop_length)
    half_w = window_frames // 2
    local_wpm = np.zeros(n_frames)
    
    for i in range(n_frames):
        w_start = max(0, i - half_w)
        w_end = min(n_frames, i + half_w)
        w_dur = max(float(times[w_end - 1] - times[w_start]), 0.5)
        # Count peaks in this window
        p_in_win = np.sum((peaks >= w_start) & (peaks < w_end))
        w_words = p_in_win / 1.5
        local_wpm[i] = (w_words / (w_dur / 60.0))

    # Downsample time-series points for responsive frontend charting (target ~150-250 points)
    downsample_factor = max(1, n_frames // 200)
    timeseries_points = []
    for i in range(0, n_frames, downsample_factor):
        t = round(float(times[i]), 3)
        p_hz = round(float(clean_f0[i]), 1) if not np.isnan(clean_f0[i]) else None
        timeseries_points.append({
            "time": t,
            "pitch_hz": p_hz,
            "rms_energy": round(float(rms[i]), 4),
            "speaking_rate_wpm": round(float(local_wpm[i]), 1),
            "is_pause": bool(silence_mask[i]),
            "spectral_centroid_hz": round(float(spec_cent[i]), 1)
        })

    summary = {
        "duration_seconds": round(duration, 3),
        "estimated_wpm": round(estimated_wpm, 1),
        "total_pauses": len(pauses),
        "total_pause_duration": round(total_pause_time, 3),
        "pause_time_ratio": round(pause_time_ratio, 3),
        "mean_pitch_hz": round(mean_pitch, 1),
        "std_pitch_hz": round(std_pitch, 1),
        "pitch_semitone_range": round(semitone_range, 2),
        "mean_rms_energy": round(float(np.mean(rms)), 4),
        "std_rms_energy": round(float(np.std(rms)), 4),
        "mean_spectral_centroid_hz": round(float(np.mean(spec_cent)), 1),
        "mean_zero_crossing_rate": round(float(np.mean(zcr)), 4)
    }

    return {
        "summary": summary,
        "timeseries": timeseries_points,
        "pauses": pauses,
        "raw": {
            "times": times,
            "rms": rms,
            "f0": clean_f0,
            "local_wpm": local_wpm,
            "mfcc": mfcc,
            "spec_cent": spec_cent,
            "silence_mask": silence_mask
        }
    }
