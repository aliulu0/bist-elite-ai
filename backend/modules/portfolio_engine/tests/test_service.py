from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.portfolio_engine.cache.cache import reset_portfolio_cache
from modules.portfolio_engine.core.types import (
    PortfolioRequest,
    PortfolioResult,
    StockCandidate,
    ReportType,
    InvestmentHorizon,
    SortField,
)


def _make_candidates():
    return [
        StockCandidate(symbol="THYAO", sector="aviation", elite_score=85, decision_score=80, confidence=75, risk=30, liquidity=70),
        StockCandidate(symbol="GARAN", sector="banking", elite_score=78, decision_score=72, confidence=68, risk=40, liquidity=65),
        StockCandidate(symbol="ASELS", sector="defense", elite_score=72, decision_score=68, confidence=62, risk=35, liquidity=55),
        StockCandidate(symbol="SISE", sector="glass", elite_score=68, decision_score=65, confidence=58, risk=45, liquidity=50),
        StockCandidate(symbol="EREGL", sector="steel", elite_score=65, decision_score=62, confidence=55, risk=50, liquidity=48),
        StockCandidate(symbol="KCHOL", sector="auto", elite_score=62, decision_score=58, confidence=52, risk=55, liquidity=45),
        StockCandidate(symbol="BIMAS", sector="retail", elite_score=58, decision_score=55, confidence=48, risk=42, liquidity=60),
        StockCandidate(symbol="AKBNK", sector="banking", elite_score=55, decision_score=52, confidence=45, risk=48, liquidity=58),
        StockCandidate(symbol="TUPRS", sector="energy", elite_score=50, decision_score=48, confidence=40, risk=60, liquidity=42),
        StockCandidate(symbol="SAHOL", sector="banking", elite_score=35, decision_score=30, confidence=25, risk=70, liquidity=30),
        StockCandidate(symbol="KRDMD", sector="steel", elite_score=28, decision_score=25, confidence=20, risk=75, liquidity=25),
        StockCandidate(symbol="VESTL", sector="electronics", elite_score=20, decision_score=18, confidence=15, risk=85, liquidity=20),
    ]


@pytest.fixture(autouse=True)
def _reset():
    reset_portfolio_cache()
    yield
    reset_portfolio_cache()


@pytest.fixture
def service():
    from modules.portfolio_engine.services.service import PortfolioService
    return PortfolioService()


@pytest.fixture
def valid_request():
    return PortfolioRequest(
        reference_date="2026-01-15",
        horizon=InvestmentHorizon.MONTH_3,
        portfolio_size=10,
        max_per_sector=2,
        candidates=_make_candidates(),
    )


class TestServiceConstruction:
    def test_has_ranker(self, service):
        assert service._ranker is not None

    def test_has_selector(self, service):
        assert service._selector is not None

    def test_has_diversifier(self, service):
        assert service._diversifier is not None

    def test_has_report_generator(self, service):
        assert service._report_generator is not None

    def test_has_cache(self, service):
        assert service._cache is not None

    def test_current_none_initially(self, service):
        assert service.get_current() is None

    def test_history_empty_initially(self, service):
        assert service.get_history() == []


class TestGenerateValid:
    def test_returns_result(self, service, valid_request):
        result = service.generate(valid_request)
        assert isinstance(result, PortfolioResult)

    def test_proposal_has_id(self, service, valid_request):
        result = service.generate(valid_request)
        assert result.proposal.portfolio_id.startswith("pf-")

    def test_selected_not_empty(self, service, valid_request):
        result = service.generate(valid_request)
        assert len(result.proposal.selected) > 0

    def test_execution_time_positive(self, service, valid_request):
        result = service.generate(valid_request)
        assert result.execution_time_ms >= 0

    def test_reference_date_set(self, service, valid_request):
        result = service.generate(valid_request)
        assert result.proposal.reference_date == "2026-01-15"

    def test_quality_metrics_present(self, service, valid_request):
        result = service.generate(valid_request)
        assert result.proposal.quality_metrics is not None

    def test_quality_has_sector_distribution(self, service, valid_request):
        result = service.generate(valid_request)
        qm = result.proposal.quality_metrics
        assert len(qm.sector_distribution) > 0

    def test_history_recorded(self, service, valid_request):
        service.generate(valid_request)
        history = service.get_history()
        assert len(history) == 1
        assert "portfolio_id" in history[0]


class TestGenerateEmpty:
    def test_empty_candidates_raises(self, service):
        request = PortfolioRequest(
            reference_date="2026-01-15",
            candidates=[],
        )
        with pytest.raises(ValueError, match="Candidates list is empty"):
            service.generate(request)


class TestGenerateCacheHit:
    def test_second_call_returns_cached(self, service, valid_request):
        r1 = service.generate(valid_request)
        r2 = service.generate(valid_request)
        assert r1.proposal.portfolio_id == r2.proposal.portfolio_id

    def test_different_params_not_cached(self, service):
        r1 = service.generate(PortfolioRequest(
            reference_date="2026-01-01",
            portfolio_size=5,
            candidates=_make_candidates()[:5],
        ))
        r2 = service.generate(PortfolioRequest(
            reference_date="2026-02-01",
            portfolio_size=10,
            candidates=_make_candidates(),
        ))
        assert r1.proposal.portfolio_id != r2.proposal.portfolio_id


class TestGetCurrent:
    def test_none_before_generate(self, service):
        assert service.get_current() is None

    def test_set_after_generate(self, service, valid_request):
        service.generate(valid_request)
        current = service.get_current()
        assert current is not None
        assert isinstance(current, PortfolioResult)


class TestGetHistory:
    def test_empty_initially(self, service):
        assert service.get_history() == []

    def test_accumulates(self, service):
        service.generate(PortfolioRequest(
            reference_date="2026-01-01",
            candidates=_make_candidates()[:5],
            portfolio_size=5,
        ))
        service.generate(PortfolioRequest(
            reference_date="2026-02-01",
            candidates=_make_candidates()[:5],
            portfolio_size=5,
        ))
        assert len(service.get_history()) == 2

    def test_history_entries_have_expected_keys(self, service, valid_request):
        service.generate(valid_request)
        entry = service.get_history()[0]
        assert "portfolio_id" in entry
        assert "reference_date" in entry
        assert "horizon" in entry
        assert "selected_count" in entry
        assert "rejected_count" in entry
        assert "execution_time_ms" in entry


class TestGenerateReport:
    def _make_result(self, service):
        request = PortfolioRequest(
            reference_date="2026-01-15",
            candidates=_make_candidates(),
            portfolio_size=10,
        )
        return service.generate(request)

    def test_full_report(self, service):
        result = self._make_result(service)
        report = service.generate_report(ReportType.FULL, result)
        assert report["report_type"] == "full"
        assert "selected_stocks" in report
        assert "rejected_stocks" in report
        assert "quality" in report

    def test_summary_report(self, service):
        result = self._make_result(service)
        report = service.generate_report(ReportType.SUMMARY, result)
        assert report["report_type"] == "summary"
        assert "avg_composite_score" in report

    def test_selected_stocks_report(self, service):
        result = self._make_result(service)
        report = service.generate_report(ReportType.SELECTED_STOCKS, result)
        assert report["report_type"] == "selected_stocks"
        assert "stocks" in report
        assert report["count"] > 0

    def test_rejected_stocks_report(self, service):
        result = self._make_result(service)
        report = service.generate_report(ReportType.REJECTED_STOCKS, result)
        assert report["report_type"] == "rejected_stocks"
        assert "stocks" in report

    def test_sector_distribution_report(self, service):
        result = self._make_result(service)
        report = service.generate_report(ReportType.SECTOR_DISTRIBUTION, result)
        assert report["report_type"] == "sector_distribution"
        assert "sectors" in report

    def test_risk_summary_report(self, service):
        result = self._make_result(service)
        report = service.generate_report(ReportType.RISK_SUMMARY, result)
        assert report["report_type"] == "risk_summary"
        assert "avg_risk" in report
        assert "risk_distribution" in report

    def test_report_without_explicit_result(self, service, valid_request):
        service.generate(valid_request)
        report = service.generate_report(ReportType.SUMMARY)
        assert "report_type" in report

    def test_report_no_current(self, service):
        report = service.generate_report(ReportType.FULL)
        assert "error" in report


class TestClearCache:
    def test_clear_returns_count(self, service, valid_request):
        service.generate(valid_request)
        count = service.clear_cache()
        assert count >= 1

    def test_clear_prevents_cache_hit(self, service, valid_request):
        r1 = service.generate(valid_request)
        service.clear_cache()
        r2 = service.generate(valid_request)
        assert r1.proposal.portfolio_id != r2.proposal.portfolio_id


class TestGetCacheStats:
    def test_stats_structure(self, service):
        stats = service.get_cache_stats()
        assert "size" in stats
        assert "max_size" in stats
        assert "hits" in stats
        assert "misses" in stats
        assert "hit_rate" in stats
        assert "ttl_seconds" in stats

    def test_stats_after_generate(self, service, valid_request):
        service.generate(valid_request)
        stats = service.get_cache_stats()
        assert stats["size"] >= 1
