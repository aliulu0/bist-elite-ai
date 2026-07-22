import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from modules.early_opportunity_engine.api.router import router


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


class TestOpportunityAPI:
    def test_get_top(self, client):
        resp = client.get("/api/v1/opportunity/top?limit=10")
        assert resp.status_code == 200
        data = resp.json()
        assert "results" in data

    def test_analyze(self, client):
        resp = client.post("/api/v1/opportunity/analyze", json={
            "symbol": "TEST",
            "metrics": {"close": 50.0, "rsi": 35.0, "volume": 1000000},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["result"]["symbol"] == "TEST"

    def test_batch_analyze(self, client):
        resp = client.post("/api/v1/opportunity/batch", json={
            "symbols": ["A", "B"],
            "metrics": {"A": {"close": 50.0}, "B": {"close": 30.0}},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 2

    def test_history(self, client):
        resp = client.get("/api/v1/opportunity/history")
        assert resp.status_code == 200

    def test_validate(self, client):
        resp = client.post("/api/v1/opportunity/validate", json={
            "metrics": {"close": 50.0, "rsi": 45.0},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["valid"] is True

    def test_cache_stats(self, client):
        resp = client.get("/api/v1/opportunity/cache/stats")
        assert resp.status_code == 200

    def test_clear_cache(self, client):
        resp = client.post("/api/v1/opportunity/cache/clear")
        assert resp.status_code == 200

    def test_summary(self, client):
        resp = client.get("/api/v1/opportunity/summary")
        assert resp.status_code == 200
