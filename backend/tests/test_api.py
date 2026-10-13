import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "capabilities" in data
    assert "stats" in data

def test_rubric_endpoint():
    response = client.get("/api/rubric")
    assert response.status_code == 200
    data = response.json()
    assert data["total_max_score"] == 100.0
    assert "weights" in data
    assert data["weights"]["pacing"] == 25.0

def test_dataset_endpoint():
    response = client.get("/api/dataset")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_dataset_validate_endpoint():
    response = client.get("/api/dataset/validate")
    assert response.status_code == 200
    data = response.json()
    assert "total_records" in data
    assert "is_valid" in data

def test_history_endpoint():
    response = client.get("/api/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_analyze_endpoint_validation():
    # Empty transcript should fail with 400
    bad_req = {
        "reference_audio_id": "sample_reference.wav",
        "participant_audio_id": "sample_fast_delivery.wav",
        "transcript": "",
        "speech_category": "Persuasive Oratory"
    }
    response = client.post("/api/analyze", json=bad_req)
    assert response.status_code == 422 or response.status_code == 400

def test_analyze_endpoint_success():
    req = {
        "reference_audio_id": "sample_reference.wav",
        "participant_audio_id": "sample_excessive_pause.wav",
        "transcript": "We must remember that speech is not mere words, but the living expression of thought and character.",
        "speech_category": "Persuasive Oratory"
    }
    response = client.post("/api/analyze", json=req)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert "overall_score" in data
    assert "category_scores" in data
    assert "flaws" in data
    assert len(data["flaws"]) >= 1
    
    # Test getting analysis by id
    analysis_id = data["analysis_id"]
    get_res = client.get(f"/api/analysis/{analysis_id}")
    assert get_res.status_code == 200
    assert get_res.json()["analysis_id"] == analysis_id
