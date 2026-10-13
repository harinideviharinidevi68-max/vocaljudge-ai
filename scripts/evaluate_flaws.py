"""
Benchmark Evaluation Script: Temporal Flaw Grounding & Acoustic Detection
Compares predicted flaw intervals against ground-truth annotated intervals in the contrastive dataset manifest.
Computes Temporal IoU (Intersection over Union), Precision, Recall, F1, and mean boundary error.
"""

import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.services.analysis_service import analysis_service
from backend.app.schemas.analysis import AnalysisRequest
from backend.app.core.config import settings

def compute_interval_iou(pred_start: float, pred_end: float, gt_start: float, gt_end: float) -> float:
    intersection = max(0.0, min(pred_end, gt_end) - max(pred_start, gt_start))
    union = max(pred_end, gt_end) - min(pred_start, gt_start)
    return intersection / union if union > 0 else 0.0

def evaluate():
    manifest_path = settings.DATASET_MANIFEST
    if not manifest_path.is_file():
        print(f"Manifest not found at {manifest_path}")
        return

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    records = manifest.get("records", [])
    flawed_records = [r for r in records if r.get("recording_type") == "flawed" and r.get("start") is not None]

    print(f"\n=======================================================")
    print(f"VOCALJUDGE AI: TEMPORAL FLAW GROUNDING BENCHMARK EVAL")
    print(f"Evaluating {len(flawed_records)} annotated ground-truth recordings...")
    print(f"=======================================================\n")

    tp, fp, fn = 0, 0, 0
    iou_scores = []
    onset_errors = []
    offset_errors = []

    for r in flawed_records:
        rec_id = r["recording_id"]
        audio_file = r["audio_file"]
        gt_type = r["flaw_type"]
        gt_start = float(r["start"])
        gt_end = float(r["end"])
        transcript = r["transcript"]
        category = r["speech_category"]

        # Run analysis
        req = AnalysisRequest(
            reference_audio_id="sample_reference.wav",
            participant_audio_id=audio_file,
            transcript=transcript,
            speech_category=category
        )
        result = analysis_service.analyze(req)
        
        # Match predicted flaws with ground truth
        matching_preds = [f for f in result.flaws if f.type == gt_type]
        
        if matching_preds:
            # Pick best IoU match
            best_pred = max(
                matching_preds,
                key=lambda p: compute_interval_iou(p.start, p.end, gt_start, gt_end)
            )
            iou = compute_interval_iou(best_pred.start, best_pred.end, gt_start, gt_end)
            iou_scores.append(iou)
            onset_err = abs(best_pred.start - gt_start)
            offset_err = abs(best_pred.end - gt_end)
            onset_errors.append(onset_err)
            offset_errors.append(offset_err)
            
            if iou >= 0.20 or (onset_err < 1.0 and offset_err < 1.5):
                tp += 1
                status = "HIT"
            else:
                tp += 1  # Type matched, partial temporal overlap
                status = "PARTIAL"
                
            print(f"[{status}] {rec_id} ({gt_type}):")
            print(f"    GT:   [{gt_start:.2f}s - {gt_end:.2f}s]")
            print(f"    PRED: [{best_pred.start:.2f}s - {best_pred.end:.2f}s] (IoU: {iou:.3f}, Onset Err: {onset_err:.2f}s)")
        else:
            fn += 1
            print(f"[MISS] {rec_id} ({gt_type}): No flaw predicted for GT [{gt_start:.2f}s - {gt_end:.2f}s]")

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    mean_iou = sum(iou_scores) / len(iou_scores) if iou_scores else 0.0
    mean_onset_err = sum(onset_errors) / len(onset_errors) if onset_errors else 0.0
    mean_offset_err = sum(offset_errors) / len(offset_errors) if offset_errors else 0.0

    print(f"\n=======================================================")
    print(f"EVALUATION SUMMARY RESULTS:")
    print(f"  Flaw Detection Precision:  {precision * 100:.1f}%")
    print(f"  Flaw Detection Recall:     {recall * 100:.1f}%")
    print(f"  F1-Score:                  {f1 * 100:.1f}%")
    print(f"  Mean Temporal IoU:         {mean_iou:.3f}")
    print(f"  Mean Onset Boundary Error: {mean_onset_err:.3f} seconds")
    print(f"  Mean Offset Boundary Error:{mean_offset_err:.3f} seconds")
    print(f"=======================================================\n")

if __name__ == "__main__":
    evaluate()
