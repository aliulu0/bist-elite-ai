from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.position_sizing_engine.core.types import (
    BenchmarkResult,
    BenchmarkResultStatus,
    DEFAULT_ATR_STOP_MULTIPLIER,
    DEFAULT_CASH_RESERVE,
    DEFAULT_MAX_CORRELATION,
    DEFAULT_MAX_POSITION_PCT,
    DEFAULT_MAX_SECTOR_EXPOSURE,
    DEFAULT_MIN_POSITION_PCT,
    DEFAULT_VOLATILITY_STOP_MULTIPLIER,
    InvestmentHorizon,
    PortfolioExposure,
    PositionGrade,
    PositionInput,
    PositionSizing,
    PositionSizingRequest,
    PositionSizingResult,
    ReportType,
    RiskProfile,
    RISK_PROFILE_PRESETS,
    StopLoss,
    StopLossType,
    TakeProfit,
    _clamp,
    _mean,
    compute_position_grade,
    grade_to_value,
    value_to_grade,
)


class TestInvestmentHorizonEnum:
    def test_has_expected_members(self):
        members = [e.value for e in InvestmentHorizon]
        assert "hours_4" in members
        assert "day_1" in members
        assert "week_1" in members
        assert "month_1" in members
        assert "month_3" in members
        assert "month_6" in members
        assert "month_12" in members

    def test_member_count(self):
        assert len(InvestmentHorizon) == 7

    def test_construction_from_value(self):
        assert InvestmentHorizon("month_3") == InvestmentHorizon.MONTH_3


class TestRiskProfileEnum:
    def test_has_expected_members(self):
        assert RiskProfile.CONSERVATIVE.value == "conservative"
        assert RiskProfile.BALANCED.value == "balanced"
        assert RiskProfile.AGGRESSIVE.value == "aggressive"
        assert RiskProfile.CUSTOM.value == "custom"

    def test_member_count(self):
        assert len(RiskProfile) == 4


class TestPositionGradeEnum:
    def test_has_expected_members(self):
        assert PositionGrade.A_PLUS.value == "A+"
        assert PositionGrade.A.value == "A"
        assert PositionGrade.B.value == "B"
        assert PositionGrade.C.value == "C"
        assert PositionGrade.D.value == "D"

    def test_member_count(self):
        assert len(PositionGrade) == 5


class TestStopLossTypeEnum:
    def test_has_expected_members(self):
        assert StopLossType.SUGGESTED.value == "suggested"
        assert StopLossType.ATR_BASED.value == "atr_based"
        assert StopLossType.VOLATILITY.value == "volatility"
        assert StopLossType.TRAILING.value == "trailing"

    def test_member_count(self):
        assert len(StopLossType) == 4


class TestReportTypeEnum:
    def test_has_expected_members(self):
        assert ReportType.FULL.value == "full"
        assert ReportType.SUMMARY.value == "summary"
        assert ReportType.ALLOCATION.value == "allocation"
        assert ReportType.RISK.value == "risk"
        assert ReportType.EXPOSURE.value == "exposure"
        assert ReportType.EXPLAINABILITY.value == "explainability"

    def test_member_count(self):
        assert len(ReportType) == 6


class TestBenchmarkResultStatusEnum:
    def test_has_expected_members(self):
        assert BenchmarkResultStatus.SUCCESS.value == "success"
        assert BenchmarkResultStatus.ERROR.value == "error"
        assert BenchmarkResultStatus.TIMEOUT.value == "timeout"

    def test_member_count(self):
        assert len(BenchmarkResultStatus) == 3


class TestConstants:
    def test_default_max_position_pct(self):
        assert DEFAULT_MAX_POSITION_PCT == 15.0

    def test_default_min_position_pct(self):
        assert DEFAULT_MIN_POSITION_PCT == 1.0

    def test_default_max_sector_exposure(self):
        assert DEFAULT_MAX_SECTOR_EXPOSURE == 30.0

    def test_default_cash_reserve(self):
        assert DEFAULT_CASH_RESERVE == 10.0

    def test_default_max_correlation(self):
        assert DEFAULT_MAX_CORRELATION == 0.7

    def test_default_atr_stop_multiplier(self):
        assert DEFAULT_ATR_STOP_MULTIPLIER == 2.0

    def test_default_volatility_stop_multiplier(self):
        assert DEFAULT_VOLATILITY_STOP_MULTIPLIER == 2.5


class TestDataclasses:
    def test_position_input_defaults(self):
        p = PositionInput(symbol="TEST")
        assert p.symbol == "TEST"
        assert p.sector == ""
        assert p.elite_score == 0.0
        assert p.risk == 50.0
        assert p.beta == 1.0
        assert p.market_regime == "sideways"
        assert p.metadata == {}

    def test_position_input_custom(self):
        p = PositionInput(symbol="X", sector="tech", elite_score=90, risk=10, price=50.0)
        assert p.sector == "tech"
        assert p.elite_score == 90
        assert p.price == 50.0

    def test_stop_loss_defaults(self):
        sl = StopLoss(symbol="TEST")
        assert sl.stop_loss_price == 0.0
        assert sl.stop_loss_type == StopLossType.SUGGESTED
        assert sl.atr_multiplier == DEFAULT_ATR_STOP_MULTIPLIER

    def test_take_profit_defaults(self):
        tp = TakeProfit(symbol="TEST")
        assert tp.primary_target == 0.0
        assert tp.risk_reward_ratio == 2.0

    def test_position_sizing_defaults(self):
        ps = PositionSizing(symbol="TEST")
        assert ps.recommended_pct == 0.0
        assert ps.position_grade == PositionGrade.C
        assert ps.stop_loss is None
        assert ps.take_profit is None

    def test_portfolio_exposure_defaults(self):
        pe = PortfolioExposure()
        assert pe.sector_exposure == {}
        assert pe.cash_ratio == DEFAULT_CASH_RESERVE
        assert pe.sector_count == 0

    def test_position_sizing_request_defaults(self):
        req = PositionSizingRequest()
        assert req.horizon == InvestmentHorizon.MONTH_3
        assert req.risk_profile == RiskProfile.BALANCED
        assert req.total_capital == 100000.0
        assert req.positions == []

    def test_position_sizing_result_defaults(self):
        res = PositionSizingResult()
        assert res.request is None
        assert res.positions == []
        assert res.execution_time_ms == 0.0

    def test_benchmark_result_defaults(self):
        br = BenchmarkResult(name="test")
        assert br.status == BenchmarkResultStatus.SUCCESS
        assert br.execution_time_ms == 0.0
        assert br.result is None
        assert br.error is None

    def test_position_sizing_result_with_positions(self):
        pos = PositionSizing(symbol="X", recommended_pct=5.0)
        res = PositionSizingResult(positions=[pos])
        assert len(res.positions) == 1
        assert res.positions[0].symbol == "X"


class TestMeanHelper:
    def test_mean_normal(self):
        assert _mean([10, 20, 30]) == 20.0

    def test_mean_empty(self):
        assert _mean([]) == 0.0

    def test_mean_single(self):
        assert _mean([5.0]) == 5.0

    def test_mean_floats(self):
        result = _mean([1.5, 2.5, 3.5])
        assert abs(result - 2.5) < 1e-9


class TestClampHelper:
    def test_clamp_within_range(self):
        assert _clamp(50.0, 0.0, 100.0) == 50.0

    def test_clamp_below_min(self):
        assert _clamp(-5.0, 0.0, 100.0) == 0.0

    def test_clamp_above_max(self):
        assert _clamp(150.0, 0.0, 100.0) == 100.0

    def test_clamp_default_bounds(self):
        assert _clamp(-10.0) == 0.0
        assert _clamp(200.0) == 100.0

    def test_clamp_at_boundary(self):
        assert _clamp(0.0, 0.0, 100.0) == 0.0
        assert _clamp(100.0, 0.0, 100.0) == 100.0


class TestGradeConversion:
    def test_grade_to_value_all(self):
        assert grade_to_value(PositionGrade.A_PLUS) == 5
        assert grade_to_value(PositionGrade.A) == 4
        assert grade_to_value(PositionGrade.B) == 3
        assert grade_to_value(PositionGrade.C) == 2
        assert grade_to_value(PositionGrade.D) == 1

    def test_value_to_grade_all(self):
        assert value_to_grade(5) == PositionGrade.A_PLUS
        assert value_to_grade(4) == PositionGrade.A
        assert value_to_grade(3) == PositionGrade.B
        assert value_to_grade(2) == PositionGrade.C
        assert value_to_grade(1) == PositionGrade.D

    def test_value_to_grade_above_5(self):
        assert value_to_grade(10) == PositionGrade.A_PLUS

    def test_value_to_grade_zero(self):
        assert value_to_grade(0) == PositionGrade.D

    def test_roundtrip(self):
        for grade in PositionGrade:
            val = grade_to_value(grade)
            assert value_to_grade(val) == grade


class TestComputePositionGrade:
    def test_a_plus_boundary(self):
        assert compute_position_grade(85) == PositionGrade.A_PLUS

    def test_a_plus_high(self):
        assert compute_position_grade(95) == PositionGrade.A_PLUS

    def test_a_boundary(self):
        assert compute_position_grade(70) == PositionGrade.A

    def test_a_high(self):
        assert compute_position_grade(84) == PositionGrade.A

    def test_b_boundary(self):
        assert compute_position_grade(50) == PositionGrade.B

    def test_b_high(self):
        assert compute_position_grade(69) == PositionGrade.B

    def test_c_boundary(self):
        assert compute_position_grade(30) == PositionGrade.C

    def test_c_high(self):
        assert compute_position_grade(49) == PositionGrade.C

    def test_d_low(self):
        assert compute_position_grade(29) == PositionGrade.D

    def test_d_zero(self):
        assert compute_position_grade(0) == PositionGrade.D


class TestRiskProfilePresets:
    def test_has_all_four_profiles(self):
        assert len(RISK_PROFILE_PRESETS) == 4

    def test_has_conservative(self):
        assert RiskProfile.CONSERVATIVE in RISK_PROFILE_PRESETS

    def test_has_balanced(self):
        assert RiskProfile.BALANCED in RISK_PROFILE_PRESETS

    def test_has_aggressive(self):
        assert RiskProfile.AGGRESSIVE in RISK_PROFILE_PRESETS

    def test_has_custom(self):
        assert RiskProfile.CUSTOM in RISK_PROFILE_PRESETS

    def test_conservative_values(self):
        params = RISK_PROFILE_PRESETS[RiskProfile.CONSERVATIVE]
        assert params["max_position"] == 8.0
        assert params["cash_reserve"] == 15.0

    def test_balanced_values(self):
        params = RISK_PROFILE_PRESETS[RiskProfile.BALANCED]
        assert params["max_position"] == 12.0
        assert params["cash_reserve"] == 10.0

    def test_aggressive_values(self):
        params = RISK_PROFILE_PRESETS[RiskProfile.AGGRESSIVE]
        assert params["max_position"] == 20.0
        assert params["cash_reserve"] == 5.0

    def test_each_profile_has_required_keys(self):
        required = {"max_position", "min_position", "max_sector_exposure", "cash_reserve", "max_risk_per_trade"}
        for profile, params in RISK_PROFILE_PRESETS.items():
            assert required.issubset(params.keys()), f"Missing keys for {profile}"
