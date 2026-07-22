import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from modules.decision_engine.api.router import router


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


@pytest.fixture
def sample_request():
    return {
        "symbol": "TUPRS",
        "engine_data": {
            "unified_scoring": {"score": 72.0, "confidence": 80.0, "signals": {"financial": 75.0}},
            "elite_score": {"score": 68.0, "confidence": 75.0, "signals": {"trend": 70.0, "momentum": 65.0}},
            "confidence": {"score": 65.0, "confidence": 70.0, "signals": {"risk": 60.0, "market": 68.0}},
        },
    }


class TestDecisionAPI:
    def test_health(self, client):
        resp = client.get("/decision/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    def test_generate(self, client, sample_request):
        resp = client.post("/decision/generate", json=sample_request)
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "TUPRS"
        assert data["decision_score"] >= 0

    def test_list(self, client, sample_request):
        client.post("/decision/generate", json=sample_request)
        resp = client.get("/decision/list")
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    def test_top(self, client, sample_request):
        client.post("/decision/generate", json=sample_request)
        resp = client.get("/decision/top?count=5")
        assert resp.status_code == 200

    def test_details(self, client, sample_request):
        client.post("/decision/generate", json=sample_request)
        resp = client.get("/decision/details/TUPRS")
        assert resp.status_code == 200
        assert resp.json()["symbol"] == "TUPRS"

    def test_details_not_found(self, client):
        resp = client.get("/decision/details/NONEXISTENT")
        assert resp.status_code == 404

    def test_history(self, client, sample_request):
        client.post("/decision/generate", json=sample_request)
        resp = client.get("/decision/history/TUPRS")
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    def test_report(self, client, sample_request):
        client.post("/decision/generate", json=sample_request)
        resp = client.post("/decision/report", json={"symbol": "TUPRS", "report_type": "executive"})
        assert resp.status_code == 200
        assert "content" in resp.json()

    def test_report_not_found(self, client):
        resp = client.post("/decision/report", json={"symbol": "NONEXISTENT", "report_type": "executive"})
        assert resp.status_code == 404

    def test_benchmark(self, client):
        resp = client.post("/decision/benchmark?iterations=3")
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_cache_stats(self, client):
        resp = client.get("/decision/cache/stats")
        assert resp.status_code == 200
        assert "size" in resp.json()

    def test_cache_clear(self, client):
        resp = client.post("/decision/cache/clear")
        assert resp.status_code == 200
        assert "cleared" in resp.json()

    def test_generate_with_all_fields(self, client):
        req = {
            "symbol": "GARAN",
            "engine_data": {
                "unified_scoring": {"score": 85.0, "confidence": 90.0, "signals": {"financial": 88.0}},
                "elite_score": {"score": 82.0, "confidence": 85.0, "signals": {"trend": 85.0, "momentum": 80.0, "smart_money": 78.0}},
                "confidence": {"score": 78.0, "confidence": 80.0, "signals": {"risk": 75.0, "sector": 80.0, "market": 72.0, "liquidity": 85.0}},
            },
            "sector": "banking",
            "profile": "aggressive",
            "existing_positions": {"TUPRS": {"weight": 5.0, "sector": "energy", "decision_score": 70.0}},
        }
        resp = client.post("/decision/generate", json=req)
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "GARAN"
        assert len(data["dimension_scores"]) > 0
        assert len(data["horizon_recommendations"]) == 5

    def test_multiple_generations(self, client, sample_request):
        for sym in ["TUPRS", "GARAN", "AKBNK"]:
            req = dict(sample_request)
            req["symbol"] = sym
            client.post("/decision/generate", json=req)
        resp = client.get("/decision/list")
        assert resp.json()["total"] >= 3
