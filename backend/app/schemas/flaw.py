from pydantic import BaseModel, Field
from typing import Optional

class FlawInterval(BaseModel):
    id: str = Field(..., description="Unique identifier for the detected flaw")
    type: str = Field(..., description="Flaw category (e.g. excessive_speaking_rate, reduced_pitch_variation)")
    category_name: str = Field(..., description="Human-readable category name")
    start: float = Field(..., description="Start timestamp in seconds")
    end: float = Field(..., description="End timestamp in seconds")
    transcript_segment: Optional[str] = Field(None, description="Mapped speech transcript segment")
    severity: str = Field("medium", description="Severity level: low, medium, or high")
    reference_value: float = Field(..., description="Measured reference baseline value")
    participant_value: float = Field(..., description="Measured participant value")
    relative_deviation_percent: float = Field(..., description="Relative mathematical deviation percentage")
    threshold_rule: str = Field(..., description="Documented threshold or rule trigger")
    evidence: str = Field(..., description="Acoustic mathematical evidence statement")
    explanation: str = Field(..., description="Root cause delivery explanation")
    recommendation: str = Field(..., description="Concrete actionable corrective coaching advice")
    confidence: Optional[float] = Field(None, description="Estimated confidence score (0.0 to 1.0)")
