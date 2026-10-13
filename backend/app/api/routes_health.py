from fastapi import APIRouter
from app.core.config import settings
from app.services.storage_service import storage_service
from backend.app.dataset.manager import dataset_manager

router = APIRouter()

@router.get("/health")
def get_health():
    analyses = storage_service.list_history()
    dataset_records = dataset_manager.list_records()
    total_flaws = 0
    for a in analyses:
        total_flaws += a.flaw_count

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "sample_rate": settings.SAMPLE_RATE,
        "capabilities": {
            "contrastive_analysis": True,
            "temporal_flaw_grounding": True,
            "rubric_scoring": True,
            "dtw_acoustic_alignment": True,
            "time_series_contouring": True,
            "local_audio_streaming": True
        },
        "stats": {
            "completed_analyses": len(analyses),
            "dataset_recordings": len(dataset_records),
            "total_flaws_detected": total_flaws
        }
    }
