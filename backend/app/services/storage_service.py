import os
import json
import uuid
import shutil
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from app.core.config import settings
from backend.app.core.logging import logger
from backend.app.schemas.audio import AudioMetadata
from backend.app.schemas.analysis import AnalysisResult, AnalysisHistoryItem

class StorageService:
    def __init__(self):
        self.uploads_dir = settings.UPLOADS_DIR
        self.analyses_dir = settings.ANALYSIS_DIR
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self.analyses_dir.mkdir(parents=True, exist_ok=True)

    def save_upload(self, original_filename: str, file_bytes: bytes) -> Tuple[str, Path]:
        """
        Saves uploaded file with a secure UUID-based filename.
        Returns (audio_id, file_path).
        """
        audio_id = f"aud-{uuid.uuid4().hex[:12]}"
        ext = Path(original_filename).suffix.lower()
        if not ext:
            ext = ".wav"
        safe_filename = f"{audio_id}{ext}"
        target_path = self.uploads_dir / safe_filename
        
        with open(target_path, "wb") as f:
            f.write(file_bytes)
            
        logger.info(f"Saved audio {audio_id} ({len(file_bytes)} bytes) to {target_path}")
        return audio_id, target_path

    def get_audio_path(self, audio_id: str) -> Optional[Path]:
        """Finds audio file matching audio_id in uploads or dataset audio."""
        # Check uploads
        for f in self.uploads_dir.glob(f"{audio_id}.*"):
            if f.is_file():
                return f
        # Also check if it references a dataset audio file directly
        dataset_audio = settings.DATASET_DIR / "audio" / audio_id
        if dataset_audio.is_file():
            return dataset_audio
        # Try finding by basename in dataset audio
        for f in (settings.DATASET_DIR / "audio").glob(f"{audio_id}.*"):
            if f.is_file():
                return f
        return None

    def save_analysis(self, result: AnalysisResult) -> Path:
        """Persists analysis result as formatted JSON."""
        target_path = self.analyses_dir / f"{result.analysis_id}.json"
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(result.model_dump_json(indent=2))
        logger.info(f"Persisted analysis {result.analysis_id} to {target_path}")
        return target_path

    def get_analysis(self, analysis_id: str) -> Optional[AnalysisResult]:
        """Retrieves analysis result by ID."""
        target_path = self.analyses_dir / f"{analysis_id}.json"
        if not target_path.is_file():
            return None
        with open(target_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return AnalysisResult.model_validate(data)

    def list_history(self) -> List[AnalysisHistoryItem]:
        """Lists all completed analyses ordered by creation time descending."""
        items: List[AnalysisHistoryItem] = []
        for file in self.analyses_dir.glob("*.json"):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                items.append(AnalysisHistoryItem(
                    analysis_id=data.get("analysis_id", file.stem),
                    created_at=data.get("created_at", ""),
                    speech_category=data.get("speech_category", "Unknown"),
                    overall_score=data.get("overall_score", 0.0),
                    flaw_count=len(data.get("flaws", [])),
                    participant_duration=data.get("participant_duration", 0.0),
                    status=data.get("status", "completed")
                ))
            except Exception as e:
                logger.warning(f"Error reading history item {file.name}: {e}")
        # Sort newest first
        items.sort(key=lambda x: x.created_at, reverse=True)
        return items

    def delete_analysis(self, analysis_id: str) -> bool:
        """Deletes analysis JSON record safely."""
        target_path = self.analyses_dir / f"{analysis_id}.json"
        if target_path.is_file():
            target_path.unlink()
            logger.info(f"Deleted analysis record {analysis_id}")
            return True
        return False

storage_service = StorageService()
