import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from modules.backtest_engine.api.router import router


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


@pytest.fixture
def sample_request():
    return {
        "symbol": "TUPRS",
        "strategy": "test",
        "start_date": "2023-01-01",
        "end_date": "2025-12-31",
        "initial_capital": 100000.0,
    }


class TestBacktestAPI:
    def test_health(self, client):
        resp = client.get("/backtest/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    def test_run(self, client, sample_request):
        resp = client.post("/backtest/run", json=sample_request)
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "TUPRS"
        assert len(data["equity_curve"]) > 0

    def test_list(self, client, sample_request):
        client.post("/backtest/run", json=sample_request)
        resp = client.get("/backtest/list")
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    def test_history(self, client, sample_request):
        client.post("/backtest/run", json=sample_request)
        resp = client.get("/backtest/history/TUPRS")
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    def test_summary(self, client, sample_request):
        client.post("/backtest/run", json=sample_request)
        resp = client.get("/backtest/summary")
        assert resp.status_code == 200
        assert resp.json()["total_backtests"] >= 1

    def test_report(self, client, sample_request):
        client.post("/backtest/run", json=sample_request)
        resp = client.post("/backtest/report", json={"symbol": "TUPRS", "report_type": "executive"})
        assert resp.status_code == 200
        assert "content" in resp.json()

    def test_report_not_found(self, client):
        resp = client.post("/backtest/report", json={"symbol": "NONEXISTENT", "report_type": "executive"})
        assert resp.status_code == 404

    def test_compare(self, client):
        resp = client.post("/backtest/compare", json={
            "symbols": ["TUPRS", "GARAN"],
            "start_date": "2023-01-01",
            "end_date": "2025-12-31",
        })
        assert resp.status_code == 200
        assert resp.json()["count"] == 2

    def test_benchmark(self, client):
        resp = client.post("/backtest/benchmark?iterations=2")
        assert resp.status_code == 200
        assert resp.json()["success"] is True

    def test_cache_stats(self, client):
        resp = client.get("/backtest/cache/stats")
        assert resp.status_code == 200
        assert "size" in resp.json()

    def test_cache_clear(self, client):
        resp = client.post("/backtest/cache/clear")
        assert resp.status_code == 200
        assert "cleared" in resp.json()

    def test_run_with_parameters(self, client):
        req = {
            "symbol": "GARAN",
            "strategy": "custom",
            "start_date": "2023-01-01",
            "end_date": "2025-12-31",
            "initial_capital": 50000.0,
            "stop_loss_pct": 3.0,
            "take_profit_pct": 10.0,
            "parameters": {"buy_threshold": 70},
        }
        resp = client.post("/backtest/run", json=req)
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "GARAN"
        assert data["metrics"]["total_trades"] >= 0

    def test_multiple_reports(self, client, sample_request):
        client.post("/backtest/run", json=sample_request)
        for rtype in ["executive", "trade_list", "performance", "risk", "benchmark"]:
            resp = client.post("/backtest/report", json={"symbol": "TUPRS", "report_type": rtype})
            assert resp.status_code == 200
