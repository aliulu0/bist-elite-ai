from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import modules.position_sizing_engine.api.router as router_module
from modules.position_sizing_engine.cache.cache import reset_position_sizing_cache

app = FastAPI()
app.include_router(router_module.router)


@pytest.fixture(autouse=True)
def reset_service_and_cache():
    router_module._service = None
    reset_position_sizing_cache()
    yield
    router_module._service = None
    reset_position_sizing_cache()


@pytest.fixture
def client():
    return TestClient(app)


def _valid_payload():
    return {
        "reference_date": "2025-01-01",
        "horizon": "month_3",
        "risk_profile": "balanced",
        "total_capital": 100000.0,
        "positions": [
            {
                "symbol": "THYAO",
                "sector": "aviation",
                "elite_score": 85,
                "confidence": 75,
                "risk": 30,
                "liquidity": 70,
                "avg_daily_volume": 1000000,
                "atr": 2.5,
                "volatility": 25,
                "beta": 1.1,
                "market_regime": "bull",
                "sector_exposure": 15,
                "correlation": 0.3,
                "agreement_score": 0.8,
                "price": 100,
            },
            {
                "symbol": "GARAN",
                "sector": "banking",
                "elite_score": 78,
                "confidence": 68,
                "risk": 40,
                "liquidity": 65,
                "avg_daily_volume": 800000,
                "atr": 3.0,
                "volatility": 30,
                "beta": 1.2,
                "market_regime": "bull",
                "sector_exposure": 20,
                "correlation": 0.4,
                "agreement_score": 0.7,
                "price": 50,
            },
            {
                "symbol": "ASELS",
                "sector": "defense",
                "elite_score": 72,
                "confidence": 62,
                "risk": 35,
                "liquidity": 55,
                "avg_daily_volume": 500000,
                "atr": 2.0,
                "volatility": 22,
                "beta": 0.9,
                "market_regime": "sideways",
                "sector_exposure": 10,
                "correlation": 0.2,
                "agreement_score": 0.6,
                "price": 80,
            },
            {
                "symbol": "SISE",
                "sector": "glass",
                "elite_score": 68,
                "confidence": 58,
                "risk": 45,
                "liquidity": 50,
                "avg_daily_volume": 300000,
                "atr": 3.5,
                "volatility": 35,
                "beta": 1.3,
                "market_regime": "bull",
                "sector_exposure": 12,
                "correlation": 0.5,
                "agreement_score": 0.5,
                "price": 40,
            },
            {
                "symbol": "SAHOL",
                "sector": "banking",
                "elite_score": 35,
                "confidence": 25,
                "risk": 70,
                "liquidity": 30,
                "avg_daily_volume": 200000,
                "atr": 4.0,
                "volatility": 40,
                "beta": 1.5,
                "market_regime": "bear",
                "sector_exposure": 25,
                "correlation": 0.6,
                "agreement_score": 0.3,
                "price": 20,
            },
        ],
        "max_sector_exposure": 30.0,
        "max_correlation": 0.7,
    }


class TestCalculateEndpoint:
    def test_valid_data_returns_200(self, client: TestClient):
        resp = client.post("/position/calculate", json=_valid_payload())
        assert resp.status_code == 200
        data = resp.json()
        assert "positions" in data
        assert len(data["positions"]) == 5

    def test_empty_positions_returns_400(self, client: TestClient):
        payload = _valid_payload()
        payload["positions"] = []
        resp = client.post("/position/calculate", json=payload)
        assert resp.status_code == 400

    def test_zero_capital_returns_422(self, client: TestClient):
        payload = _valid_payload()
        payload["total_capital"] = 0
        resp = client.post("/position/calculate", json=payload)
        assert resp.status_code == 422

    def test_response_has_execution_time(self, client: TestClient):
        resp = client.post("/position/calculate", json=_valid_payload())
        assert resp.status_code == 200
        assert "execution_time_ms" in resp.json()

    def test_response_positions_have_grades(self, client: TestClient):
        resp = client.post("/position/calculate", json=_valid_payload())
        data = resp.json()
        for pos in data["positions"]:
            assert "position_grade" in pos

    def test_response_positions_have_stop_loss(self, client: TestClient):
        resp = client.post("/position/calculate", json=_valid_payload())
        data = resp.json()
        for pos in data["positions"]:
            assert "stop_loss" in pos


class TestCurrentEndpoint:
    def test_after_calculate_returns_200(self, client: TestClient):
        client.post("/position/calculate", json=_valid_payload())
        resp = client.get("/position/current")
        assert resp.status_code == 200
        data = resp.json()
        assert "result" in data

    def test_no_calculate_returns_404(self, client: TestClient):
        resp = client.get("/position/current")
        assert resp.status_code == 404


class TestReportEndpoint:
    def _setup(self, client: TestClient):
        client.post("/position/calculate", json=_valid_payload())

    def test_full_report(self, client: TestClient):
        self._setup(client)
        resp = client.get("/position/report/full")
        assert resp.status_code == 200
        assert resp.json()["report_type"] == "full"

    def test_summary_report(self, client: TestClient):
        self._setup(client)
        resp = client.get("/position/report/summary")
        assert resp.status_code == 200
        assert resp.json()["report_type"] == "summary"

    def test_allocation_report(self, client: TestClient):
        self._setup(client)
        resp = client.get("/position/report/allocation")
        assert resp.status_code == 200
        assert resp.json()["report_type"] == "allocation"

    def test_risk_report(self, client: TestClient):
        self._setup(client)
        resp = client.get("/position/report/risk")
        assert resp.status_code == 200
        assert resp.json()["report_type"] == "risk"

    def test_exposure_report(self, client: TestClient):
        self._setup(client)
        resp = client.get("/position/report/exposure")
        assert resp.status_code == 200
        assert resp.json()["report_type"] == "exposure"

    def test_explainability_report(self, client: TestClient):
        self._setup(client)
        resp = client.get("/position/report/explainability")
        assert resp.status_code == 200
        assert resp.json()["report_type"] == "explainability"

    def test_invalid_report_type_returns_400(self, client: TestClient):
        self._setup(client)
        resp = client.get("/position/report/invalid_type")
        assert resp.status_code == 400


class TestExposureEndpoint:
    def test_after_calculate_returns_200(self, client: TestClient):
        client.post("/position/calculate", json=_valid_payload())
        resp = client.get("/position/exposure")
        assert resp.status_code == 200
        data = resp.json()
        assert "exposure" in data
        assert data["exposure"] is not None

    def test_no_calculate_returns_404(self, client: TestClient):
        resp = client.get("/position/exposure")
        assert resp.status_code == 404


class TestCacheEndpoints:
    def test_cache_stats_returns_200(self, client: TestClient):
        resp = client.get("/position/cache/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "size" in data
        assert "hits" in data
        assert "misses" in data

    def test_cache_clear_returns_200(self, client: TestClient):
        resp = client.post("/position/cache/clear")
        assert resp.status_code == 200
        assert resp.json()["status"] == "cleared"

    def test_cache_stats_after_calculation(self, client: TestClient):
        client.post("/position/calculate", json=_valid_payload())
        resp = client.get("/position/cache/stats")
        data = resp.json()
        assert data["size"] >= 1
