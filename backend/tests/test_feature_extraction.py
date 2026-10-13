import pytest
import numpy as np
from pathlib import Path
from backend.app.audio_processing.loader import load_audio
from backend.app.audio_processing.features import extract_features

def test_feature_extraction_completeness():
    audio_path = Path("dataset/audio/sample_reference.wav")
    y, sr, _ = load_audio(audio_path)
    
    features = extract_features(y, sr, transcript_words_count=16)
    
    # Check structure
    assert "summary" in features
    assert "timeseries" in features
    assert "pauses" in features
    assert "raw" in features
    
    summary = features["summary"]
    assert summary["duration_seconds"] > 5.0
    assert summary["estimated_wpm"] > 50.0
    assert summary["mean_pitch_hz"] > 50.0
    assert summary["mean_rms_energy"] > 0.001
    assert summary["mean_spectral_centroid_hz"] > 200.0
    
    # Check time series points have valid timestamps
    timeseries = features["timeseries"]
    assert len(timeseries) > 50
    assert timeseries[0]["time"] == 0.0
    assert timeseries[-1]["time"] > 5.0
    for pt in timeseries:
        assert pt["time"] >= 0.0
        assert pt["rms_energy"] >= 0.0

def test_pause_detection():
    audio_path = Path("dataset/audio/sample_excessive_pause.wav")
    y, sr, _ = load_audio(audio_path)
    features = extract_features(y, sr)
    
    pauses = features["pauses"]
    assert len(pauses) >= 1
    # Check that the ~2.4s pause was detected
    max_pause = max(p["duration"] for p in pauses)
    assert max_pause >= 2.0
