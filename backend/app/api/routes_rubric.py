from fastapi import APIRouter
from app.schemas.rubric import RubricConfig

router = APIRouter(prefix="/rubric")

@router.get("", response_model=RubricConfig)
def get_rubric_config():
    """Returns current active scoring rubric version, category weights, and thresholds."""
    return RubricConfig()
