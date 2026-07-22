from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from modules.market_regime_engine.core.types import (
    DetectionSignal,
    InvestmentHorizon,
    MarketRegime,
    RegimeAnalysisRequest,
    ReportType,
)
from modules.market_regime_engine.services.service import MarketRegimeService

MARKET_DATA = {
    "price": 105.0, "ma20": 100.0, "ma50": 95.0, "ma200": 90.0,
    "rsi": 60.0, "macd_hist": 0.5, "roc": 2.0, "stochastic_k": 65.0,
    "adx": 30.0, "plus_di": 35.0, "minus_di": 20.0,
    "vix": 18.0, "atr": 1.5, "atr_pct": 1.2,
    "advance_decline_ratio": 1.3, "pct_above_ma50": 65.0,
    "relative_volume": 1.5, "obv_trend": 0.3, "cmf": 0.1,
    "leading_sectors": 5.0, "weak_sectors": 2.0, "total_sectors": 10.0,
    "bid_ask_spread": 0.005, "market_depth": 1.5, "turnover_ratio": 1.2,
    "advance_decline_pct": 60.0, "pct_above_ma200": 65.0,
    "new_52w_highs_pct": 15.0, "up_volume_pct": 58.0,
    "new_highs_lows_ratio": 0.5,
}


def _make_request(**overrides) -> RegimeAnalysisRequest:
    defaults = {
        "reference_date": "2025-06-15",
        "horizon": InvestmentHorizon.MONTH_3,
        "signals": list(DetectionSignal),
        "market_data": MARKET_DATA.copy(),
        "lookback_days": 252,
        "min_confidence": 0.3,
        "include_transitions": True,
        "include_sectors": True,
    }
    defaults.update(overrides)
    return RegimeAnalysisRequest(**defaults)


class TestServiceConstruction:
    def test_default_construction(self):
        svc = MarketRegimeService()
        assert svc._classifier is not None
        assert svc._history_tracker is not None
        assert svc._report_generator is not None
        assert svc._request_validator is not None
        assert svc._result_validator is not None
        assert svc._cache is not None
        assert svc._analyses == []


class TestServiceAnalyze:
    def setup_method(self):
        self.svc = MarketRegimeService()

    def test_analyze_success(self):
        request = _make_request()
        result = self.svc.analyze(request)
        assert result.classification.regime is not None
        assert result.classification.confidence >= 0.0
        assert result.execution_time_ms >= 0.0
        assert result.strategy_profile is not None

    def test_analyze_records_history(self):
        request = _make_request()
        self.svc.analyze(request)
        history = self.svc.get_history()
        assert len(history) >= 1

    def test_analyze_with_sectors(self):
        sector_data = {
            "Tech": {"performance": 0.1, "momentum": 0.15, "volume_trend": 1.5},
            "Healthcare": {"performance": -0.05, "momentum": -0.1, "volume_trend": 0.8},
        }
        request = _make_request(sector_data=sector_data)
        result = self.svc.analyze(request)
        assert len(result.sectors) == 2

    def test_analyze_empty_market_data_raises(self):
        request = _make_request(market_data={})
        with pytest.raises(ValueError, match="Invalid request"):
            self.svc.analyze(request)

    def test_analyze_cache_hit(self):
        request = _make_request()
        result1 = self.svc.analyze(request)
        result2 = self.svc.analyze(request)
        assert result1 is result2

    def test_analyze_empty_date_raises(self):
        request = _make_request(reference_date="")
        with pytest.raises(ValueError, match="Invalid request"):
            self.svc.analyze(request)


class TestServiceGetters:
    def setup_method(self):
        self.svc = MarketRegimeService()

    def test_get_current_none(self):
        assert self.svc.get_current() is None

    def test_get_current_after_analyze(self):
        self.svc.analyze(_make_request())
        current = self.svc.get_current()
        assert current is not None

    def test_get_history(self):
        self.svc.analyze(_make_request())
        history = self.svc.get_history()
        assert len(history) == 1
        assert "date" in history[0]
        assert "regime" in history[0]

    def test_get_sectors_none(self):
        assert self.svc.get_sectors() == []

    def test_get_sectors_after_analyze(self):
        sector_data = {
            "Tech": {"performance": 0.1, "momentum": 0.15, "volume_trend": 1.5},
        }
        self.svc.analyze(_make_request(sector_data=sector_data))
        sectors = self.svc.get_sectors()
        assert len(sectors) == 1
        assert sectors[0]["sector"] == "Tech"

    def test_get_transitions_none(self):
        result = self.svc.get_transitions()
        assert result["transitions"] == []
        assert result["current_regime"] is None

    def test_get_transitions_after_analyze(self):
        self.svc.analyze(_make_request())
        result = self.svc.get_transitions()
        assert "transitions" in result
        assert "current_regime" in result


class TestServiceReport:
    def setup_method(self):
        self.svc = MarketRegimeService()

    def test_generate_report_no_analysis(self):
        for rt in ReportType:
            report = self.svc.generate_report(rt)
            assert "error" in report

    def test_generate_all_report_types(self):
        self.svc.analyze(_make_request())
        for rt in ReportType:
            report = self.svc.generate_report(rt)
            assert "report_type" in report


class TestServiceCache:
    def setup_method(self):
        self.svc = MarketRegimeService()

    def test_clear_cache(self):
        self.svc.analyze(_make_request())
        self.svc.clear_cache()
        stats = self.svc.get_cache_stats()
        assert stats["size"] == 0

    def test_get_cache_stats(self):
        stats = self.svc.get_cache_stats()
        assert stats["size"] == 0
        assert stats["hits"] == 0
        assert stats["misses"] == 0
        assert stats["hit_rate"] == 0.0
        assert stats["max_size"] == 256
        assert stats["ttl_seconds"] == 3600.0


@pytest.fixture(autouse=True)
def _reset_router_service():
    import modules.market_regime_engine.api.router as router_module
    router_module._service = None
    yield
    router_module._service = None


def _create_test_app() -> FastAPI:
    from modules.market_regime_engine.api.router import router
    app = FastAPI()
    app.include_router(router)
    return app


class TestAPIAnalyze:
    def test_post_analyze(self):
        app = _create_test_app()
        client = TestClient(app)
        payload = {
            "reference_date": "2025-06-15",
            "horizon": "3_months",
            "signals": ["moving_average_structure", "momentum", "trend_strength"],
            "market_data": MARKET_DATA,
            "lookback_days": 252,
            "min_confidence": 0.3,
            "include_transitions": True,
            "include_sectors": True,
        }
        resp = client.post("/market-regime/analyze", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "classification" in data
        assert data["classification"]["regime"] is not None

    def test_post_analyze_empty_market_data(self):
        app = _create_test_app()
        client = TestClient(app)
        payload = {
            "reference_date": "2025-06-15",
            "horizon": "3_months",
            "market_data": {},
        }
        resp = client.post("/market-regime/analyze", json=payload)
        assert resp.status_code == 400


class TestAPICurrent:
    def test_get_current_after_analyze(self):
        app = _create_test_app()
        client = TestClient(app)
        payload = {
            "reference_date": "2025-06-15",
            "horizon": "3_months",
            "market_data": MARKET_DATA,
        }
        client.post("/market-regime/analyze", json=payload)
        resp = client.get("/market-regime/current")
        assert resp.status_code == 200
        data = resp.json()
        assert "regime" in data

    def test_get_current_no_analysis(self):
        app = _create_test_app()
        client = TestClient(app)
        resp = client.get("/market-regime/current")
        assert resp.status_code == 404


class TestAPIHistory:
    def test_get_history(self):
        app = _create_test_app()
        client = TestClient(app)
        payload = {
            "reference_date": "2025-06-15",
            "horizon": "3_months",
            "market_data": MARKET_DATA,
        }
        client.post("/market-regime/analyze", json=payload)
        resp = client.get("/market-regime/history")
        assert resp.status_code == 200
        data = resp.json()
        assert "history" in data
        assert "total_entries" in data


class TestAPISectors:
    def test_get_sectors(self):
        app = _create_test_app()
        client = TestClient(app)
        payload = {
            "reference_date": "2025-06-15",
            "horizon": "3_months",
            "market_data": MARKET_DATA,
            "sector_data": {
                "Tech": {"performance": 0.1, "momentum": 0.15, "volume_trend": 1.5},
            },
        }
        client.post("/market-regime/analyze", json=payload)
        resp = client.get("/market-regime/sectors")
        assert resp.status_code == 200
        data = resp.json()
        assert "sectors" in data
        assert "leading_sectors" in data
        assert "weak_sectors" in data


class TestAPITransitions:
    def test_get_transitions(self):
        app = _create_test_app()
        client = TestClient(app)
        payload = {
            "reference_date": "2025-06-15",
            "horizon": "3_months",
            "market_data": MARKET_DATA,
        }
        client.post("/market-regime/analyze", json=payload)
        resp = client.get("/market-regime/transitions")
        assert resp.status_code == 200
        data = resp.json()
        assert "transitions" in data
        assert "current_regime" in data


class TestAPIReport:
    def test_get_all_report_types(self):
        app = _create_test_app()
        client = TestClient(app)
        payload = {
            "reference_date": "2025-06-15",
            "horizon": "3_months",
            "market_data": MARKET_DATA,
        }
        client.post("/market-regime/analyze", json=payload)
        for rt in ReportType:
            resp = client.get(f"/market-regime/report/{rt.value}")
            assert resp.status_code == 200

    def test_invalid_report_type(self):
        app = _create_test_app()
        client = TestClient(app)
        resp = client.get("/market-regime/report/invalid_type")
        assert resp.status_code == 400


class TestAPICache:
    def test_get_cache_stats(self):
        app = _create_test_app()
        client = TestClient(app)
        resp = client.get("/market-regime/cache/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "size" in data
        assert "hits" in data

    def test_clear_cache(self):
        app = _create_test_app()
        client = TestClient(app)
        resp = client.post("/market-regime/cache/clear")
        assert resp.status_code == 200
        assert resp.json()["status"] == "cleared"
