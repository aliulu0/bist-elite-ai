import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from modules.monte_carlo_engine.api.router import router
from modules.monte_carlo_engine.cache.cache import reset_monte_carlo_cache
from modules.monte_carlo_engine.registry.registry import reset_monte_carlo_registry


app = FastAPI()
app.include_router(router)


class TestMonteCarloAPI:
    def setup_method(self):
        reset_monte_carlo_cache()
        reset_monte_carlo_registry()
        self.client = TestClient(app)

    def teardown_method(self):
        reset_monte_carlo_cache()
        reset_monte_carlo_registry()

    def test_health(self):
        resp = self.client.get("/monte-carlo/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    def test_run(self):
        resp = self.client.post("/monte-carlo/run", json={
            "symbol": "TUPRS",
            "num_simulations": 200,
            "num_days": 30,
            "seed": 42,
        })
        assert resp.status_code == 200
        assert resp.json()["symbol"] == "TUPRS"

    def test_list(self):
        resp = self.client.get("/monte-carlo/list")
        assert resp.status_code == 200
        assert "items" in resp.json()

    def test_summary(self):
        resp = self.client.get("/monte-carlo/summary")
        assert resp.status_code == 200
        assert "total_simulations" in resp.json()

    def test_scenarios(self):
        resp = self.client.get("/monte-carlo/scenarios")
        assert resp.status_code == 200
        assert len(resp.json()) == 9

    def test_report(self):
        self.client.post("/monte-carlo/run", json={"symbol": "TUPRS", "num_simulations": 200, "num_days": 30, "seed": 42})
        resp = self.client.post("/monte-carlo/report", json={"symbol": "TUPRS", "report_type": "executive"})
        assert resp.status_code == 200
        assert "content" in resp.json()

    def test_report_not_found(self):
        resp = self.client.post("/monte-carlo/report", json={"symbol": "MISSING"})
        assert resp.status_code == 404

    def test_benchmark(self):
        resp = self.client.post("/monte-carlo/benchmark?iterations=2")
        assert resp.status_code == 200

    def test_cache_stats(self):
        resp = self.client.get("/monte-carlo/cache/stats")
        assert resp.status_code == 200

    def test_cache_clear(self):
        resp = self.client.post("/monte-carlo/cache/clear")
        assert resp.status_code == 200
