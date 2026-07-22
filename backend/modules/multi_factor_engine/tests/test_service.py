from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.multi_factor_engine.core.types import (
    FactorAnalysisRequest,
    FactorGroup,
    FactorName,
    InvestmentHorizon,
    MarketRegime,
    ReportType,
)
from modules.multi_factor_engine.services.service import MultiFactorService


RICH_MARKET = {
    "price": 105.0,
    "bid_ask_spread": 0.005,
    "depth_of_market": 1.5,
}
RICH_FINANCIAL = {
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
}
RICH_INDICATOR = {
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
}
RICH_SECTOR = {"sector_pe": 15.0}


def _make_request(**overrides):
    defaults = dict(
        symbol="AAPL",
        reference_date="2024-01-15",
        market_data=RICH_MARKET,
        financial_data=RICH_FINANCIAL,
        indicator_data=RICH_INDICATOR,
        sector_data=RICH_SECTOR,
    )
    defaults.update(overrides)
    return FactorAnalysisRequest(**defaults)


class TestServiceConstruction:
    def test_create(self):
        svc = MultiFactorService()
        assert svc is not None

    def test_components_initialized(self):
        svc = MultiFactorService()
        assert svc._calculators is not None
        assert len(svc._calculators) == 12
        assert svc._ranker is not None
        assert svc._cache is not None


class TestServiceAnalyze:
    def test_analyze_rich_data_success(self):
        svc = MultiFactorService()
        req = _make_request()
        result = svc.analyze(req)
        assert result.profile is not None
        assert result.ranking is not None
        assert result.execution_time_ms >= 0
        assert result.profile.symbol == "AAPL"

    def test_analyze_profile_has_groups(self):
        svc = MultiFactorService()
        result = svc.analyze(_make_request())
        assert len(result.profile.group_scores) > 0

    def test_analyze_profile_has_factors(self):
        svc = MultiFactorService()
        result = svc.analyze(_make_request())
        assert len(result.profile.factor_scores) > 0

    def test_analyze_overall_score_in_range(self):
        svc = MultiFactorService()
        result = svc.analyze(_make_request())
        assert 0.0 <= result.profile.overall_score <= 100.0

    def test_analyze_empty_data_raises(self):
        svc = MultiFactorService()
        req = FactorAnalysisRequest(
            symbol="",
            reference_date="",
            market_data={},
            financial_data={},
            indicator_data={},
        )
        with pytest.raises(ValueError, match="Validation failed"):
            svc.analyze(req)

    def test_analyze_cache_hit(self):
        svc = MultiFactorService()
        req = _make_request()
        r1 = svc.analyze(req)
        r2 = svc.analyze(req)
        assert r1 is r2

    def test_analyze_different_requests_different_results(self):
        svc = MultiFactorService()
        r1 = svc.analyze(_make_request(symbol="AAPL"))
        r2 = svc.analyze(_make_request(symbol="GOOG"))
        assert r1 is not r2
        assert r1.profile.symbol == "AAPL"
        assert r2.profile.symbol == "GOOG"

    def test_analyze_no_profile(self):
        svc = MultiFactorService()
        req = _make_request(include_profile=False)
        result = svc.analyze(req)
        assert result.profile is None

    def test_analyze_no_ranking(self):
        svc = MultiFactorService()
        req = _make_request(include_ranking=False)
        result = svc.analyze(req)
        assert result.ranking is None

    def test_analyze_with_regime(self):
        svc = MultiFactorService()
        req = _make_request(regime=MarketRegime.BULL)
        result = svc.analyze(req)
        assert result.profile.regime == MarketRegime.BULL

    def test_analyze_with_horizon(self):
        svc = MultiFactorService()
        req = _make_request(horizon=InvestmentHorizon.MONTH_12)
        result = svc.analyze(req)
        assert result.profile.horizon == InvestmentHorizon.MONTH_12


class TestServiceGetFactorList:
    def test_get_factor_list_structure(self):
        svc = MultiFactorService()
        data = svc.get_factor_list()
        assert "groups" in data
        assert "factors" in data
        assert "total_groups" in data
        assert "total_factors" in data
        assert "group_details" in data

    def test_get_factor_list_counts(self):
        svc = MultiFactorService()
        data = svc.get_factor_list()
        assert data["total_groups"] == 12
        assert data["total_factors"] == 51

    def test_get_factor_list_group_details(self):
        svc = MultiFactorService()
        data = svc.get_factor_list()
        assert "value" in data["group_details"]
        assert "price_to_dividends" in data["group_details"]["value"]


class TestServiceGetFactorDetails:
    def test_valid_group(self):
        svc = MultiFactorService()
        data = svc.get_factor_details("value")
        assert data["group"] == "value"
        assert len(data["factors"]) == 6
        assert data["total_factors"] == 6

    def test_invalid_group_raises(self):
        svc = MultiFactorService()
        with pytest.raises(ValueError, match="Invalid factor group"):
            svc.get_factor_details("nonexistent")

    def test_growth_group(self):
        svc = MultiFactorService()
        data = svc.get_factor_details("growth")
        assert data["total_factors"] == 5


class TestServiceGetHistory:
    def test_empty_history(self):
        svc = MultiFactorService()
        history = svc.get_history("AAPL")
        assert history == []

    def test_history_populated_after_analyze(self):
        svc = MultiFactorService()
        req = _make_request()
        svc.analyze(req)
        history = svc.get_history("AAPL")
        assert len(history) == 1
        assert history[0]["date"] == "2024-01-15"

    def test_history_multiple_analyses(self):
        svc = MultiFactorService()
        svc.analyze(_make_request(reference_date="2024-01-01"))
        svc.analyze(_make_request(reference_date="2024-02-01"))
        history = svc.get_history("AAPL")
        assert len(history) == 2


class TestServiceGenerateReport:
    def setup_method(self):
        self.svc = MultiFactorService()
        self.svc.analyze(_make_request())

    def test_full_report(self):
        report = self.svc.generate_report(ReportType.FULL, "AAPL")
        assert report["type"] == "full"
        assert report["symbol"] == "AAPL"
        assert "profile" in report

    def test_summary_report(self):
        report = self.svc.generate_report(ReportType.SUMMARY, "AAPL")
        assert report["type"] == "summary"
        assert "overall_score" in report

    def test_breakdown_report(self):
        report = self.svc.generate_report(ReportType.FACTOR_BREAKDOWN, "AAPL")
        assert report["type"] == "factor_breakdown"
        assert "breakdown" in report

    def test_ranking_report(self):
        report = self.svc.generate_report(ReportType.RANKING)
        assert report["type"] == "ranking"
        assert "rankings" in report

    def test_comparison_report(self):
        report = self.svc.generate_report(ReportType.COMPARISON)
        assert report["type"] == "comparison"
        assert "symbols" in report

    def test_regime_report(self):
        report = self.svc.generate_report(ReportType.REGIME_ADAPTED)
        assert report["type"] == "regime_adapted"
        assert "regime_averages" in report

    def test_full_report_no_data(self):
        svc = MultiFactorService()
        report = svc.generate_report(ReportType.FULL, "NODATA")
        assert report["data"] == []


class TestServiceCache:
    def test_clear_cache(self):
        svc = MultiFactorService()
        svc.analyze(_make_request())
        svc.clear_cache()
        stats = svc.get_cache_stats()
        assert stats["size"] == 0

    def test_get_cache_stats(self):
        svc = MultiFactorService()
        stats = svc.get_cache_stats()
        assert "size" in stats
        assert "hits" in stats
        assert "misses" in stats

    def test_cache_stats_after_analyze(self):
        svc = MultiFactorService()
        svc.analyze(_make_request())
        stats = svc.get_cache_stats()
        assert stats["size"] == 1

    def test_benchmark_results(self):
        svc = MultiFactorService()
        results = svc.get_benchmark_results()
        assert "count" in results
