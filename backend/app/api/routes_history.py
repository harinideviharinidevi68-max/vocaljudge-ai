from fastapi import APIRouter
from typing import List
from app.schemas.analysis import AnalysisHistoryItem
from app.services.storage_service import storage_service

router = APIRouter(prefix="/history")

@router.get("", response_model=List[AnalysisHistoryItem])
def get_analysis_history():
    """Returns past completed speech analyses sorted chronologically descending."""
    return storage_service.list_history()
