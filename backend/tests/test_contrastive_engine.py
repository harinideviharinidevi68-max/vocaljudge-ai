import pytest
from pathlib import Path
from backend.app.audio_processing.loader import load_audio
from backend.app.audio_processing.features import extract_features
from backend.app.alignment.aligner import align_recordings
from backend.app.comparison.contrastive_engine import detect_delivery_flaws

def test_contrastive_flaw_detection_pause():
    ref_y, ref_sr, _ = load_audio("dataset/audio/sample_reference.wav")
    pause_y, pause_sr, _ = load_audio("dataset/audio/sample_excessive_pause.wav")
    
    transcript = "We must remember that speech is not mere words, but the living expression of thought and character."
    
    ref_feat = extract_features(ref_y, ref_sr, transcript_words_count=16)
    pause_feat = extract_features(pause_y, pause_sr, transcript_words_count=16)
    
    align = align_recordings(ref_feat, pause_feat, transcript)
    flaws = detect_delivery_flaws(ref_feat, pause_feat, align)
    
    assert len(flaws) >= 1
    # Verify excessive_pause is among detected flaws
    flaw_types = [f.type for f in flaws]
    assert "excessive_pause" in flaw_types
    
    pause_flaw = next(f for f in flaws if f.type == "excessive_pause")
    assert pause_flaw.start > 0.0
    assert pause_flaw.end > pause_flaw.start
    assert pause_flaw.participant_value > 2.0
    assert pause_flaw.relative_deviation_percent > 50.0
    assert len(pause_flaw.evidence) > 10
    assert len(pause_flaw.recommendation) > 10

def test_contrastive_flaw_detection_monotone():
    ref_y, ref_sr, _ = load_audio("dataset/audio/sample_reference.wav")
    mono_y, mono_sr, _ = load_audio("dataset/audio/sample_monotone_pitch.wav")
    transcript = "We must remember that speech is not mere words, but the living expression of thought and character."
    
    ref_feat = extract_features(ref_y, ref_sr, transcript_words_count=16)
    mono_feat = extract_features(mono_y, mono_sr, transcript_words_count=16)
    
    align = align_recordings(ref_feat, mono_feat, transcript)
    flaws = detect_delivery_flaws(ref_feat, mono_feat, align)
    
    flaw_types = [f.type for f in flaws]
    assert "reduced_pitch_variation" in flaw_types
