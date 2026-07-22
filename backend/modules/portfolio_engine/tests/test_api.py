from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import modules.portfolio_engine.api.router as router_module


@pytest.fixture(autouse=True)
def _reset_service():
    router_module._service = None
    from modules.portfolio_engine.cache.cache import reset_portfolio_cache
    reset_portfolio_cache()
    yield
    router_module._service = None
    reset_portfolio_cache()


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(router_module.router)
    return TestClient(app)


def _valid_payload():
    return {
        "reference_date": "2026-01-15",
        "horizon": "month_3",
        "portfolio_size": 10,
        "max_per_sector": 2,
        "candidates": [
            {"symbol": "THYAO", "sector": "aviation", "elite_score": 85, "decision_score": 80, "confidence": 75, "risk": 30, "liquidity": 70},
            {"symbol": "GARAN", "sector": "banking", "elite_score": 78, "decision_score": 72, "confidence": 68, "risk": 40, "liquidity": 65},
            {"symbol": "ASELS", "sector": "defense", "elite_score": 72, "decision_score": 68, "confidence": 62, "risk": 35, "liquidity": 55},
            {"symbol": "SISE", "sector": "glass", "elite_score": 68, "decision_score": 65, "confidence": 58, "risk": 45, "liquidity": 50},
            {"symbol": "EREGL", "sector": "steel", "elite_score": 65, "decision_score": 62, "confidence": 55, "risk": 50, "liquidity": 48},
            {"symbol": "KCHOL", "sector": "auto", "elite_score": 62, "decision_score": 58, "confidence": 52, "risk": 55, "liquidity": 45},
            {"symbol": "BIMAS", "sector": "retail", "elite_score": 58, "decision_score": 55, "confidence": 48, "risk": 42, "liquidity": 60},
            {"symbol": "AKBNK", "sector": "banking", "elite_score": 55, "decision_score": 52, "confidence": 45, "risk": 48, "liquidity": 58},
            {"symbol": "TUPRS", "sector": "energy", "elite_score": 50, "decision_score": 48, "confidence": 40, "risk": 60, "liquidity": 42},
            {"symbol": "SAHOL", "sector": "banking", "elite_score": 35, "decision_score": 30, "confidence": 25, "risk": 70, "liquidity": 30},
            {"symbol": "KRDMD", "sector": "steel", "elite_score": 28, "decision_score": 25, "confidence": 20, "risk": 75, "liquidity": 25},
            {"symbol": "VESTL", "sector": "electronics", "elite_score": 20, "decision_score": 18, "confidence": 15, "risk": 85, "liquidity": 20},
        ],
    }


class TestPostGenerateValid:
    def test_status_code(self, client):
        resp = client.post("/portfolio/generate", json=_valid_payload())
        assert resp.status_code == 200

    def test_response_has_proposal(self, client):
        resp = client.post("/portfolio/generate", json=_valid_payload())
        data = resp.json()
        assert "proposal" in data

    def test_proposal_has_selected(self, client):
        resp = client.post("/portfolio/generate", json=_valid_payload())
        data = resp.json()
        assert len(data["proposal"]["selected"]) > 0

    def test_proposal_has_portfolio_id(self, client):
        resp = client.post("/portfolio/generate", json=_valid_payload())
        data = resp.json()
        assert data["proposal"]["portfolio_id"].startswith("pf-")

    def test_execution_time_non_negative(self, client):
        resp = client.post("/portfolio/generate", json=_valid_payload())
        data = resp.json()
        assert data["execution_time_ms"] >= 0


class TestPostGenerateEmpty:
    def test_empty_candidates_400(self, client):
        payload = _valid_payload()
        payload["candidates"] = []
        resp = client.post("/portfolio/generate", json=payload)
        assert resp.status_code == 400

    def test_empty_candidates_error_detail(self, client):
        payload = _valid_payload()
        payload["candidates"] = []
        resp = client.post("/portfolio/generate", json=payload)
        data = resp.json()
        assert "detail" in data


class TestGetPortfolioList:
    def test_status_code(self, client):
        resp = client.get("/portfolio/list")
        assert resp.status_code == 200

    def test_list_structure(self, client):
        resp = client.get("/portfolio/list")
        data = resp.json()
        assert "portfolios" in data
        assert isinstance(data["portfolios"], list)

    def test_list_after_generate(self, client):
        client.post("/portfolio/generate", json=_valid_payload())
        resp = client.get("/portfolio/list")
        data = resp.json()
        assert len(data["portfolios"]) == 1


class TestGetCurrentPortfolio:
    def test_no_generate_404(self, client):
        resp = client.get("/portfolio/current")
        assert resp.status_code == 404

    def test_after_generate_200(self, client):
        client.post("/portfolio/generate", json=_valid_payload())
        resp = client.get("/portfolio/current")
        assert resp.status_code == 200

    def test_current_has_proposal(self, client):
        client.post("/portfolio/generate", json=_valid_payload())
        resp = client.get("/portfolio/current")
        data = resp.json()
        assert "proposal" in data


class TestGetReport:
    def _generate_first(self, client):
        client.post("/portfolio/generate", json=_valid_payload())

    def test_full_report(self, client):
        self._generate_first(client)
        resp = client.get("/portfolio/report/full")
        assert resp.status_code == 200
        data = resp.json()
        assert data["report_type"] == "full"

    def test_summary_report(self, client):
        self._generate_first(client)
        resp = client.get("/portfolio/report/summary")
        assert resp.status_code == 200
        assert resp.json()["report_type"] == "summary"

    def test_selected_stocks_report(self, client):
        self._generate_first(client)
        resp = client.get("/portfolio/report/selected_stocks")
        assert resp.status_code == 200
        assert resp.json()["report_type"] == "selected_stocks"

    def test_rejected_stocks_report(self, client):
        self._generate_first(client)
        resp = client.get("/portfolio/report/rejected_stocks")
        assert resp.status_code == 200
        assert resp.json()["report_type"] == "rejected_stocks"

    def test_sector_distribution_report(self, client):
        self._generate_first(client)
        resp = client.get("/portfolio/report/sector_distribution")
        assert resp.status_code == 200
        assert resp.json()["report_type"] == "sector_distribution"

    def test_risk_summary_report(self, client):
        self._generate_first(client)
        resp = client.get("/portfolio/report/risk_summary")
        assert resp.status_code == 200
        assert resp.json()["report_type"] == "risk_summary"

    def test_invalid_report_type(self, client):
        self._generate_first(client)
        resp = client.get("/portfolio/report/invalid_type")
        assert resp.status_code == 400


class TestCacheEndpoints:
    def test_cache_stats(self, client):
        resp = client.get("/portfolio/cache/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "size" in data
        assert "hits" in data
        assert "misses" in data
        assert "hit_rate" in data

    def test_cache_clear(self, client):
        resp = client.post("/portfolio/cache/clear")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "cleared"

    def test_cache_stats_after_generate(self, client):
        client.post("/portfolio/generate", json=_valid_payload())
        resp = client.get("/portfolio/cache/stats")
        data = resp.json()
        assert data["size"] >= 1

    def test_cache_clear_resets(self, client):
        client.post("/portfolio/generate", json=_valid_payload())
        client.post("/portfolio/cache/clear")
        resp = client.get("/portfolio/cache/stats")
        data = resp.json()
        assert data["size"] == 0


class TestGenerateThenCacheHit:
    def test_second_generate_uses_cache(self, client):
        r1 = client.post("/portfolio/generate", json=_valid_payload())
        r2 = client.post("/portfolio/generate", json=_valid_payload())
        d1 = r1.json()
        d2 = r2.json()
        assert d1["proposal"]["portfolio_id"] == d2["proposal"]["portfolio_id"]
