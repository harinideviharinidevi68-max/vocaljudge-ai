import pytest
import numpy as np
import soundfile as sf
from pathlib import Path
from backend.app.audio_processing.loader import load_audio, AudioLoadError, AudioSilenceError, AudioDurationError

def test_load_valid_audio():
    audio_path = Path("dataset/audio/sample_reference.wav")
    assert audio_path.is_file(), "Reference audio sample must exist"
    
    y, sr, meta = load_audio(audio_path)
    assert isinstance(y, np.ndarray)
    assert sr == 22050
    assert meta["duration_seconds"] > 1.0
    assert meta["channels"] in (1, 2)
    assert meta["rms_energy"] > 0.01

def test_load_nonexistent_audio():
    with pytest.raises(AudioLoadError):
        load_audio("nonexistent_file_path_123.wav")

def test_load_silent_audio(tmp_path):
    silent_file = tmp_path / "silence.wav"
    # Create 3 seconds of perfect zeros
    zeros = np.zeros(22050 * 3, dtype=np.float32)
    sf.write(str(silent_file), zeros, 22050)
    
    with pytest.raises(AudioSilenceError):
        load_audio(silent_file)

def test_load_short_audio(tmp_path):
    short_file = tmp_path / "short.wav"
    # Create 0.2 seconds audio (below 1.0s limit)
    signal = np.sin(2 * np.pi * 440 * np.linspace(0, 0.2, int(22050 * 0.2))).astype(np.float32)
    sf.write(str(short_file), signal, 22050)
    
    with pytest.raises(AudioDurationError):
        load_audio(short_file)
