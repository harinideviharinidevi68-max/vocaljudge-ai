import os
from pathlib import Path
from typing import Tuple, Dict, Any
import numpy as np
import soundfile as sf
import librosa
from backend.app.core.config import settings
from backend.app.core.logging import logger

class AudioLoadError(Exception):
    pass

class AudioSilenceError(AudioLoadError):
    pass

class AudioDurationError(AudioLoadError):
    pass

def load_audio(
    file_path: str | Path,
    target_sr: int = settings.SAMPLE_RATE
) -> Tuple[np.ndarray, int, Dict[str, Any]]:
    """
    Safely loads audio file, converts to mono, resamples to target_sr,
    and runs sanity checks for corruption, silence, and duration.
    Retains original file intact for playback.
    """
    path = Path(file_path)
    if not path.is_file():
        raise AudioLoadError(f"Audio file does not exist: {file_path}")

    file_size = path.stat().st_size
    if file_size == 0:
        raise AudioLoadError("Audio file is empty (0 bytes)")

    try:
        # First read basic audio info via soundfile
        info = sf.info(str(path))
        orig_sr = info.samplerate
        channels = info.channels
        orig_duration = info.duration
    except Exception as e:
        logger.warning(f"SoundFile info probe failed for {path.name}: {e}. Falling back to librosa.")
        orig_sr = target_sr
        channels = 1
        orig_duration = 0.0

    # Load audio array using librosa (handles resampling and mono conversion cleanly)
    try:
        y, sr = librosa.load(str(path), sr=target_sr, mono=True)
    except Exception as e:
        raise AudioLoadError(f"Failed to decode audio file {path.name}: {str(e)}")

    if y is None or len(y) == 0:
        raise AudioLoadError(f"Loaded audio signal is empty for {path.name}")

    duration = float(len(y) / sr)

    # Validate duration bounds
    if duration < settings.MIN_DURATION_SECONDS:
        raise AudioDurationError(
            f"Audio duration ({duration:.2f}s) is shorter than minimum required ({settings.MIN_DURATION_SECONDS}s)"
        )
    if duration > settings.MAX_DURATION_SECONDS:
        raise AudioDurationError(
            f"Audio duration ({duration:.2f}s) exceeds maximum allowed ({settings.MAX_DURATION_SECONDS}s)"
        )

    # Check for silent or dead recording
    rms = float(np.sqrt(np.mean(y**2)))
    if rms < 1e-5:
        raise AudioSilenceError(
            f"Audio signal is completely silent (RMS energy = {rms:.2e}). Please check recording input."
        )

    # Peak normalization to prevent clipping artifacts during STFT
    peak = float(np.max(np.abs(y)))
    if peak > 0:
        y_normalized = y / peak
    else:
        y_normalized = y

    meta: Dict[str, Any] = {
        "filename": path.name,
        "sample_rate": sr,
        "original_sample_rate": orig_sr,
        "channels": channels,
        "duration_seconds": round(duration, 3),
        "samples_count": len(y),
        "rms_energy": rms,
        "peak_amplitude": peak,
        "size_bytes": file_size
    }

    return y_normalized, sr, meta
