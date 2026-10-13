from fastapi import APIRouter, HTTPException
from backend.app.schemas.analysis import AnalysisRequest, AnalysisResult
from backend.app.services.analysis_service import analysis_service
from backend.app.services.storage_service import storage_service
from backend.app.audio_processing.loader import AudioLoadError
from backend.app.core.logging import logger

router = APIRouter()

@router.post("/analyze", response_model=AnalysisResult)
def run_analysis(request: AnalysisRequest):
    """
    Executes full contrastive speech delivery analysis pipeline:
    audio loading, feature extraction, DTW alignment, flaw detection, and rubric scoring.
    """
    if not request.transcript or len(request.transcript.strip()) < 3:
        raise HTTPException(status_code=400, detail="A valid transcript of at least 3 characters is required.")

    try:
        result = analysis_service.analyze(request)
        return result
    except AudioLoadError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Analysis pipeline failure: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")

@router.get("/analysis/{analysis_id}", response_model=AnalysisResult)
def get_analysis_by_id(analysis_id: str):
    """Retrieves an existing analysis by ID."""
    result = storage_service.get_analysis(analysis_id)
    if not result:
        raise HTTPException(status_code=404, detail=f"Analysis with ID '{analysis_id}' not found.")
    return result

@router.delete("/analysis/{analysis_id}")
def delete_analysis_by_id(analysis_id: str):
    """Deletes an existing analysis record."""
    success = storage_service.delete_analysis(analysis_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Analysis with ID '{analysis_id}' not found.")
    return {"message": f"Analysis '{analysis_id}' deleted successfully.", "analysis_id": analysis_id}
