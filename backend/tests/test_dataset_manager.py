import pytest
from backend.app.dataset.manager import dataset_manager
from backend.app.schemas.dataset import DatasetRecord

def test_dataset_list_and_validate():
    records = dataset_manager.list_records()
    assert len(records) >= 1
    
    validation = dataset_manager.validate_dataset()
    assert validation["total_records"] >= 1
    assert validation["is_valid"] is True

def test_dataset_crud():
    test_rec = DatasetRecord(
        recording_id="test_rec_999",
        transcript_id="test_txt_01",
        reference_id=None,
        audio_file="sample_reference.wav",
        transcript="Testing recording add and delete.",
        speech_category="Extemporaneous Speech",
        recording_type="ideal",
        flaw_type="none",
        severity="none",
        speaker_id="spk_tester"
    )
    
    # Add
    added = dataset_manager.add_record(test_rec)
    assert added.recording_id == "test_rec_999"
    
    # Check exists in listing
    records = dataset_manager.list_records()
    ids = [r["recording_id"] for r in records]
    assert "test_rec_999" in ids
    
    # Delete
    deleted = dataset_manager.delete_record("test_rec_999")
    assert deleted is True
