from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.schemas.dataset import DatasetRecord, DatasetQueryFilter
from app.dataset.manager import dataset_manager

router = APIRouter(prefix="/dataset")

@router.get("", response_model=List[dict])
def get_dataset(
    transcript_id: Optional[str] = None,
    flaw_type: Optional[str] = None,
    severity: Optional[str] = None,
    recording_type: Optional[str] = None,
    speech_category: Optional[str] = None,
    search: Optional[str] = None
):
    """Lists contrastive dataset records with optional filters."""
    query = DatasetQueryFilter(
        transcript_id=transcript_id,
        flaw_type=flaw_type,
        severity=severity,
        recording_type=recording_type,
        speech_category=speech_category,
        search=search
    )
    return dataset_manager.list_records(query)

@router.post("", response_model=DatasetRecord)
def add_dataset_record(record: DatasetRecord):
    """Adds or updates a dataset record."""
    return dataset_manager.add_record(record)

@router.delete("/{recording_id}")
def delete_dataset_record(recording_id: str):
    """Deletes a dataset record."""
    success = dataset_manager.delete_record(recording_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Recording ID '{recording_id}' not found.")
    return {"message": f"Dataset record '{recording_id}' removed.", "recording_id": recording_id}

@router.get("/validate")
def validate_dataset_integrity():
    """Validates metadata schema and existence of referenced audio files."""
    return dataset_manager.validate_dataset()
