from pydantic import BaseModel, Field
from typing import Dict, Any, List

class CategoryScoreDetail(BaseModel):
    category_key: str
    category_name: str
    max_score: float
    score: float
    percentage: float
    deductions: float
    formula: str
    contributing_measurements: Dict[str, Any]
    status: str = "computed"  # "computed" or "provisional"

class RubricConfig(BaseModel):
    version: str = "1.0.0"
    total_max_score: float = 100.0
    weights: Dict[str, float] = {
        "pacing": 25.0,
        "pitch_variation": 20.0,
        "pauses": 20.0,
        "energy": 20.0,
        "clarity": 15.0
    }
    category_names: Dict[str, str] = {
        "pacing": "Pacing & Rhythm",
        "pitch_variation": "Pitch & Vocal Variation",
        "pauses": "Pauses & Timing",
        "energy": "Energy & Emphasis",
        "clarity": "Clarity & Intelligibility"
    }
    thresholds: Dict[str, Any] = {
        "rate_ratio_fast": 1.25,
        "rate_ratio_slow": 0.75,
        "pitch_var_ratio_low": 0.60,
        "pause_duration_excessive_sec": 1.5,
        "energy_std_ratio_low": 0.50
    }

class RubricEvaluationResult(BaseModel):
    rubric_version: str = "1.0.0"
    overall_score: float
    category_scores: Dict[str, float]
    details: Dict[str, CategoryScoreDetail]
    methodology_notes: List[str]
