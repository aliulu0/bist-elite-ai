from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.position_sizing_engine.core.types import (
    InvestmentHorizon,
    PositionInput,
    PositionSizingRequest,
    ReportType,
    RiskProfile,
)
from modules.position_sizing_engine.services.service import PositionSizingService
from modules.position_sizing_engine.cache.cache import reset_position_sizing_cache


def _make_positions():
    return [
        PositionInput(symbol="THYAO", sector="aviation", elite_score=85, confidence=75, risk=30, liquidity=70, avg_daily_volume=1000000, atr=2.5, volatility=25, beta=1.1, market_regime="bull", sector_exposure=15, correlation=0.3, agreement_score=0.8, price=100),
        PositionInput(symbol="GARAN", sector="banking", elite_score=78, confidence=68, risk=40, liquidity=65, avg_daily_volume=800000, atr=3.0, volatility=30, beta=1.2, market_regime="bull", sector_exposure=20, correlation=0.4, agreement_score=0.7, price=50),
        PositionInput(symbol="ASELS", sector="defense", elite_score=72, confidence=62, risk=35, liquidity=55, avg_daily_volume=500000, atr=2.0, volatility=22, beta=0.9, market_regime="sideways", sector_exposure=10, correlation=0.2, agreement_score=0.6, price=80),
        PositionInput(symbol="SISE", sector="glass", elite_score=68, confidence=58, risk=45, liquidity=50, avg_daily_volume=300000, atr=3.5, volatility=35, beta=1.3, market_regime="bull", sector_exposure=12, correlation=0.5, agreement_score=0.5, price=40),
        PositionInput(symbol="SAHOL", sector="banking", elite_score=35, confidence=25, risk=70, liquidity=30, avg_daily_volume=200000, atr=4.0, volatility=40, beta=1.5, market_regime="bear", sector_exposure=25, correlation=0.6, agreement_score=0.3, price=20),
    ]


def _make_request(positions=None):
    return PositionSizingRequest(
        reference_date="2025-01-01",
        horizon=InvestmentHorizon.MONTH_3,
        risk_profile=RiskProfile.BALANCED,
        total_capital=100000.0,
        positions=positions if positions is not None else _make_positions(),
        max_sector_exposure=30.0,
        max_correlation=0.7,
    )


@pytest.fixture(autouse=True)
def reset_service():
    reset_position_sizing_cache()
    yield
    reset_position_sizing_cache()


@pytest.fixture
def svc():
    return PositionSizingService()


class TestCalculate:
    def test_valid_request_success(self, svc: PositionSizingService):
        result = svc.calculate(_make_request())
        assert result is not None
        assert len(result.positions) == 5
        assert result.execution_time_ms >= 0

    def test_empty_positions_raises(self, svc: PositionSizingService):
        with pytest.raises(ValueError, match="Positions list must not be empty"):
            svc.calculate(_make_request(positions=[]))

    def test_cache_hit(self, svc: PositionSizingService):
        req = _make_request()
        result1 = svc.calculate(req)
        result2 = svc.calculate(req)
        assert result1.positions[0].symbol == result2.positions[0].symbol

    def test_result_has_request(self, svc: PositionSizingService):
        result = svc.calculate(_make_request())
        assert result.request is not None
        assert result.request.reference_date == "2025-01-01"

    def test_result_has_exposure(self, svc: PositionSizingService):
        result = svc.calculate(_make_request())
        assert result.exposure is not None
        assert result.exposure.sector_count > 0

    def test_result_positions_have_grades(self, svc: PositionSizingService):
        result = svc.calculate(_make_request())
        for pos in result.positions:
            assert pos.position_grade is not None

    def test_result_positions_have_stop_loss(self, svc: PositionSizingService):
        result = svc.calculate(_make_request())
        for pos in result.positions:
            assert pos.stop_loss is not None

    def test_result_positions_have_take_profit(self, svc: PositionSizingService):
        result = svc.calculate(_make_request())
        for pos in result.positions:
            assert pos.take_profit is not None

    def test_zero_capital_raises(self, svc: PositionSizingService):
        req = _make_request()
        req.total_capital = 0.0
        with pytest.raises(ValueError):
            svc.calculate(req)

    def test_custom_profile(self, svc: PositionSizingService):
        req = _make_request()
        req.risk_profile = RiskProfile.AGGRESSIVE
        result = svc.calculate(req)
        assert result is not None
        assert result.metadata["profile"] == "aggressive"


class TestGetCurrent:
    def test_none_before_calculation(self, svc: PositionSizingService):
        assert svc.get_current() is None

    def test_returns_result_after_calculation(self, svc: PositionSizingService):
        svc.calculate(_make_request())
        current = svc.get_current()
        assert current is not None
        assert len(current.positions) == 5


class TestGetHistory:
    def test_empty_initially(self, svc: PositionSizingService):
        assert svc.get_history() == []

    def test_populated_after_calculations(self, svc: PositionSizingService):
        svc.calculate(_make_request())
        history = svc.get_history()
        assert len(history) == 1
        assert history[0]["reference_date"] == "2025-01-01"

    def test_multiple_calculations(self, svc: PositionSizingService):
        svc.calculate(_make_request())
        req2 = _make_request()
        req2.reference_date = "2025-02-01"
        svc.calculate(req2)
        history = svc.get_history()
        assert len(history) == 2

    def test_returns_copy(self, svc: PositionSizingService):
        svc.calculate(_make_request())
        history = svc.get_history()
        history.clear()
        assert len(svc.get_history()) == 1


class TestGenerateReport:
    def _setup(self, svc: PositionSizingService):
        svc.calculate(_make_request())

    def test_full_report(self, svc: PositionSizingService):
        self._setup(svc)
        report = svc.generate_report(ReportType.FULL)
        assert report["report_type"] == "full"
        assert "summary" in report
        assert "allocation" in report

    def test_summary_report(self, svc: PositionSizingService):
        self._setup(svc)
        report = svc.generate_report(ReportType.SUMMARY)
        assert report["report_type"] == "summary"
        assert "total_positions" in report

    def test_allocation_report(self, svc: PositionSizingService):
        self._setup(svc)
        report = svc.generate_report(ReportType.ALLOCATION)
        assert report["report_type"] == "allocation"
        assert "positions" in report

    def test_risk_report(self, svc: PositionSizingService):
        self._setup(svc)
        report = svc.generate_report(ReportType.RISK)
        assert report["report_type"] == "risk"

    def test_exposure_report(self, svc: PositionSizingService):
        self._setup(svc)
        report = svc.generate_report(ReportType.EXPOSURE)
        assert report["report_type"] == "exposure"
        assert "sector_exposure" in report

    def test_explainability_report(self, svc: PositionSizingService):
        self._setup(svc)
        report = svc.generate_report(ReportType.EXPLAINABILITY)
        assert report["report_type"] == "explainability"
        assert "positions" in report

    def test_no_result_returns_error(self, svc: PositionSizingService):
        report = svc.generate_report(ReportType.FULL)
        assert "error" in report

    def test_with_explicit_result(self, svc: PositionSizingService):
        result = svc.calculate(_make_request())
        report = svc.generate_report(ReportType.SUMMARY, result=result)
        assert report["report_type"] == "summary"


class TestGetExposure:
    def test_none_before_calculation(self, svc: PositionSizingService):
        assert svc.get_exposure() is None

    def test_returns_exposure_after_calculation(self, svc: PositionSizingService):
        svc.calculate(_make_request())
        exposure = svc.get_exposure()
        assert exposure is not None
        assert isinstance(exposure.sector_exposure, dict)


class TestCache:
    def test_clear_cache(self, svc: PositionSizingService):
        svc.calculate(_make_request())
        cleared = svc.clear_cache()
        assert cleared >= 1

    def test_get_cache_stats(self, svc: PositionSizingService):
        stats = svc.get_cache_stats()
        assert "size" in stats
        assert "hits" in stats
        assert "misses" in stats
        assert "hit_rate" in stats

    def test_cache_stats_after_hit(self, svc: PositionSizingService):
        req = _make_request()
        svc.calculate(req)
        svc.calculate(req)
        stats = svc.get_cache_stats()
        assert stats["hits"] >= 1
