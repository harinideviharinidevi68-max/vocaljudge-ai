from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from backend.app.schemas.flaw import FlawInterval
from backend.app.schemas.rubric import RubricEvaluationResult

class AnalysisRequest(BaseModel):
    reference_audio_id: str = Field(..., description="Uploaded audio ID for reference speech")
    participant_audio_id: str = Field(..., description="Uploaded audio ID for participant speech")
    transcript: str = Field(..., min_length=1, description="Exact spoken transcript text")
    speech_category: str = Field(
        "Interpretive Reading",
        description="Speech category: Interpretive Reading, Declamation, Extemporaneous Speech, Persuasive Oratory"
    )

class FeatureSummary(BaseModel):
    duration_seconds: float
    estimated_wpm: float
    total_pauses: int
    pause_time_ratio: float
    mean_pitch_hz: float
    std_pitch_hz: float
    pitch_semitone_range: float
    mean_rms_energy: float
    std_rms_energy: float
    mean_spectral_centroid_hz: float
    mean_zero_crossing_rate: float

class TimeSeriesPoint(BaseModel):
    time: float
    pitch_hz: Optional[float] = None
    rms_energy: float
    speaking_rate_wpm: Optional[float] = None
    is_pause: bool = False
    spectral_centroid_hz: Optional[float] = None

class FeatureBundle(BaseModel):
    summary: FeatureSummary
    timeseries: List[TimeSeriesPoint]

class AnalysisResult(BaseModel):
    analysis_id: str
    status: str = "completed"
    created_at: str
    transcript: str
    speech_category: str
    alignment_method: str
    rubric_version: str
    overall_score: float
    category_scores: Dict[str, float]
    rubric_evaluation: Optional[RubricEvaluationResult] = None
    reference_audio_id: str
    participant_audio_id: str
    reference_audio_url: str
    participant_audio_url: str
    reference_duration: float
    participant_duration: float
    features: Dict[str, FeatureBundle]
    flaws: List[FlawInterval]
    warnings: List[str] = []

class AnalysisHistoryItem(BaseModel):
    analysis_id: str
    created_at: str
    speech_category: str
    overall_score: float
    flaw_count: int
    participant_duration: float
    status: str
