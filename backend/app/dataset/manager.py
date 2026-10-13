import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.schemas.dataset import DatasetRecord, DatasetManifest, DatasetQueryFilter

class DatasetManager:
    def __init__(self):
        self.manifest_path = settings.DATASET_MANIFEST
        self.audio_dir = settings.DATASET_DIR / "audio"
        self._ensure_manifest_exists()

    def _ensure_manifest_exists(self):
        self.manifest_path.parent.mkdir(parents=True, exist_ok=True)
        self.audio_dir.mkdir(parents=True, exist_ok=True)
        if not self.manifest_path.exists():
            initial_manifest = DatasetManifest(
                version="1.0.0",
                last_updated=datetime.now(timezone.utc).isoformat(),
                total_records=0,
                records=[]
            )
            self._save_manifest(initial_manifest)

    def _load_manifest(self) -> DatasetManifest:
        try:
            with open(self.manifest_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return DatasetManifest.model_validate(data)
        except Exception as e:
            logger.error(f"Error loading manifest from {self.manifest_path}: {e}")
            return DatasetManifest(
                version="1.0.0",
                last_updated=datetime.now(timezone.utc).isoformat(),
                total_records=0,
                records=[]
            )

    def _save_manifest(self, manifest: DatasetManifest):
        manifest.total_records = len(manifest.records)
        manifest.last_updated = datetime.now(timezone.utc).isoformat()
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            f.write(manifest.model_dump_json(indent=2))

    def list_records(self, filters: Optional[DatasetQueryFilter] = None) -> List[Dict[str, Any]]:
        manifest = self._load_manifest()
        records = manifest.records
        
        if filters:
            if filters.transcript_id:
                records = [r for r in records if r.transcript_id == filters.transcript_id]
            if filters.flaw_type and filters.flaw_type != "all":
                records = [r for r in records if r.flaw_type == filters.flaw_type]
            if filters.severity and filters.severity != "all":
                records = [r for r in records if r.severity == filters.severity]
            if filters.recording_type and filters.recording_type != "all":
                records = [r for r in records if r.recording_type == filters.recording_type]
            if filters.speech_category and filters.speech_category != "all":
                records = [r for r in records if r.speech_category == filters.speech_category]
            if filters.search:
                q = filters.search.lower()
                records = [
                    r for r in records
                    if q in r.transcript.lower() or q in r.recording_id.lower() or q in r.flaw_type.lower()
                ]

        # Attach audio file availability status
        results = []
        for r in records:
            d = r.model_dump()
            audio_path = self.audio_dir / r.audio_file
            d["audio_file_exists"] = audio_path.is_file()
            d["audio_url"] = f"/api/audio/dataset/{r.audio_file}" if audio_path.is_file() else None
            results.append(d)
        return results

    def add_record(self, record: DatasetRecord) -> DatasetRecord:
        manifest = self._load_manifest()
        # Remove existing if same recording_id
        manifest.records = [r for r in manifest.records if r.recording_id != record.recording_id]
        manifest.records.append(record)
        self._save_manifest(manifest)
        logger.info(f"Added dataset record: {record.recording_id}")
        return record

    def delete_record(self, recording_id: str) -> bool:
        manifest = self._load_manifest()
        orig_count = len(manifest.records)
        manifest.records = [r for r in manifest.records if r.recording_id != recording_id]
        if len(manifest.records) < orig_count:
            self._save_manifest(manifest)
            logger.info(f"Deleted dataset record: {recording_id}")
            return True
        return False

    def validate_dataset(self) -> Dict[str, Any]:
        """Validates all dataset entries and audio file presence."""
        manifest = self._load_manifest()
        valid_count = 0
        missing_audio = []
        errors = []
        
        for r in manifest.records:
            audio_path = self.audio_dir / r.audio_file
            if not audio_path.is_file():
                missing_audio.append({
                    "recording_id": r.recording_id,
                    "expected_file": r.audio_file
                })
            else:
                valid_count += 1

        return {
            "total_records": len(manifest.records),
            "valid_records_with_audio": valid_count,
            "missing_audio_files": missing_audio,
            "is_valid": len(missing_audio) == 0,
            "last_updated": manifest.last_updated
        }

dataset_manager = DatasetManager()
