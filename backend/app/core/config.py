import os
from pathlib import Path

# Resolve base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_DIR = BASE_DIR.parent

class Settings:
    PROJECT_NAME: str = "VocalJudge AI"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Audio processing hyperparameters
    SAMPLE_RATE: int = 22050
    HOP_LENGTH: int = 512
    N_FFT: int = 2048
    N_MFCC: int = 13
    
    # Upload limits
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024  # 50MB
    MAX_DURATION_SECONDS: float = 600.0  # 10 minutes
    MIN_DURATION_SECONDS: float = 1.0    # 1 second
    
    # Storage directories
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOADS_DIR: Path = BASE_DIR / "storage" / "uploads"
    ANALYSIS_DIR: Path = BASE_DIR / "storage" / "analyses"
    DATASET_DIR: Path = WORKSPACE_DIR / "dataset"
    DATASET_MANIFEST: Path = WORKSPACE_DIR / "dataset" / "metadata" / "manifest.json"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()

# Ensure required directories exist
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
settings.ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
(settings.DATASET_DIR / "metadata").mkdir(parents=True, exist_ok=True)
(settings.DATASET_DIR / "audio").mkdir(parents=True, exist_ok=True)
