from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

class DatasetRecord(BaseModel):
    recording_id: str = Field(..., description="Unique recording identifier")
    transcript_id: str = Field(..., description="Group transcript identifier")
    reference_id: Optional[str] = Field(None, description="Paired ideal reference recording ID")
    audio_file: str = Field(..., description="Relative audio filename within dataset/audio/")
    transcript: str = Field(..., description="Exact spoken transcript text")
    speech_category: str = Field("Interpretive Reading", description="Speech contest category")
    recording_type: str = Field("flawed", description="'ideal' or 'flawed'")
    flaw_type: str = Field("none", description="Primary targeted flaw type")
    severity: str = Field("none", description="'none', 'mild', 'moderate', 'severe'")
    speaker_id: str = Field("spk_anon_01", description="Anonymized speaker ID")
    start: Optional[float] = Field(None, description="Flaw start timestamp in seconds")
    end: Optional[float] = Field(None, description="Flaw end timestamp in seconds")
    alignment_method: str = Field("acoustic_dtw", description="Alignment technique used")
    annotation_status: str = Field("verified", description="'verified', 'provisional', 'unannotated'")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Acoustic & recording specs")

class DatasetManifest(BaseModel):
    version: str = "1.0.0"
    last_updated: str
    total_records: int
    records: List[DatasetRecord]

class DatasetQueryFilter(BaseModel):
    transcript_id: Optional[str] = None
    flaw_type: Optional[str] = None
    severity: Optional[str] = None
    recording_type: Optional[str] = None
    speech_category: Optional[str] = None
    search: Optional[str] = None
