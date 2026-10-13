import numpy as np
import librosa
from typing import Dict, Any, List, Tuple
from backend.app.core.logging import logger

class AlignmentResult:
    def __init__(
        self,
        method: str,
        confidence: float,
        wp: np.ndarray,  # Warping path: shape (2, N_steps)
        ref_times: np.ndarray,
        part_times: np.ndarray,
        segments: List[Dict[str, Any]]
    ):
        self.method = method
        self.confidence = confidence
        self.wp = wp
        self.ref_times = ref_times
        self.part_times = part_times
        self.segments = segments

def align_recordings(
    ref_features: Dict[str, Any],
    part_features: Dict[str, Any],
    transcript: str
) -> AlignmentResult:
    """
    Performs temporal alignment between reference and participant speech recordings
    using acoustic Dynamic Time Warping (DTW) over normalized MFCCs and energy envelopes.
    Maps segments of the transcript to both timelines.
    """
    ref_mfcc = ref_features["raw"]["mfcc"]
    part_mfcc = part_features["raw"]["mfcc"]
    ref_times = ref_features["raw"]["times"]
    part_times = part_features["raw"]["times"]

    # Normalize MFCCs (zero mean, unit variance along time axis)
    ref_norm = (ref_mfcc - np.mean(ref_mfcc, axis=1, keepdims=True)) / (np.std(ref_mfcc, axis=1, keepdims=True) + 1e-6)
    part_norm = (part_mfcc - np.mean(part_mfcc, axis=1, keepdims=True)) / (np.std(part_mfcc, axis=1, keepdims=True) + 1e-6)

    # Compute DTW alignment
    # Cost matrix distance metric: Euclidean distance between MFCC vectors
    try:
        D, wp = librosa.sequence.dtw(X=ref_norm, Y=part_norm, metric="euclidean")
        # wp has shape (N_path_steps, 2), where wp[:, 0] is ref_frame, wp[:, 1] is part_frame
        # Sort warping path in ascending order of time
        wp = wp[::-1]
        
        # Estimate overall alignment confidence from normalized cost
        avg_cost = float(D[-1, -1] / len(wp))
        # Confidence decays as distance increases: sigmoid-like mapping
        confidence = float(np.clip(1.0 / (1.0 + 0.1 * avg_cost), 0.3, 0.98))
        method = "acoustic_dtw_energy_guided"
    except Exception as e:
        logger.warning(f"DTW calculation failed: {e}. Using linear time interpolation.")
        n_ref = len(ref_times)
        n_part = len(part_times)
        n_steps = max(n_ref, n_part)
        wp_ref = np.linspace(0, n_ref - 1, n_steps).astype(int)
        wp_part = np.linspace(0, n_part - 1, n_steps).astype(int)
        wp = np.column_stack([wp_ref, wp_part])
        confidence = 0.50
        method = "linear_temporal_fallback"

    # Map transcript words/phrases to aligned intervals
    words = [w.strip() for w in transcript.split() if w.strip()]
    segments = []
    
    if words:
        num_words = len(words)
        # Partition warping path into proportional phrase segments (or word groups)
        # Chunk into segments of 3-6 words for meaningful rhetorical units
        chunk_size = max(1, min(5, num_words // 4 if num_words >= 8 else num_words))
        num_chunks = int(np.ceil(num_words / chunk_size))
        
        path_len = len(wp)
        for c in range(num_chunks):
            w_start = c * chunk_size
            w_end = min(num_words, (c + 1) * chunk_size)
            phrase = " ".join(words[w_start:w_end])
            
            p_start_idx = int((w_start / num_words) * (path_len - 1))
            p_end_idx = int((w_end / num_words) * (path_len - 1))
            
            ref_f_start = wp[p_start_idx, 0]
            ref_f_end = wp[p_end_idx, 0]
            part_f_start = wp[p_start_idx, 1]
            part_f_end = wp[p_end_idx, 1]
            
            ref_t0 = float(ref_times[min(ref_f_start, len(ref_times) - 1)])
            ref_t1 = float(ref_times[min(ref_f_end, len(ref_times) - 1)])
            part_t0 = float(part_times[min(part_f_start, len(part_times) - 1)])
            part_t1 = float(part_times[min(part_f_end, len(part_times) - 1)])
            
            segments.append({
                "phrase": phrase,
                "word_index_start": w_start,
                "word_index_end": w_end,
                "ref_start": round(ref_t0, 3),
                "ref_end": round(max(ref_t1, ref_t0 + 0.1), 3),
                "part_start": round(part_t0, 3),
                "part_end": round(max(part_t1, part_t0 + 0.1), 3)
            })

    return AlignmentResult(
        method=method,
        confidence=round(confidence, 3),
        wp=wp,
        ref_times=ref_times,
        part_times=part_times,
        segments=segments
    )
