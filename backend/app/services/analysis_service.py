import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.schemas.analysis import AnalysisRequest, AnalysisResult, FeatureBundle, FeatureSummary, TimeSeriesPoint
from backend.app.schemas.rubric import RubricConfig
from backend.app.audio_processing.loader import load_audio, AudioLoadError
from backend.app.audio_processing.features import extract_features
from backend.app.alignment.aligner import align_recordings
from backend.app.comparison.contrastive_engine import detect_delivery_flaws
from backend.app.scoring.rubric_engine import evaluate_rubric
from backend.app.services.storage_service import storage_service

class AnalysisService:
    def analyze(self, req: AnalysisRequest) -> AnalysisResult:
        logger.info(f"Starting analysis between ref={req.reference_audio_id} and part={req.participant_audio_id}")
        
        # 1. Resolve audio paths
        ref_path = storage_service.get_audio_path(req.reference_audio_id)
        if not ref_path:
            raise AudioLoadError(f"Reference audio ID not found: {req.reference_audio_id}")
            
        part_path = storage_service.get_audio_path(req.participant_audio_id)
        if not part_path:
            raise AudioLoadError(f"Participant audio ID not found: {req.participant_audio_id}")

        # 2. Safely load audio
        ref_y, ref_sr, ref_meta = load_audio(ref_path)
        part_y, part_sr, part_meta = load_audio(part_path)

        # Count words in transcript
        words = req.transcript.strip().split()
        word_count = len(words)

        # 3. Extract acoustic features
        ref_features = extract_features(
            y=ref_y,
            sr=ref_sr,
            transcript_words_count=word_count
        )
        part_features = extract_features(
            y=part_y,
            sr=part_sr,
            transcript_words_count=word_count
        )

        # 4. Temporal Alignment
        alignment = align_recordings(
            ref_features=ref_features,
            part_features=part_features,
            transcript=req.transcript
        )

        # 5. Contrastive Flaw Detection & Grounding
        flaws = detect_delivery_flaws(
            ref_features=ref_features,
            part_features=part_features,
            alignment=alignment,
            speech_category=req.speech_category
        )

        # 6. Rubric Scoring
        rubric_config = RubricConfig()
        rubric_eval = evaluate_rubric(
            ref_features=ref_features,
            part_features=part_features,
            flaws=flaws,
            config=rubric_config
        )

        # 7. Construct Feature Bundles for API/Dashboard
        def build_bundle(feat_dict: Dict[str, Any]) -> FeatureBundle:
            s = feat_dict["summary"]
            ts = [
                TimeSeriesPoint(
                    time=pt["time"],
                    pitch_hz=pt["pitch_hz"],
                    rms_energy=pt["rms_energy"],
                    speaking_rate_wpm=pt["speaking_rate_wpm"],
                    is_pause=pt["is_pause"],
                    spectral_centroid_hz=pt["spectral_centroid_hz"]
                )
                for pt in feat_dict["timeseries"]
            ]
            return FeatureBundle(
                summary=FeatureSummary(**s),
                timeseries=ts
            )

        ref_bundle = build_bundle(ref_features)
        part_bundle = build_bundle(part_features)

        # 8. Warnings check
        warnings: List[str] = []
        if alignment.confidence < 0.60:
            warnings.append(
                f"Low alignment confidence ({alignment.confidence * 100:.1f}%). Recordings may have acoustic noise or delivery variations."
            )
        if abs(part_meta["duration_seconds"] - ref_meta["duration_seconds"]) > 30.0:
            warnings.append(
                f"Significant duration disparity ({part_meta['duration_seconds']:.1f}s vs {ref_meta['duration_seconds']:.1f}s)."
            )

        analysis_id = f"analysis-{uuid.uuid4().hex[:10]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        result = AnalysisResult(
            analysis_id=analysis_id,
            status="completed",
            created_at=now_iso,
            transcript=req.transcript,
            speech_category=req.speech_category,
            alignment_method=alignment.method,
            rubric_version=rubric_config.version,
            overall_score=rubric_eval.overall_score,
            category_scores=rubric_eval.category_scores,
            rubric_evaluation=rubric_eval,
            reference_audio_id=req.reference_audio_id,
            participant_audio_id=req.participant_audio_id,
            reference_audio_url=f"/api/audio/stream/{req.reference_audio_id}",
            participant_audio_url=f"/api/audio/stream/{req.participant_audio_id}",
            reference_duration=ref_meta["duration_seconds"],
            participant_duration=part_meta["duration_seconds"],
            features={
                "reference": ref_bundle,
                "participant": part_bundle
            },
            flaws=flaws,
            warnings=warnings
        )

        # 9. Persist result
        storage_service.save_analysis(result)
        return result

analysis_service = AnalysisService()
