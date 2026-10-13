"""
Dataset Preparation & Integrity Validation Utility
Checks manifest schema validity, verifies that every audio file exists and is decodable,
and reports dataset distribution summary.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.dataset.manager import dataset_manager
from backend.app.audio_processing.loader import load_audio

def validate_and_report():
    print("Validating VocalJudge AI Contrastive Dataset...")
    result = dataset_manager.validate_dataset()
    
    print(f"Total manifest records: {result['total_records']}")
    print(f"Valid records with audio files: {result['valid_records_with_audio']}")
    
    if result["missing_audio_files"]:
        print("\nWARNING: The following audio files are missing:")
        for m in result["missing_audio_files"]:
            print(f"  - Record {m['recording_id']}: missing '{m['expected_file']}'")
        sys.exit(1)
        
    records = dataset_manager.list_records()
    print("\nDataset Records Overview:")
    for r in records:
        print(f"  [{r['recording_id']}] Type: {r['recording_type']:<7} | Flaw: {r['flaw_type']:<22} | File: {r['audio_file']}")

    print("\nAudio file decodability check:")
    for r in records:
        audio_path = Path("dataset/audio") / r["audio_file"]
        y, sr, meta = load_audio(audio_path)
        print(f"  {r['audio_file']}: SR={sr}Hz, Duration={meta['duration_seconds']}s, Channels={meta['channels']}")

    print("\nAll dataset records validated successfully!")

if __name__ == "__main__":
    validate_and_report()
