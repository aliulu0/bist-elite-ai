import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from modules.elite_score_engine.api.router import router
from modules.elite_score_engine.weights.manager import reset_weight_manager
from modules.elite_score_engine.profiles.manager import reset_profile_manager
from modules.elite_score_engine.cache.cache import reset_elite_cache

app = FastAPI()
app.include_router(router)


@pytest.fixture(autouse=True)
def fresh():
    reset_weight_manager()
    reset_profile_manager()
    reset_elite_cache()
    yield
    reset_weight_manager()
    reset_profile_manager()
    reset_elite_cache()


@pytest.fixture
def client():
    return TestClient(app)


class TestEliteScoreAPI:
    def test_calculate(self, client):
        resp = client.post("/api/v1/elite-score/calculate", json={
            "symbol": "TUPRS",
            "scores": {"financial": 70.0, "momentum": 65.0},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "TUPRS"
        assert 0 <= data["elite_score"] <= 100

    def test_calculate_with_dimensions(self, client):
        resp = client.post("/api/v1/elite-score/calculate", json={
            "symbol": "TUPRS",
            "scores": {"financial": 70.0},
            "dimension_scores": {"momentum": 80.0},
        })
        assert resp.status_code == 200

    def test_list(self, client):
        resp = client.post("/api/v1/elite-score/list", json={
            "symbols": ["TUPRS", "GARAN"],
            "scores": {"TUPRS": {"financial": 70.0}, "GARAN": {"financial": 60.0}},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 2

    def test_top(self, client):
        resp = client.get("/api/v1/elite-score/top?n=5")
        assert resp.status_code == 200

    def test_profiles(self, client):
        resp = client.get("/api/v1/elite-score/profiles")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] >= 3

    def test_weights(self, client):
        resp = client.get("/api/v1/elite-score/weights")
        assert resp.status_code == 200
        data = resp.json()
        assert data["profile_name"] == "balanced"

    def test_validate_valid(self, client):
        resp = client.post("/api/v1/elite-score/validate", json={
            "scores": {"financial": 70.0},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_valid"] is True

    def test_validate_invalid(self, client):
        resp = client.post("/api/v1/elite-score/validate", json={
            "scores": {},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_valid"] is False

    def test_cache_stats(self, client):
        resp = client.get("/api/v1/elite-score/cache/stats")
        assert resp.status_code == 200

    def test_cache_clear(self, client):
        resp = client.post("/api/v1/elite-score/cache/clear")
        assert resp.status_code == 200
        assert resp.json()["cleared"] >= 0

    def test_benchmark(self, client):
        resp = client.post("/api/v1/elite-score/benchmark", json={
            "iterations": 3,
            "warmup": 1,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True

    def test_history(self, client):
        resp = client.get("/api/v1/elite-score/history?symbol=TUPRS")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] >= 0

    def test_ranking(self, client):
        resp = client.get("/api/v1/elite-score/ranking")
        assert resp.status_code == 200

    def test_details_not_found(self, client):
        resp = client.get("/api/v1/elite-score/details?symbol=NONEXIST")
        assert resp.status_code == 404

    def test_details_after_calculate(self, client):
        client.post("/api/v1/elite-score/calculate", json={
            "symbol": "TUPRS",
            "scores": {"financial": 70.0},
        })
        resp = client.get("/api/v1/elite-score/details?symbol=TUPRS")
        assert resp.status_code == 200
