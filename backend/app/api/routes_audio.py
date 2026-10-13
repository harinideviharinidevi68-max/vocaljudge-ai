from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.schemas.audio import AudioUploadResponse
from backend.app.audio_processing.loader import load_audio, AudioLoadError
from backend.app.services.storage_service import storage_service

router = APIRouter(prefix="/audio")

@router.post("/upload", response_model=AudioUploadResponse)
async def upload_audio(file: UploadFile = File(...)):
    """
    Validates and saves an uploaded audio file.
    Runs sanity checks on size, audio headers, and decodability.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename in upload.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")
    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Uploaded file exceeds {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB limit."
        )

    # Save to storage
    audio_id, file_path = storage_service.save_upload(file.filename, content)

    # Verify and inspect audio
    try:
        y, sr, meta = load_audio(file_path)
    except AudioLoadError as e:
        # Clean up invalid file
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=400, detail=f"Invalid audio file: {str(e)}")
    except Exception as e:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Audio decoding failure: {str(e)}")

    return AudioUploadResponse(
        audio_id=audio_id,
        filename=meta["filename"],
        duration_seconds=meta["duration_seconds"],
        sample_rate=meta["sample_rate"],
        channels=meta["channels"],
        format=file_path.suffix.lstrip(".").upper(),
        size_bytes=meta["size_bytes"],
        url=f"/api/audio/stream/{audio_id}",
        message="Audio uploaded and acoustic metadata validated."
    )

@router.get("/stream/{audio_id}")
def stream_audio(audio_id: str):
    """Streams audio file for HTML5 audio playback."""
    file_path = storage_service.get_audio_path(audio_id)
    if not file_path or not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"Audio recording '{audio_id}' not found.")
    
    media_type = "audio/wav" if file_path.suffix.lower() == ".wav" else "audio/mpeg"
    return FileResponse(path=file_path, media_type=media_type, filename=file_path.name)

@router.get("/dataset/{filename}")
def stream_dataset_audio(filename: str):
    """Streams audio from dataset directory."""
    file_path = settings.DATASET_DIR / "audio" / filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"Dataset audio file '{filename}' not found.")
    
    media_type = "audio/wav" if file_path.suffix.lower() == ".wav" else "audio/mpeg"
    return FileResponse(path=file_path, media_type=media_type, filename=file_path.name)
