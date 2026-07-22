import json
from fastapi import FastAPI
from fastapi.testclient import TestClient
from modules.scoring_engine.api.router import router


app = FastAPI()
app.include_router(router)
client = TestClient(app)


class TestScoringAPI:
    def test_calculate(self):
        resp = client.post("/api/v1/scoring/calculate", json={
            "symbol": "TEST",
            "metrics": {"pe_ratio": 15.0, "roe": 12.0, "rsi": 45.0},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "TEST"
        assert data["composite_score"] > 0

    def test_list(self):
        resp = client.get("/api/v1/scoring/list", params={"symbols": "T1,T2"})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    def test_details(self):
        resp = client.get("/api/v1/scoring/details", params={
            "symbol": "TEST", "score_type": "financial",
            "metrics": json.dumps({"pe_ratio": 15.0}),
        })
        assert resp.status_code == 200
        assert resp.json()["score_type"] == "financial"

    def test_history(self):
        client.post("/api/v1/scoring/calculate", json={"symbol": "HIST", "metrics": {}})
        resp = client.get("/api/v1/scoring/history", params={"symbol": "HIST"})
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    def test_weights(self):
        resp = client.get("/api/v1/scoring/weights")
        assert resp.status_code == 200
        assert len(resp.json()["weights"]) > 0

    def test_profiles(self):
        resp = client.get("/api/v1/scoring/profiles")
        assert resp.status_code == 200
        assert resp.json()["total"] >= 5

    def test_create_profile(self):
        resp = client.post("/api/v1/scoring/profile", json={
            "name": "MyProfile", "profile": "growth", "description": "Test",
        })
        assert resp.status_code == 200
        assert resp.json()["name"] == "MyProfile"

    def test_optimize(self):
        resp = client.post("/api/v1/scoring/optimize", json={"iterations": 10})
        assert resp.status_code == 200
        assert resp.json()["iterations"] == 10

    def test_validate(self):
        resp = client.post("/api/v1/scoring/validate", json={
            "symbol": "TEST", "metrics": {"pe": 15},
        })
        assert resp.status_code == 200
        assert resp.json()["valid"] is True

    def test_cache_stats(self):
        resp = client.get("/api/v1/scoring/cache/stats")
        assert resp.status_code == 200
        assert "size" in resp.json()

    def test_cache_clear(self):
        resp = client.post("/api/v1/scoring/cache/clear")
        assert resp.status_code == 200

    def test_benchmark(self):
        resp = client.post("/api/v1/scoring/benchmark", params={"iterations": 10})
        assert resp.status_code == 200
        assert resp.json()["iterations"] == 10

    def test_calculate_aggressive(self):
        resp = client.post("/api/v1/scoring/calculate", json={
            "symbol": "TEST", "metrics": {"momentum": 5.0, "rsi": 70.0},
            "profile": "aggressive", "horizon": "weekly", "regime": "bull",
        })
        assert resp.status_code == 200
        assert resp.json()["profile"] == "aggressive"
