from typing import Dict, Any, List
import numpy as np
from backend.app.schemas.rubric import RubricConfig, RubricEvaluationResult, CategoryScoreDetail
from backend.app.schemas.flaw import FlawInterval

def evaluate_rubric(
    ref_features: Dict[str, Any],
    part_features: Dict[str, Any],
    flaws: List[FlawInterval],
    config: RubricConfig = RubricConfig()
) -> RubricEvaluationResult:
    """
    Computes reproducible, rubric-based competitive speech delivery scores (0-100).
    Uses transparent, documented acoustic feature rules and flaw deductions.
    Ensures bounded scores with detailed mathematical breakdowns.
    """
    ref_sum = ref_features["summary"]
    part_sum = part_features["summary"]
    
    details: Dict[str, CategoryScoreDetail] = {}
    cat_scores: Dict[str, float] = {}
    
    # -------------------------------------------------------------
    # 1. Pacing and Rhythm (Max: 25.0 pts)
    # -------------------------------------------------------------
    max_pacing = config.weights.get("pacing", 25.0)
    # Baseline comparison: overall WPM ratio
    r_wpm = max(ref_sum.get("estimated_wpm", 140.0), 10.0)
    p_wpm = max(part_sum.get("estimated_wpm", 140.0), 10.0)
    wpm_ratio = p_wpm / r_wpm  # ideal is near 1.0
    
    # Deduction for macro tempo deviation
    tempo_deviation = abs(1.0 - wpm_ratio)
    macro_pacing_penalty = min(8.0, tempo_deviation * 16.0)
    
    # Local flaw deductions for excessive rate / unusually slow
    pacing_flaws = [f for f in flaws if f.type in ("excessive_speaking_rate", "unusually_slow_delivery", "irregular_pacing")]
    local_pacing_penalty = sum(
        4.0 if f.severity == "high" else 2.5 for f in pacing_flaws
    )
    
    pacing_deductions = round(min(max_pacing, macro_pacing_penalty + local_pacing_penalty), 2)
    pacing_score = round(max(0.0, max_pacing - pacing_deductions), 1)
    cat_scores["pacing"] = pacing_score
    details["pacing"] = CategoryScoreDetail(
        category_key="pacing",
        category_name=config.category_names.get("pacing", "Pacing & Rhythm"),
        max_score=max_pacing,
        score=pacing_score,
        percentage=round((pacing_score / max_pacing) * 100, 1),
        deductions=pacing_deductions,
        formula="score = 25 - min(25, macro_tempo_penalty + sum(local_rate_flaws))",
        contributing_measurements={
            "reference_wpm": round(r_wpm, 1),
            "participant_wpm": round(p_wpm, 1),
            "wpm_ratio": round(wpm_ratio, 2),
            "detected_pacing_flaws": len(pacing_flaws)
        }
    )

    # -------------------------------------------------------------
    # 2. Pitch and Vocal Variation (Max: 20.0 pts)
    # -------------------------------------------------------------
    max_pitch = config.weights.get("pitch_variation", 20.0)
    r_semitones = max(ref_sum.get("pitch_semitone_range", 4.0), 0.5)
    p_semitones = max(part_sum.get("pitch_semitone_range", 4.0), 0.1)
    
    # Ratio of semitone range compared to reference baseline
    st_ratio = min(p_semitones / r_semitones, 1.3)
    macro_pitch_penalty = max(0.0, (1.0 - st_ratio) * 10.0) if st_ratio < 1.0 else 0.0
    
    pitch_flaws = [f for f in flaws if f.type == "reduced_pitch_variation"]
    local_pitch_penalty = sum(3.5 if f.severity == "high" else 2.0 for f in pitch_flaws)
    
    pitch_deductions = round(min(max_pitch, macro_pitch_penalty + local_pitch_penalty), 2)
    pitch_score = round(max(0.0, max_pitch - pitch_deductions), 1)
    cat_scores["pitch_variation"] = pitch_score
    details["pitch_variation"] = CategoryScoreDetail(
        category_key="pitch_variation",
        category_name=config.category_names.get("pitch_variation", "Pitch & Vocal Variation"),
        max_score=max_pitch,
        score=pitch_score,
        percentage=round((pitch_score / max_pitch) * 100, 1),
        deductions=pitch_deductions,
        formula="score = 20 - min(20, semitone_range_deficit + sum(monotone_flaws))",
        contributing_measurements={
            "reference_semitone_range": round(r_semitones, 2),
            "participant_semitone_range": round(p_semitones, 2),
            "semitone_ratio": round(st_ratio, 2),
            "monotone_flaw_count": len(pitch_flaws)
        }
    )

    # -------------------------------------------------------------
    # 3. Pauses and Timing (Max: 20.0 pts)
    # -------------------------------------------------------------
    max_pauses = config.weights.get("pauses", 20.0)
    r_pause_ratio = ref_sum.get("pause_time_ratio", 0.18)
    p_pause_ratio = part_sum.get("pause_time_ratio", 0.18)
    
    pause_ratio_diff = abs(p_pause_ratio - r_pause_ratio)
    macro_pause_penalty = min(7.0, pause_ratio_diff * 25.0)
    
    pause_flaws = [f for f in flaws if f.type == "excessive_pause"]
    local_pause_penalty = sum(4.0 if f.severity == "high" else 2.5 for f in pause_flaws)
    
    pause_deductions = round(min(max_pauses, macro_pause_penalty + local_pause_penalty), 2)
    pause_score = round(max(0.0, max_pauses - pause_deductions), 1)
    cat_scores["pauses"] = pause_score
    details["pauses"] = CategoryScoreDetail(
        category_key="pauses",
        category_name=config.category_names.get("pauses", "Pauses & Timing"),
        max_score=max_pauses,
        score=pause_score,
        percentage=round((pause_score / max_pauses) * 100, 1),
        deductions=pause_deductions,
        formula="score = 20 - min(20, pause_ratio_discrepancy + sum(excessive_pause_flaws))",
        contributing_measurements={
            "reference_pause_ratio": round(r_pause_ratio, 3),
            "participant_pause_ratio": round(p_pause_ratio, 3),
            "total_participant_pauses": part_sum.get("total_pauses", 0),
            "excessive_pause_count": len(pause_flaws)
        }
    )

    # -------------------------------------------------------------
    # 4. Energy and Emphasis (Max: 20.0 pts)
    # -------------------------------------------------------------
    max_energy = config.weights.get("energy", 20.0)
    r_std_energy = max(ref_sum.get("std_rms_energy", 0.05), 1e-4)
    p_std_energy = max(part_sum.get("std_rms_energy", 0.05), 1e-4)
    
    energy_var_ratio = min(p_std_energy / r_std_energy, 1.3)
    macro_energy_penalty = max(0.0, (1.0 - energy_var_ratio) * 8.0) if energy_var_ratio < 1.0 else 0.0
    
    energy_flaws = [f for f in flaws if f.type == "unusual_energy_variation"]
    local_energy_penalty = sum(3.0 if f.severity == "high" else 1.5 for f in energy_flaws)
    
    energy_deductions = round(min(max_energy, macro_energy_penalty + local_energy_penalty), 2)
    energy_score = round(max(0.0, max_energy - energy_deductions), 1)
    cat_scores["energy"] = energy_score
    details["energy"] = CategoryScoreDetail(
        category_key="energy",
        category_name=config.category_names.get("energy", "Energy & Emphasis"),
        max_score=max_energy,
        score=energy_score,
        percentage=round((energy_score / max_energy) * 100, 1),
        deductions=energy_deductions,
        formula="score = 20 - min(20, dynamic_contrast_deficit + sum(energy_flaws))",
        contributing_measurements={
            "reference_energy_std": round(r_std_energy, 4),
            "participant_energy_std": round(p_std_energy, 4),
            "energy_variation_ratio": round(energy_var_ratio, 2),
            "energy_flaw_count": len(energy_flaws)
        }
    )

    # -------------------------------------------------------------
    # 5. Clarity & Intelligibility (Max: 15.0 pts)
    # -------------------------------------------------------------
    # Transparent spectral centroid & ZCR articulation proxy
    max_clarity = config.weights.get("clarity", 15.0)
    r_centroid = max(ref_sum.get("mean_spectral_centroid_hz", 2000.0), 500.0)
    p_centroid = max(part_sum.get("mean_spectral_centroid_hz", 2000.0), 500.0)
    
    centroid_ratio = min(p_centroid / r_centroid, 1.4)
    clarity_deduction = 0.0
    if centroid_ratio < 0.70:
        clarity_deduction = round(min(6.0, (0.70 - centroid_ratio) * 15.0), 2)
        
    clarity_score = round(max(0.0, max_clarity - clarity_deduction), 1)
    cat_scores["clarity"] = clarity_score
    details["clarity"] = CategoryScoreDetail(
        category_key="clarity",
        category_name=config.category_names.get("clarity", "Clarity & Intelligibility"),
        max_score=max_clarity,
        score=clarity_score,
        percentage=round((clarity_score / max_clarity) * 100, 1),
        deductions=clarity_deduction,
        formula="score = 15 - spectral_brightness_clarity_deficit (provisional acoustic proxy)",
        contributing_measurements={
            "reference_centroid_hz": round(r_centroid, 1),
            "participant_centroid_hz": round(p_centroid, 1),
            "centroid_ratio": round(centroid_ratio, 2)
        },
        status="provisional"
    )

    overall_score = round(sum(cat_scores.values()), 1)
    overall_score = float(np.clip(overall_score, 0.0, config.total_max_score))

    notes = [
        f"Rubric Version {config.version} applied with deterministic acoustic rules.",
        "Scores are computed relative to reference performance of identical transcript.",
        "Clarity score is a provisional acoustic spectral brightness proxy and not an ASR word-error-rate evaluation."
    ]

    return RubricEvaluationResult(
        rubric_version=config.version,
        overall_score=overall_score,
        category_scores=cat_scores,
        details=details,
        methodology_notes=notes
    )
