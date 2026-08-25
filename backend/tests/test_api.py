"""
Integration and endpoint tests for FastAPI REST API routes using TestClient.
"""

from fastapi.testclient import TestClient


def test_api_root_endpoint(client: TestClient):
    """Verify root discovery endpoint returns 200 OK and service metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "MOIL" in data["service"]
    assert data["docs_url"] == "/docs"


def test_health_check_endpoint(client: TestClient):
    """Verify health endpoint returns 200 OK and model status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "model_loaded" in data
    assert data["uptime_seconds"] >= 0.0


def test_mines_catalog_endpoints(client: TestClient):
    """Verify mines master catalog returns 8 MOIL mines and handles lookup."""
    # List all mines
    response = client.get("/api/v1/mines")
    assert response.status_code == 200
    mines = response.json()
    assert len(mines) == 8
    mine_ids = [m["mine_id"] for m in mines]
    assert "MOIL-BAL-01" in mine_ids
    assert "MOIL-DBZ-02" in mine_ids

    # Get specific mine
    resp_single = client.get("/api/v1/mines/MOIL-BAL-01")
    assert resp_single.status_code == 200
    mine = resp_single.json()
    assert mine["name"] == "Balaghat Mine"
    assert mine["state"] == "Madhya Pradesh"

    # Non-existent mine 404
    resp_404 = client.get("/api/v1/mines/UNKNOWN_MINE_XYZ")
    assert resp_404.status_code == 404


def test_simulated_telemetry_endpoints(client: TestClient):
    """Verify simulated telemetry streamer endpoints."""
    # Generic simulation
    response = client.get("/api/v1/telemetry/simulated")
    assert response.status_code == 200
    data = response.json()
    assert "satellite" in data
    assert "equipment" in data
    assert "geology" in data

    # Mine-specific simulation with monsoon scenario
    resp_mine = client.get("/api/v1/telemetry/simulated/MOIL-DBZ-02?scenario=monsoon_heavy")
    assert resp_mine.status_code == 200
    mine_tel = resp_mine.json()
    assert mine_tel["mine_id"] == "MOIL-DBZ-02"
    assert mine_tel["scenario"] == "monsoon_heavy"
    assert mine_tel["satellite"]["rainfall_24h_mm"] >= 50.0


def test_predict_shortfall_nested_payload(client: TestClient, valid_nested_payload):
    """Verify shortfall prediction endpoint on valid nested payload."""
    response = client.post("/api/v1/predict/shortfall", json=valid_nested_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "success"
    assert data["mine_id"] == "MOIL-BAL-01"
    assert 0.0 <= data["shortfall_probability"] <= 1.0
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert 0.0 <= data["confidence_score"] <= 1.0
    assert len(data["corrective_actions"]) >= 1
    assert len(data["contributing_factors"]) >= 1


def test_predict_shortfall_flat_payload(client: TestClient, valid_flat_payload):
    """Verify shortfall prediction endpoint on flattened Next.js proxy payload."""
    response = client.post("/api/v1/predict/shortfall", json=valid_flat_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "success"
    assert data["mine_id"] == "MOIL-DBZ-02"
    assert 0.0 <= data["shortfall_probability"] <= 1.0
    assert len(data["corrective_actions"]) >= 1


def test_predict_shortfall_monsoon_risk(client: TestClient, monsoon_heavy_payload):
    """Verify severe monsoon conditions produce HIGH/CRITICAL risk level."""
    response = client.post("/api/v1/predict/shortfall", json=monsoon_heavy_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["shortfall_predicted"] is True
    assert data["risk_level"] in ["HIGH", "CRITICAL"]
    assert data["shortfall_probability"] >= 0.60
    assert data["expected_shortfall_tonnes"] > 0.0


def test_predict_shortfall_dry_optimal(client: TestClient, dry_optimal_payload):
    """Verify clear dry conditions produce LOW risk level."""
    response = client.post("/api/v1/predict/shortfall", json=dry_optimal_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["risk_level"] == "LOW"
    assert data["shortfall_probability"] < 0.35


def test_predict_shortfall_validation_error(client: TestClient):
    """Verify invalid input data returns 422 Unprocessable Entity."""
    invalid_payload = {
        "satellite": {
            "rainfall_24h_mm": -25.0, # Invalid negative rainfall
            "soil_moisture_pct": 140.0, # Invalid > 100%
        },
        "equipment": {
            "fleet_availability_pct": 80.0,
            "active_excavators": 2,
            "active_dumpers": 6,
            "unscheduled_downtime_hours": 1.0,
            "dumper_cycle_time_min": 0.0, # Invalid cycle time <= 0
        },
        "geology": {
            "mine_id": "MOIL-BAL-01",
            "planned_tonnage": 0.0, # Invalid tonnage <= 0
            "target_grade_mn_pct": 45.0,
            "estimated_block_grade_mn_pct": 44.0,
        }
    }

    response = client.post("/api/v1/predict/shortfall", json=invalid_payload)
    assert response.status_code == 422
    data = response.json()
    assert data["error_type"] == "ValidationError"
    assert len(data["details"]) > 0


def test_predict_batch_endpoint(client: TestClient, valid_nested_payload, monsoon_heavy_payload):
    """Verify batch prediction endpoint processes multiple sectors."""
    batch_payload = {
        "items": [
            valid_nested_payload,
            monsoon_heavy_payload,
        ]
    }

    response = client.post("/api/v1/predict/batch", json=batch_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "success"
    assert data["total_processed"] == 2
    assert len(data["predictions"]) == 2
    assert data["summary_high_risk_count"] >= 1
    assert data["summary_total_shortfall_tonnes"] >= 0.0


def test_model_retrain_endpoint(client: TestClient):
    """Verify model retraining endpoint executes and returns metrics."""
    train_payload = {
        "n_samples": 200,
        "random_state": 42,
        "force_retrain": True
    }

    response = client.post("/api/v1/train", json=train_payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "success"
    assert data["n_samples"] == 200
    assert data["accuracy"] >= 0.70
    assert data["f1_score"] >= 0.60
