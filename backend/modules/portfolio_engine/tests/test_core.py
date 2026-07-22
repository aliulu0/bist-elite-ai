from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.portfolio_engine.core.types import (
    PortfolioSize,
    InvestmentHorizon,
    RiskLevel,
    RejectionReason,
    ReportType,
    SortField,
    BenchmarkResultStatus,
    DEFAULT_PORTFOLIO_SIZE,
    DEFAULT_MAX_PER_SECTOR,
    MIN_ELITE_SCORE,
    MIN_CONFIDENCE,
    MIN_LIQUIDITY,
    MAX_RISK_FOR_INCLUSION,
    MIN_DECISION_SCORE,
    HORIZON_LOOKBACK_DAYS,
    RISK_LEVEL_THRESHOLDS,
    SECTOR_DIVERSIFICATION_PRESETS,
    _mean,
    _clamp,
    risk_score_to_level,
    compute_composite_score,
    StockCandidate,
    SelectionResult,
    PortfolioProposal,
    PortfolioQuality,
    PortfolioRequest,
    PortfolioResult,
    BenchmarkResult,
)


class TestPortfolioSizeEnum:
    def test_member_count(self):
        assert len(PortfolioSize) == 4

    def test_values(self):
        assert PortfolioSize.SMALL.value == 5
        assert PortfolioSize.MEDIUM.value == 10
        assert PortfolioSize.LARGE.value == 15
        assert PortfolioSize.XLARGE.value == 20

    def test_is_int_subclass(self):
        assert isinstance(PortfolioSize.SMALL, int)

    def test_membership(self):
        assert PortfolioSize.SMALL in PortfolioSize


class TestInvestmentHorizonEnum:
    def test_member_count(self):
        assert len(InvestmentHorizon) == 5

    def test_values(self):
        assert InvestmentHorizon.WEEKLY.value == "weekly"
        assert InvestmentHorizon.MONTH_1.value == "month_1"
        assert InvestmentHorizon.MONTH_3.value == "month_3"
        assert InvestmentHorizon.MONTH_6.value == "month_6"
        assert InvestmentHorizon.MONTH_12.value == "month_12"

    def test_is_str_subclass(self):
        assert isinstance(InvestmentHorizon.WEEKLY, str)


class TestRiskLevelEnum:
    def test_member_count(self):
        assert len(RiskLevel) == 5

    def test_values(self):
        assert RiskLevel.VERY_LOW.value == "very_low"
        assert RiskLevel.LOW.value == "low"
        assert RiskLevel.MODERATE.value == "moderate"
        assert RiskLevel.HIGH.value == "high"
        assert RiskLevel.VERY_HIGH.value == "very_high"


class TestRejectionReasonEnum:
    def test_member_count(self):
        assert len(RejectionReason) == 7

    def test_values(self):
        assert RejectionReason.LOW_ELITE_SCORE.value == "low_elite_score"
        assert RejectionReason.LOW_CONFIDENCE.value == "low_confidence"
        assert RejectionReason.LOW_LIQUIDITY.value == "low_liquidity"
        assert RejectionReason.VERY_HIGH_RISK.value == "very_high_risk"
        assert RejectionReason.LOW_DECISION_SCORE.value == "low_decision_score"
        assert RejectionReason.SECTOR_CONCENTRATION.value == "sector_concentration"
        assert RejectionReason.INSUFFICIENT_DATA.value == "insufficient_data"


class TestReportTypeEnum:
    def test_member_count(self):
        assert len(ReportType) == 6

    def test_values(self):
        assert ReportType.FULL.value == "full"
        assert ReportType.SUMMARY.value == "summary"
        assert ReportType.SELECTED_STOCKS.value == "selected_stocks"
        assert ReportType.REJECTED_STOCKS.value == "rejected_stocks"
        assert ReportType.SECTOR_DISTRIBUTION.value == "sector_distribution"
        assert ReportType.RISK_SUMMARY.value == "risk_summary"


class TestSortFieldEnum:
    def test_member_count(self):
        assert len(SortField) == 6

    def test_values(self):
        assert SortField.ELITE_SCORE.value == "elite_score"
        assert SortField.DECISION_SCORE.value == "decision_score"
        assert SortField.CONFIDENCE.value == "confidence"
        assert SortField.RISK.value == "risk"
        assert SortField.LIQUIDITY.value == "liquidity"
        assert SortField.COMPOSITE.value == "composite"


class TestBenchmarkResultStatusEnum:
    def test_member_count(self):
        assert len(BenchmarkResultStatus) == 3

    def test_values(self):
        assert BenchmarkResultStatus.SUCCESS.value == "success"
        assert BenchmarkResultStatus.ERROR.value == "error"
        assert BenchmarkResultStatus.TIMEOUT.value == "timeout"


class TestConstants:
    def test_default_portfolio_size(self):
        assert DEFAULT_PORTFOLIO_SIZE == 10

    def test_default_max_per_sector(self):
        assert DEFAULT_MAX_PER_SECTOR == 2

    def test_min_elite_score(self):
        assert MIN_ELITE_SCORE == 40.0

    def test_min_confidence(self):
        assert MIN_CONFIDENCE == 30.0

    def test_min_liquidity(self):
        assert MIN_LIQUIDITY == 20.0

    def test_max_risk_for_inclusion(self):
        assert MAX_RISK_FOR_INCLUSION == 80.0

    def test_min_decision_score(self):
        assert MIN_DECISION_SCORE == 35.0

    def test_horizon_lookback_days(self):
        assert HORIZON_LOOKBACK_DAYS[InvestmentHorizon.WEEKLY] == 5
        assert HORIZON_LOOKBACK_DAYS[InvestmentHorizon.MONTH_1] == 21
        assert HORIZON_LOOKBACK_DAYS[InvestmentHorizon.MONTH_3] == 63
        assert HORIZON_LOOKBACK_DAYS[InvestmentHorizon.MONTH_6] == 126
        assert HORIZON_LOOKBACK_DAYS[InvestmentHorizon.MONTH_12] == 252

    def test_risk_level_thresholds(self):
        assert len(RISK_LEVEL_THRESHOLDS) == 5
        assert RISK_LEVEL_THRESHOLDS[0] == (20.0, RiskLevel.VERY_LOW)
        assert RISK_LEVEL_THRESHOLDS[4] == (100.0, RiskLevel.VERY_HIGH)

    def test_sector_diversification_presets(self):
        assert SECTOR_DIVERSIFICATION_PRESETS["conservative"] == 1
        assert SECTOR_DIVERSIFICATION_PRESETS["balanced"] == 2
        assert SECTOR_DIVERSIFICATION_PRESETS["aggressive"] == 3
        assert SECTOR_DIVERSIFICATION_PRESETS["unconstrained"] == 999


class TestMeanHelper:
    def test_mean_normal(self):
        assert _mean([10.0, 20.0, 30.0]) == 20.0

    def test_mean_empty(self):
        assert _mean([]) == 0.0

    def test_mean_single(self):
        assert _mean([42.0]) == 42.0

    def test_mean_identical(self):
        assert _mean([5.0, 5.0, 5.0]) == 5.0

    def test_mean_negative(self):
        assert _mean([-10.0, 10.0]) == 0.0


class TestClampHelper:
    def test_clamp_within_range(self):
        assert _clamp(50.0) == 50.0

    def test_clamp_below_min(self):
        assert _clamp(-5.0) == 0.0

    def test_clamp_above_max(self):
        assert _clamp(150.0) == 100.0

    def test_clamp_custom_range(self):
        assert _clamp(5.0, lo=10.0, hi=20.0) == 10.0
        assert _clamp(25.0, lo=10.0, hi=20.0) == 20.0
        assert _clamp(15.0, lo=10.0, hi=20.0) == 15.0

    def test_clamp_at_boundary(self):
        assert _clamp(0.0) == 0.0
        assert _clamp(100.0) == 100.0


class TestRiskScoreToLevel:
    def test_very_low(self):
        assert risk_score_to_level(10.0) == RiskLevel.VERY_LOW

    def test_very_low_boundary(self):
        assert risk_score_to_level(20.0) == RiskLevel.VERY_LOW

    def test_low(self):
        assert risk_score_to_level(30.0) == RiskLevel.LOW

    def test_low_boundary(self):
        assert risk_score_to_level(40.0) == RiskLevel.LOW

    def test_moderate(self):
        assert risk_score_to_level(50.0) == RiskLevel.MODERATE

    def test_moderate_boundary(self):
        assert risk_score_to_level(60.0) == RiskLevel.MODERATE

    def test_high(self):
        assert risk_score_to_level(70.0) == RiskLevel.HIGH

    def test_high_boundary(self):
        assert risk_score_to_level(80.0) == RiskLevel.HIGH

    def test_very_high(self):
        assert risk_score_to_level(90.0) == RiskLevel.VERY_HIGH

    def test_very_high_at_max(self):
        assert risk_score_to_level(100.0) == RiskLevel.VERY_HIGH

    def test_zero(self):
        assert risk_score_to_level(0.0) == RiskLevel.VERY_LOW

    def test_above_max(self):
        assert risk_score_to_level(150.0) == RiskLevel.VERY_HIGH


class TestComputeCompositeScore:
    def test_perfect_scores(self):
        score = compute_composite_score(
            elite_score=100.0,
            decision_score=100.0,
            confidence=100.0,
            risk=0.0,
            liquidity=100.0,
        )
        assert score == 100.0

    def test_zero_scores(self):
        score = compute_composite_score(
            elite_score=0.0,
            decision_score=0.0,
            confidence=0.0,
            risk=100.0,
            liquidity=0.0,
        )
        assert score == 0.0

    def test_known_calculation(self):
        score = compute_composite_score(
            elite_score=80.0,
            decision_score=60.0,
            confidence=40.0,
            risk=50.0,
            liquidity=70.0,
        )
        expected = 80.0 * 0.30 + 60.0 * 0.25 + 40.0 * 0.20 + (100.0 - 50.0) * 0.15 + 70.0 * 0.10
        assert score == pytest.approx(expected)

    def test_clamping_above_100(self):
        score = compute_composite_score(
            elite_score=100.0,
            decision_score=100.0,
            confidence=100.0,
            risk=0.0,
            liquidity=100.0,
        )
        assert score <= 100.0

    def test_clamping_below_0(self):
        score = compute_composite_score(
            elite_score=0.0,
            decision_score=0.0,
            confidence=0.0,
            risk=100.0,
            liquidity=0.0,
        )
        assert score >= 0.0


class TestStockCandidateDataclass:
    def test_defaults(self):
        c = StockCandidate(symbol="TEST")
        assert c.symbol == "TEST"
        assert c.sector == ""
        assert c.elite_score == 0.0
        assert c.composite_score == 0.0
        assert c.rank == 0
        assert c.metadata == {}

    def test_full_construction(self):
        c = StockCandidate(
            symbol="THYAO",
            sector="aviation",
            elite_score=85.0,
            decision_score=80.0,
            confidence=75.0,
            risk=30.0,
            liquidity=70.0,
            composite_score=72.0,
            rank=1,
            metadata={"key": "value"},
        )
        assert c.symbol == "THYAO"
        assert c.sector == "aviation"
        assert c.rank == 1
        assert c.metadata == {"key": "value"}


class TestSelectionResultDataclass:
    def test_defaults(self):
        sr = SelectionResult(symbol="TEST")
        assert sr.symbol == "TEST"
        assert sr.selected is True
        assert sr.reason == ""
        assert sr.rejection_reason is None

    def test_rejection(self):
        sr = SelectionResult(
            symbol="TEST",
            selected=False,
            reason="low_elite_score",
            rejection_reason=RejectionReason.LOW_ELITE_SCORE,
        )
        assert sr.selected is False
        assert sr.rejection_reason == RejectionReason.LOW_ELITE_SCORE


class TestPortfolioProposalDataclass:
    def test_defaults(self):
        p = PortfolioProposal()
        assert p.portfolio_id == ""
        assert p.horizon == InvestmentHorizon.MONTH_3
        assert p.size == DEFAULT_PORTFOLIO_SIZE
        assert p.selected == []
        assert p.rejected == []

    def test_with_data(self):
        p = PortfolioProposal(
            portfolio_id="pf-123",
            size=5,
            selected=[StockCandidate(symbol="X")],
        )
        assert len(p.selected) == 1


class TestPortfolioQualityDataclass:
    def test_defaults(self):
        q = PortfolioQuality()
        assert q.avg_elite_score == 0.0
        assert q.diversification_score == 0.0
        assert q.sector_distribution == {}

    def test_with_values(self):
        q = PortfolioQuality(
            avg_elite_score=75.0,
            avg_confidence=60.0,
            avg_risk=40.0,
            diversification_score=85.0,
        )
        assert q.avg_elite_score == 75.0
        assert q.diversification_score == 85.0


class TestPortfolioRequestDataclass:
    def test_defaults(self):
        r = PortfolioRequest()
        assert r.horizon == InvestmentHorizon.MONTH_3
        assert r.portfolio_size == DEFAULT_PORTFOLIO_SIZE
        assert r.max_per_sector == DEFAULT_MAX_PER_SECTOR
        assert r.sort_by == SortField.COMPOSITE
        assert r.candidates == []

    def test_custom_values(self):
        r = PortfolioRequest(
            reference_date="2026-01-01",
            horizon=InvestmentHorizon.MONTH_12,
            portfolio_size=5,
            sort_by=SortField.ELITE_SCORE,
        )
        assert r.reference_date == "2026-01-01"
        assert r.horizon == InvestmentHorizon.MONTH_12
        assert r.portfolio_size == 5


class TestPortfolioResultDataclass:
    def test_construction(self):
        req = PortfolioRequest(reference_date="2026-01-01")
        proposal = PortfolioProposal(portfolio_id="pf-test")
        result = PortfolioResult(request=req, proposal=proposal, execution_time_ms=123.45)
        assert result.request == req
        assert result.proposal == proposal
        assert result.execution_time_ms == 123.45
        assert result.metadata == {}


class TestBenchmarkResultDataclass:
    def test_defaults(self):
        b = BenchmarkResult(name="test")
        assert b.name == "test"
        assert b.status == BenchmarkResultStatus.SUCCESS
        assert b.execution_time_ms == 0.0
        assert b.result is None
        assert b.error is None

    def test_error_result(self):
        b = BenchmarkResult(
            name="bench1",
            status=BenchmarkResultStatus.ERROR,
            error="timeout occurred",
        )
        assert b.status == BenchmarkResultStatus.ERROR
        assert b.error == "timeout occurred"
