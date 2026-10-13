from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.logging import logger
from app.api.routes_health import router as health_router
from app.api.routes_audio import router as audio_router
from app.api.routes_transcribe import router as transcribe_router
from app.api.routes_analyze import router as analyze_router
from app.api.routes_dataset import router as dataset_router
from app.api.routes_rubric import router as rubric_router
from app.api.routes_history import router as history_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Contrastive Speech Analytics & Temporal Flaw Grounding for competitive speech delivery evaluation."
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health_router, prefix="/api", tags=["Health & Stats"])
app.include_router(audio_router, prefix="/api", tags=["Audio Operations"])
app.include_router(transcribe_router, prefix="/api", tags=["Speech Transcription"])
app.include_router(analyze_router, prefix="/api", tags=["Contrastive Analysis"])
app.include_router(dataset_router, prefix="/api", tags=["Contrastive Dataset"])
app.include_router(rubric_router, prefix="/api", tags=["Evaluation Rubric"])
app.include_router(history_router, prefix="/api", tags=["Analysis History"])

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "tagline": "Speak Better. Understand Every Flaw.",
        "version": settings.VERSION,
        "docs": "/docs",
        "api_health": "/api/health"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please verify input files and parameters."}
    )
