import pytest
from backend.app.schemas.rubric import RubricConfig
from backend.app.schemas.flaw import FlawInterval
from backend.app.scoring.rubric_engine import evaluate_rubric

def test_rubric_scoring_bounded():
    config = RubricConfig()
    
    # Mock ideal identical features
    ref_feat = {
        "summary": {
            "estimated_wpm": 140.0,
            "pitch_semitone_range": 4.5,
            "pause_time_ratio": 0.15,
            "total_pauses": 4,
            "std_rms_energy": 0.06,
            "mean_spectral_centroid_hz": 2000.0
        }
    }
    part_feat = {
        "summary": {
            "estimated_wpm": 140.0,
            "pitch_semitone_range": 4.5,
            "pause_time_ratio": 0.15,
            "total_pauses": 4,
            "std_rms_energy": 0.06,
            "mean_spectral_centroid_hz": 2000.0
        }
    }
    
    eval_ideal = evaluate_rubric(ref_feat, part_feat, flaws=[], config=config)
    assert eval_ideal.overall_score == 100.0
    assert eval_ideal.category_scores["pacing"] == 25.0
    assert eval_ideal.category_scores["pitch_variation"] == 20.0
    assert eval_ideal.category_scores["pauses"] == 20.0
    assert eval_ideal.category_scores["energy"] == 20.0
    assert eval_ideal.category_scores["clarity"] == 15.0

def test_rubric_scoring_with_deductions():
    config = RubricConfig()
    ref_feat = {
        "summary": {
            "estimated_wpm": 140.0,
            "pitch_semitone_range": 4.5,
            "pause_time_ratio": 0.15,
            "total_pauses": 4,
            "std_rms_energy": 0.06,
            "mean_spectral_centroid_hz": 2000.0
        }
    }
    # Monotone and slow participant
    part_feat = {
        "summary": {
            "estimated_wpm": 90.0,
            "pitch_semitone_range": 1.0,
            "pause_time_ratio": 0.35,
            "total_pauses": 8,
            "std_rms_energy": 0.02,
            "mean_spectral_centroid_hz": 1200.0
        }
    }
    mock_flaws = [
        FlawInterval(
            id="f1",
            type="unusually_slow_delivery",
            category_name="Pacing & Speed",
            start=1.0,
            end=4.0,
            transcript_segment="test",
            severity="high",
            reference_value=140.0,
            participant_value=90.0,
            relative_deviation_percent=-35.0,
            threshold_rule="rule",
            evidence="evidence",
            explanation="explanation",
            recommendation="recommendation"
        )
    ]
    
    eval_flawed = evaluate_rubric(ref_feat, part_feat, flaws=mock_flaws, config=config)
    assert 0.0 <= eval_flawed.overall_score < 100.0
    assert eval_flawed.category_scores["pacing"] < 25.0
    assert eval_flawed.category_scores["pitch_variation"] < 20.0
    assert eval_flawed.category_scores["pauses"] < 20.0
