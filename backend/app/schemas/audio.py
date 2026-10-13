from pydantic import BaseModel, Field
from typing import Optional

class AudioMetadata(BaseModel):
    audio_id: str
    filename: str
    duration_seconds: float
    sample_rate: int
    channels: int
    format: str
    size_bytes: int
    file_path: Optional[str] = None
    url: Optional[str] = None

class AudioUploadResponse(BaseModel):
    audio_id: str
    filename: str
    duration_seconds: float
    sample_rate: int
    channels: int
    format: str
    size_bytes: int
    url: str
    message: str = "Audio uploaded and validated successfully"
