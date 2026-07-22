import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from modules.walk_forward_engine.api.router import router
from modules.walk_forward_engine.services.service import WalkForwardService
from modules.walk_forward_engine.cache.cache import reset_walk_forward_cache
from modules.walk_forward_engine.registry.registry import reset_walk_forward_registry


app = FastAPI()
app.include_router(router)


class TestWalkForwardAPI:
    def setup_method(self):
        reset_walk_forward_cache()
        reset_walk_forward_registry()
        self.client = TestClient(app)

    def teardown_method(self):
        reset_walk_forward_cache()
        reset_walk_forward_registry()

    def test_health(self):
        resp = self.client.get("/walk-forward/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    def test_run(self):
        resp = self.client.post("/walk-forward/run", json={
            "symbol": "TUPRS",
            "start_date": "2022-01-01",
            "end_date": "2024-12-31",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "TUPRS"

    def test_list(self):
        resp = self.client.get("/walk-forward/list")
        assert resp.status_code == 200
        assert "items" in resp.json()

    def test_history(self):
        resp = self.client.get("/walk-forward/history/TUPRS")
        assert resp.status_code == 200
        assert resp.json()["symbol"] == "TUPRS"

    def test_summary(self):
        resp = self.client.get("/walk-forward/summary")
        assert resp.status_code == 200
        assert "total_analyses" in resp.json()

    def test_report(self):
        self.client.post("/walk-forward/run", json={"symbol": "TUPRS", "start_date": "2022-01-01", "end_date": "2024-12-31"})
        resp = self.client.post("/walk-forward/report", json={"symbol": "TUPRS", "report_type": "executive"})
        assert resp.status_code == 200
        assert "content" in resp.json()

    def test_report_not_found(self):
        resp = self.client.post("/walk-forward/report", json={"symbol": "MISSING"})
        assert resp.status_code == 404

    def test_benchmark(self):
        resp = self.client.post("/walk-forward/benchmark?iterations=2")
        assert resp.status_code == 200

    def test_cache_stats(self):
        resp = self.client.get("/walk-forward/cache/stats")
        assert resp.status_code == 200
        assert "size" in resp.json()

    def test_cache_clear(self):
        resp = self.client.post("/walk-forward/cache/clear")
        assert resp.status_code == 200

    def test_run_with_parameters(self):
        resp = self.client.post("/walk-forward/run", json={
            "symbol": "THYAO",
            "parameter_space": {"sma_short": [10, 20], "sma_long": [50, 100]},
            "start_date": "2022-01-01",
            "end_date": "2024-12-31",
        })
        assert resp.status_code == 200
        assert resp.json()["symbol"] == "THYAO"
