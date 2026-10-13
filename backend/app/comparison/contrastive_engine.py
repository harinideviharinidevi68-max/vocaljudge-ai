import uuid
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from backend.app.schemas.flaw import FlawInterval
from backend.app.alignment.aligner import AlignmentResult
from backend.app.core.logging import logger

def detect_delivery_flaws(
    ref_features: Dict[str, Any],
    part_features: Dict[str, Any],
    alignment: AlignmentResult,
    speech_category: str = "Interpretive Reading"
) -> List[FlawInterval]:
    """
    Contrastive feature comparison engine with temporal flaw grounding.
    Compares reference baseline against participant delivery over aligned timelines,
    identifying deviations in speaking rate, pauses, pitch variation, and energy dynamics.
    Adjacent anomalous frames and segments are coalesced into coherent intervals with evidence-based feedback.
    """
    flaws: List[FlawInterval] = []
    
    ref_raw = ref_features["raw"]
    part_raw = part_features["raw"]
    ref_summary = ref_features["summary"]
    part_summary = part_features["summary"]
    
    wp = alignment.wp
    part_times = part_raw["times"]
    ref_times = ref_raw["times"]

    # -------------------------------------------------------------
    # 1. TEMPORAL RATE & SEGMENT-LEVEL DURATION COMPARISON
    # -------------------------------------------------------------
    # Compare both aligned segments and sliding window WPM
    for seg in alignment.segments:
        ref_dur = seg["ref_end"] - seg["ref_start"]
        part_dur = seg["part_end"] - seg["part_start"]
        
        if ref_dur > 0.4 and part_dur > 0.3:
            dur_ratio = part_dur / ref_dur
            
            # Substantial compression (rushed speech, at least 25% faster)
            if dur_ratio <= 0.75:
                # Segment was rushed
                p_mask = (part_times >= seg["part_start"]) & (part_times <= seg["part_end"])
                p_wpm = float(np.mean(part_raw["local_wpm"][p_mask])) if np.any(p_mask) else float(part_summary["estimated_wpm"])
                r_mask = (ref_times >= seg["ref_start"]) & (ref_times <= seg["ref_end"])
                r_wpm = float(np.mean(ref_raw["local_wpm"][r_mask])) if np.any(r_mask) else float(ref_summary["estimated_wpm"])
                
                rel_diff = ((ref_dur - part_dur) / ref_dur) * 100.0
                severity = "high" if dur_ratio < 0.60 else "medium"
                
                flaws.append(FlawInterval(
                    id=f"flaw-{uuid.uuid4().hex[:8]}",
                    type="excessive_speaking_rate",
                    category_name="Pacing & Speed",
                    start=round(seg["part_start"], 2),
                    end=round(seg["part_end"], 2),
                    transcript_segment=seg["phrase"],
                    severity=severity,
                    reference_value=round(r_wpm, 1),
                    participant_value=round(p_wpm, 1),
                    relative_deviation_percent=round(rel_diff, 1),
                    threshold_rule="Phrase execution time <= 75% of reference baseline duration",
                    evidence=f"Participant delivered phrase in {part_dur:.2f}s vs reference {ref_dur:.2f}s ({rel_diff:.1f}% acceleration).",
                    explanation=f"Rushing through '{seg['phrase']}' deprives key arguments of persuasive emphasis in {speech_category}.",
                    recommendation="Deliberately linger on keywords and allow a brief pause before moving into the next clause.",
                    confidence=round(alignment.confidence, 2)
                ))
            
            # Substantial stretch (sluggish / dragging delivery, at least 35% slower)
            elif dur_ratio >= 1.35 and part_dur >= 1.2:
                p_mask = (part_times >= seg["part_start"]) & (part_times <= seg["part_end"])
                p_wpm = float(np.mean(part_raw["local_wpm"][p_mask])) if np.any(p_mask) else float(part_summary["estimated_wpm"])
                r_mask = (ref_times >= seg["ref_start"]) & (ref_times <= seg["ref_end"])
                r_wpm = float(np.mean(ref_raw["local_wpm"][r_mask])) if np.any(r_mask) else float(ref_summary["estimated_wpm"])
                
                rel_diff = ((part_dur - ref_dur) / ref_dur) * 100.0
                severity = "high" if dur_ratio > 1.60 else "medium"
                
                flaws.append(FlawInterval(
                    id=f"flaw-{uuid.uuid4().hex[:8]}",
                    type="unusually_slow_delivery",
                    category_name="Pacing & Speed",
                    start=round(seg["part_start"], 2),
                    end=round(seg["part_end"], 2),
                    transcript_segment=seg["phrase"],
                    severity=severity,
                    reference_value=round(r_wpm, 1),
                    participant_value=round(p_wpm, 1),
                    relative_deviation_percent=round(rel_diff, 1),
                    threshold_rule="Phrase execution time >= 135% of reference baseline duration",
                    evidence=f"Participant spent {part_dur:.2f}s on phrase vs reference {ref_dur:.2f}s (+{rel_diff:.1f}% elongation).",
                    explanation="Dragging delivery risks causing audience inattention and losing rhetorical urgency.",
                    recommendation="Increase vocal velocity and sustain conversational energy between connecting phrases.",
                    confidence=round(alignment.confidence, 2)
                ))

    # -------------------------------------------------------------
    # 2. PAUSE DURATION & SILENCE INTERVALS
    # -------------------------------------------------------------
    ref_pauses = ref_features.get("pauses", [])
    part_pauses = part_features.get("pauses", [])
    
    for p_pause in part_pauses:
        p_dur = p_pause["duration"]
        p_t0 = p_pause["start"]
        p_t1 = p_pause["end"]
        
        if p_dur >= 1.4:
            # Check if reference had a matching pause
            ref_match = any(
                abs(rp["duration"] - p_dur) < 0.4 for rp in ref_pauses
            )
            if not ref_match:
                seg_text = _find_transcript_segment(p_t0, p_t1, alignment.segments)
                ref_avg_pause = float(ref_summary.get("total_pause_duration", 1.0) / max(ref_summary.get("total_pauses", 1), 1))
                rel_diff = ((p_dur - ref_avg_pause) / max(ref_avg_pause, 0.2)) * 100.0
                severity = "high" if p_dur > 2.2 else "medium"
                
                flaws.append(FlawInterval(
                    id=f"flaw-{uuid.uuid4().hex[:8]}",
                    type="excessive_pause",
                    category_name="Pauses & Timing",
                    start=round(p_t0, 2),
                    end=round(p_t1, 2),
                    transcript_segment=seg_text,
                    severity=severity,
                    reference_value=round(ref_avg_pause, 2),
                    participant_value=round(p_dur, 2),
                    relative_deviation_percent=round(rel_diff, 1),
                    threshold_rule="Silence gap duration >= 1.40s without matching reference rhetorical pause",
                    evidence=f"Prolonged silent interval of {p_dur:.2f}s detected (reference pause average is {ref_avg_pause:.2f}s, +{rel_diff:.1f}% elongation).",
                    explanation="Unprompted prolonged pauses break audience immersion and indicate hesitation or memory lapse.",
                    recommendation="Keep punctuation pauses between 0.5s and 0.8s; preserve dramatic silences >1.2s exclusively for deliberate dramatic climaxes.",
                    confidence=0.94
                ))

    # -------------------------------------------------------------
    # 3. PITCH VARIATION & VOCAL MONOTONY ANALYSIS
    # -------------------------------------------------------------
    for seg in alignment.segments:
        p_start = seg["part_start"]
        p_end = seg["part_end"]
        r_start = seg["ref_start"]
        r_end = seg["ref_end"]
        
        p_mask = (part_times >= p_start) & (part_times <= p_end)
        r_mask = (ref_times >= r_start) & (ref_times <= r_end)
        
        p_f0_slice = part_raw["f0"][p_mask]
        r_f0_slice = ref_raw["f0"][r_mask]
        
        p_voiced = p_f0_slice[~np.isnan(p_f0_slice)]
        r_voiced = r_f0_slice[~np.isnan(r_f0_slice)]
        
        if len(p_voiced) >= 5 and len(r_voiced) >= 5:
            p_std = float(np.std(p_voiced))
            r_std = float(np.std(r_voiced))
            
            # Monotone check: reference had inflection (r_std >= 6.0 Hz) and participant had < 55% of it
            if r_std >= 6.0 and p_std < (0.55 * r_std):
                rel_diff = ((p_std - r_std) / r_std) * 100.0
                flaws.append(FlawInterval(
                    id=f"flaw-{uuid.uuid4().hex[:8]}",
                    type="reduced_pitch_variation",
                    category_name="Vocal Pitch & Inflection",
                    start=round(p_start, 2),
                    end=round(p_end, 2),
                    transcript_segment=seg["phrase"],
                    severity="medium",
                    reference_value=round(r_std, 1),
                    participant_value=round(p_std, 1),
                    relative_deviation_percent=round(rel_diff, 1),
                    threshold_rule="Pitch standard deviation < 55% of reference dynamic inflection across voiced phrase",
                    evidence=f"Participant pitch standard deviation is {p_std:.1f} Hz vs reference {r_std:.1f} Hz ({rel_diff:.1f}% reduction in vocal inflection).",
                    explanation=f"A flat melodic contour across '{seg['phrase']}' creates perceived monotony, reducing rhetorical persuasiveness.",
                    recommendation="Pitch up on the operative verb or subject noun to inject vocal variety and color.",
                    confidence=0.88
                ))

    # -------------------------------------------------------------
    # 4. ENERGY & DYNAMICS (RMS AMPLITUDE / EMPHASIS)
    # -------------------------------------------------------------
    for seg in alignment.segments:
        p_start = seg["part_start"]
        p_end = seg["part_end"]
        r_start = seg["ref_start"]
        r_end = seg["ref_end"]
        
        p_mask = (part_times >= p_start) & (part_times <= p_end)
        r_mask = (ref_times >= r_start) & (ref_times <= r_end)
        
        p_rms_slice = part_raw["rms"][p_mask]
        r_rms_slice = ref_raw["rms"][r_mask]
        
        if len(p_rms_slice) >= 5 and len(r_rms_slice) >= 5:
            p_range = float(np.max(p_rms_slice) - np.min(p_rms_slice))
            r_range = float(np.max(r_rms_slice) - np.min(r_rms_slice))
            
            if r_range > 0.15 and p_range < (0.45 * r_range):
                rel_diff = ((p_range - r_range) / r_range) * 100.0
                flaws.append(FlawInterval(
                    id=f"flaw-{uuid.uuid4().hex[:8]}",
                    type="unusual_energy_variation",
                    category_name="Energy & Emphasis",
                    start=round(p_start, 2),
                    end=round(p_end, 2),
                    transcript_segment=seg["phrase"],
                    severity="low",
                    reference_value=round(r_range, 3),
                    participant_value=round(p_range, 3),
                    relative_deviation_percent=round(rel_diff, 1),
                    threshold_rule="RMS dynamic range < 45% of reference dynamic contrast on emphasized phrase",
                    evidence=f"Participant RMS dynamic range was {p_range:.3f} vs reference contrast of {r_range:.3f} ({rel_diff:.1f}% muted energy).",
                    explanation="Under-projected energy flattens rhetorical emphasis on stressed points.",
                    recommendation="Project vocal core more vigorously on operative statements to highlight critical content.",
                    confidence=0.85
                ))

    # Deduplicate overlapping flaws of identical type
    deduped: List[FlawInterval] = []
    flaws.sort(key=lambda f: f.start)
    for f in flaws:
        if not deduped:
            deduped.append(f)
        else:
            prev = deduped[-1]
            if prev.type == f.type and abs(prev.end - f.start) < 0.3:
                # Merge
                prev.end = max(prev.end, f.end)
                prev.participant_value = round((prev.participant_value + f.participant_value) / 2.0, 1)
            else:
                deduped.append(f)

    return deduped

def _find_transcript_segment(start_t: float, end_t: float, segments: List[Dict[str, Any]]) -> str:
    if not segments:
        return "Spoken segment"
    best_phrase = ""
    max_overlap = -1.0
    for s in segments:
        overlap = max(0.0, min(end_t, s["part_end"]) - max(start_t, s["part_start"]))
        if overlap > max_overlap:
            max_overlap = overlap
            best_phrase = s["phrase"]
    return best_phrase if best_phrase else segments[0]["phrase"]
