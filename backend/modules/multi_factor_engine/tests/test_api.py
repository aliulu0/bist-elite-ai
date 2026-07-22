from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import modules.multi_factor_engine.api.router as router_module
from modules.multi_factor_engine.api.router import router


app = FastAPI()
app.include_router(router)
client = TestClient(app)

RICH_BODY = {
    "symbol": "AAPL",
    "reference_date": "2024-01-15",
    "horizon": "month_3",
    "market_data": {
        "price": 105.0,
        "bid_ask_spread": 0.005,
        "depth_of_market": 1.5,
    },
    "financial_data": {
        "price_to_dividends": 20.0,
        "price_to_cashflow": 15.0,
        "forward_pe": 12.0,
        "peg_ratio": 1.2,
        "enterprise_value": 1000000,
        "market_cap": 900000,
        "revenue_growth": 15.0,
        "net_profit_growth": 20.0,
        "ebitda_growth": 18.0,
        "eps_growth": 12.0,
        "cash_flow_growth": 10.0,
        "roe": 18.0,
        "roa": 8.0,
        "gross_margin": 45.0,
        "operating_margin": 15.0,
        "net_margin": 10.0,
        "piotroski_score": 7,
        "altman_z": 2.5,
        "beta": 1.1,
        "asset_turnover": 1.2,
        "inventory_turnover": 6.0,
        "receivable_turnover": 8.0,
        "current_ratio": 1.8,
        "debt_to_equity": 0.5,
        "interest_coverage": 8.0,
        "free_cash_flow_yield": 0.05,
    },
    "indicator_data": {
        "rsi": 55.0,
        "macd_hist": 0.5,
        "adx": 28.0,
        "plus_di": 30.0,
        "minus_di": 22.0,
        "roc": 3.0,
        "relative_strength": 5.0,
        "ma20": 100.0,
        "ma50": 95.0,
        "sma20": 100.0,
        "sma50": 95.0,
        "sma200": 90.0,
        "ema12": 102.0,
        "ema26": 98.0,
        "supertrend": 98.0,
        "ichimoku_cloud": 96.0,
        "volatility": 25.0,
        "max_drawdown": -15.0,
        "obv_trend": 0.3,
        "cmf": 0.08,
        "relative_volume": 1.3,
        "institutional_accumulation": 0.6,
        "atr": 1.5,
        "bollinger_upper": 110.0,
        "bollinger_lower": 95.0,
        "vwap": 102.0,
        "market_depth": 1.5,
    },
    "sector_data": {"sector_pe": 15.0},
    "include_profile": True,
    "include_ranking": True,
}


@pytest.fixture(autouse=True)
def _reset_service():
    router_module._service = None
    yield
    router_module._service = None


class TestAnalyzeEndpoint:
    def test_analyze_rich_data_200(self):
        resp = client.post("/factors/analyze", json=RICH_BODY)
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "AAPL"
        assert data["profile"] is not None
        assert data["ranking"] is not None

    def test_analyze_profile_has_groups(self):
        resp = client.post("/factors/analyze", json=RICH_BODY)
        data = resp.json()
        assert len(data["profile"]["group_scores"]) > 0

    def test_analyze_profile_has_factors(self):
        resp = client.post("/factors/analyze", json=RICH_BODY)
        data = resp.json()
        assert len(data["profile"]["factor_scores"]) > 0

    def test_analyze_empty_symbol_400(self):
        body = {**RICH_BODY, "symbol": ""}
        resp = client.post("/factors/analyze", json=body)
        assert resp.status_code == 400

    def test_analyze_execution_time(self):
        resp = client.post("/factors/analyze", json=RICH_BODY)
        data = resp.json()
        assert data["execution_time_ms"] >= 0

    def test_analyze_cache_hit_same_response(self):
        r1 = client.post("/factors/analyze", json=RICH_BODY)
        r2 = client.post("/factors/analyze", json=RICH_BODY)
        assert r1.json()["symbol"] == r2.json()["symbol"]


class TestFactorListEndpoint:
    def test_list_200(self):
        resp = client.get("/factors/list")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_groups"] == 12
        assert data["total_factors"] == 51

    def test_list_has_groups(self):
        resp = client.get("/factors/list")
        data = resp.json()
        assert "value" in data["groups"]

    def test_list_has_group_details(self):
        resp = client.get("/factors/list")
        data = resp.json()
        assert "value" in data["group_details"]
        assert len(data["group_details"]["value"]) == 6


class TestFactorDetailsEndpoint:
    def test_details_valid_group_200(self):
        resp = client.get("/factors/details/value")
        assert resp.status_code == 200
        data = resp.json()
        assert data["group"] == "value"
        assert data["total_factors"] == 6

    def test_details_invalid_group_400(self):
        resp = client.get("/factors/details/invalid")
        assert resp.status_code == 400

    def test_details_growth_group(self):
        resp = client.get("/factors/details/growth")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_factors"] == 5

    def test_details_response_structure(self):
        resp = client.get("/factors/details/quality")
        data = resp.json()
        assert "group" in data
        assert "factors" in data
        assert "description" in data


class TestHistoryEndpoint:
    def test_history_empty_200(self):
        resp = client.get("/factors/history/NODATA")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_entries"] == 0

    def test_history_after_analyze(self):
        client.post("/factors/analyze", json=RICH_BODY)
        resp = client.get("/factors/history/AAPL")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_entries"] >= 1


class TestCacheEndpoints:
    def test_cache_stats_200(self):
        resp = client.get("/factors/cache/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert "size" in data
        assert "hits" in data

    def test_cache_clear_200(self):
        resp = client.post("/factors/cache/clear")
        assert resp.status_code == 200
        assert resp.json()["status"] == "cleared"

    def test_cache_stats_after_analyze(self):
        client.post("/factors/analyze", json=RICH_BODY)
        resp = client.get("/factors/cache/stats")
        data = resp.json()
        assert data["size"] == 1


class TestReportEndpoints:
    def test_full_report_200(self):
        client.post("/factors/analyze", json=RICH_BODY)
        resp = client.get("/factors/report/full?symbol=AAPL")
        assert resp.status_code == 200
        data = resp.json()
        assert data["type"] == "full"

    def test_summary_report_200(self):
        client.post("/factors/analyze", json=RICH_BODY)
        resp = client.get("/factors/report/summary?symbol=AAPL")
        assert resp.status_code == 200
        assert resp.json()["type"] == "summary"

    def test_breakdown_report_200(self):
        client.post("/factors/analyze", json=RICH_BODY)
        resp = client.get("/factors/report/factor_breakdown?symbol=AAPL")
        assert resp.status_code == 200
        assert resp.json()["type"] == "factor_breakdown"

    def test_ranking_report_200(self):
        client.post("/factors/analyze", json=RICH_BODY)
        resp = client.get("/factors/report/ranking")
        assert resp.status_code == 200
        assert resp.json()["type"] == "ranking"

    def test_comparison_report_200(self):
        client.post("/factors/analyze", json=RICH_BODY)
        resp = client.get("/factors/report/comparison")
        assert resp.status_code == 200
        assert resp.json()["type"] == "comparison"

    def test_regime_report_200(self):
        client.post("/factors/analyze", json=RICH_BODY)
        resp = client.get("/factors/report/regime_adapted")
        assert resp.status_code == 200
        assert resp.json()["type"] == "regime_adapted"

    def test_invalid_report_type_400(self):
        resp = client.get("/factors/report/invalid")
        assert resp.status_code == 400

    def test_report_with_no_data(self):
        resp = client.get("/factors/report/full?symbol=NODATA")
        assert resp.status_code == 200
        data = resp.json()
        assert data["data"] == []
