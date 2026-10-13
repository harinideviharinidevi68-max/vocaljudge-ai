"""
Tests live upload and analysis workflow against running FastAPI and Vite servers.
"""

import urllib.request
import json
from pathlib import Path

def test_live():
    # 1. Test frontend HTML response
    try:
        fe_res = urllib.request.urlopen('http://127.0.0.1:5173')
        html = fe_res.read().decode('utf-8')
        assert 'VocalJudge' in html or '<div id="root">' in html
        print("[VERIFIED] Frontend Vite dev server responding at http://127.0.0.1:5173")
    except Exception as e:
        print("[FAIL] Frontend connection error:", e)

    # 2. Test Audio Upload to live backend
    file_path = Path('dataset/audio/sample_reference.wav')
    boundary = '----WebKitFormBoundaryTest123456789'
    
    with open(file_path, 'rb') as f:
        file_bytes = f.read()

    body = (
        f'--{boundary}\r\n'
        f'Content-Disposition: form-data; name="file"; filename="sample_reference.wav"\r\n'
        f'Content-Type: audio/wav\r\n\r\n'
    ).encode('latin-1') + file_bytes + f'\r\n--{boundary}--\r\n'.encode('latin-1')

    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/audio/upload',
        data=body,
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    res = urllib.request.urlopen(req)
    uploaded = json.loads(res.read().decode())
    print(f"[VERIFIED] Backend Upload API: Audio ID={uploaded['audio_id']}, Duration={uploaded['duration_seconds']}s")

    # 3. Test Full Analysis Workflow
    analysis_payload = json.dumps({
        'reference_audio_id': uploaded['audio_id'],
        'participant_audio_id': 'sample_fast_delivery.wav',
        'transcript': 'We must remember that speech is not mere words, but the living expression of thought and character.',
        'speech_category': 'Persuasive Oratory'
    }).encode('utf-8')

    analyze_req = urllib.request.Request(
        'http://127.0.0.1:8000/api/analyze',
        data=analysis_payload,
        headers={'Content-Type': 'application/json'}
    )
    analyze_res = urllib.request.urlopen(analyze_req)
    analysis = json.loads(analyze_res.read().decode())

    print(f"[VERIFIED] Full Analysis Execution: ID={analysis['analysis_id']}")
    print(f"  Overall Score: {analysis['overall_score']} / 100")
    print(f"  Category Scores: {analysis['category_scores']}")
    print(f"  Flaws Detected: {len(analysis['flaws'])}")
    for f in analysis['flaws']:
        print(f"    - [{f['type']}] {f['start']}s - {f['end']}s (Sev: {f['severity']}): {f['evidence']}")

    # 4. Test Fetching Analysis by ID
    get_res = urllib.request.urlopen(f"http://127.0.0.1:8000/api/analysis/{analysis['analysis_id']}")
    fetched = json.loads(get_res.read().decode())
    assert fetched['analysis_id'] == analysis['analysis_id']
    print(f"[VERIFIED] Stored Analysis Retrieval: ID={fetched['analysis_id']} successfully retrieved from storage!")

if __name__ == '__main__':
    test_live()
