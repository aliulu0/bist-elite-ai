from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.multi_factor_engine.core.types import (
    FactorGroup,
    FactorName,
    MarketRegime,
    InvestmentHorizon,
    ScoreStrength,
    ReportType,
    BenchmarkResultStatus,
    GROUP_FACTORS,
    FACTOR_GROUP_MAP,
    DEFAULT_WEIGHTS,
    _mean,
    _clamp,
    score_to_strength,
    compute_weighted_score,
    FactorScore,
    GroupScore,
    FactorProfile,
    FactorAnalysisRequest,
    FactorAnalysisResult,
    FactorRanking,
    BenchmarkResult,
    TOTAL_FACTOR_COUNT,
)


# ---------------------------------------------------------------------------
# Enum value tests
# ---------------------------------------------------------------------------

class TestFactorGroupEnum:
    def test_has_12_members(self):
        assert len(FactorGroup) == 12

    def test_all_values(self):
        expected = {
            "value", "growth", "quality", "momentum", "trend", "risk",
            "smart_money", "profitability", "efficiency",
            "financial_strength", "technical_strength", "liquidity",
        }
        assert {g.value for g in FactorGroup} == expected

    def test_members_are_strings(self):
        for g in FactorGroup:
            assert isinstance(g.value, str)


class TestFactorNameEnum:
    def test_has_correct_member_count(self):
        assert len(FactorName) == 51

    def test_total_factor_count_constant(self):
        assert TOTAL_FACTOR_COUNT == 51

    def test_known_names_exist(self):
        assert FactorName.PRICE_TO_DIVIDEND.value == "price_to_dividends"
        assert FactorName.RSI.value == "rsi"
        assert FactorName.DEPTH_OF_MARKET.value == "depth_of_market"
        assert FactorName.BID_ASK_SPREAD.value == "bid_ask_spread"


class TestMarketRegimeEnum:
    def test_has_12_members(self):
        assert len(MarketRegime) == 12

    def test_all_values(self):
        expected = {
            "strong_bull", "bull", "weak_bull", "sideways",
            "weak_bear", "bear", "strong_bear", "recovery",
            "distribution", "accumulation", "high_volatility", "low_volatility",
        }
        assert {r.value for r in MarketRegime} == expected


class TestInvestmentHorizonEnum:
    def test_has_5_members(self):
        assert len(InvestmentHorizon) == 5

    def test_all_values(self):
        expected = {"weekly", "month_1", "month_3", "month_6", "month_12"}
        assert {h.value for h in InvestmentHorizon} == expected


class TestScoreStrengthEnum:
    def test_has_5_members(self):
        assert len(ScoreStrength) == 5

    def test_all_values(self):
        expected = {"very_strong", "strong", "neutral", "weak", "very_weak"}
        assert {s.value for s in ScoreStrength} == expected


class TestReportTypeEnum:
    def test_has_6_members(self):
        assert len(ReportType) == 6

    def test_all_values(self):
        expected = {
            "full", "summary", "factor_breakdown",
            "ranking", "comparison", "regime_adapted",
        }
        assert {r.value for r in ReportType} == expected


class TestBenchmarkResultStatusEnum:
    def test_has_3_members(self):
        assert len(BenchmarkResultStatus) == 3

    def test_all_values(self):
        expected = {"success", "error", "timeout"}
        assert {s.value for s in BenchmarkResultStatus} == expected


# ---------------------------------------------------------------------------
# Constant data structure tests
# ---------------------------------------------------------------------------

class TestGroupFactors:
    def test_has_all_12_groups(self):
        assert len(GROUP_FACTORS) == 12

    def test_each_group_has_at_least_one_factor(self):
        for grp, factors in GROUP_FACTORS.items():
            assert isinstance(grp, FactorGroup)
            assert len(factors) > 0

    def test_value_group_has_6_factors(self):
        assert len(GROUP_FACTORS[FactorGroup.VALUE]) == 6

    def test_growth_group_has_5_factors(self):
        assert len(GROUP_FACTORS[FactorGroup.GROWTH]) == 5

    def test_quality_group_has_7_factors(self):
        assert len(GROUP_FACTORS[FactorGroup.QUALITY]) == 7

    def test_all_factors_are_factor_names(self):
        for grp, factors in GROUP_FACTORS.items():
            for f in factors:
                assert isinstance(f, FactorName)


class TestFactorGroupMap:
    def test_covers_all_factor_names_in_groups(self):
        all_names_in_groups = set()
        for grp, factors in GROUP_FACTORS.items():
            for f in factors:
                all_names_in_groups.add(f)
        for name in all_names_in_groups:
            assert name in FACTOR_GROUP_MAP, f"{name} missing from FACTOR_GROUP_MAP"

    def test_map_values_are_groups(self):
        for name, grp in FACTOR_GROUP_MAP.items():
            assert isinstance(name, FactorName)
            assert isinstance(grp, FactorGroup)


class TestDefaultWeights:
    def test_has_all_12_groups(self):
        assert len(DEFAULT_WEIGHTS) == 12

    def test_weights_are_positive(self):
        for grp, w in DEFAULT_WEIGHTS.items():
            assert w > 0, f"{grp} has non-positive weight {w}"

    def test_known_weight_values(self):
        assert DEFAULT_WEIGHTS[FactorGroup.VALUE] == 1.2
        assert DEFAULT_WEIGHTS[FactorGroup.GROWTH] == 1.1
        assert DEFAULT_WEIGHTS[FactorGroup.QUALITY] == 1.0
        assert DEFAULT_WEIGHTS[FactorGroup.LIQUIDITY] == 0.7


# ---------------------------------------------------------------------------
# Helper function tests
# ---------------------------------------------------------------------------

class TestMean:
    def test_empty_list_returns_zero(self):
        assert _mean([]) == 0.0

    def test_single_value(self):
        assert _mean([42.0]) == 42.0

    def test_multiple_values(self):
        assert _mean([10.0, 20.0, 30.0]) == 20.0

    def test_negative_values(self):
        assert _mean([-10.0, 10.0]) == 0.0

    def test_float_precision(self):
        result = _mean([1.0, 2.0])
        assert abs(result - 1.5) < 1e-10


class TestClamp:
    def test_within_bounds(self):
        assert _clamp(50.0) == 50.0

    def test_below_lower_bound(self):
        assert _clamp(-5.0) == 0.0

    def test_above_upper_bound(self):
        assert _clamp(150.0) == 100.0

    def test_at_lower_bound(self):
        assert _clamp(0.0) == 0.0

    def test_at_upper_bound(self):
        assert _clamp(100.0) == 100.0

    def test_custom_bounds(self):
        assert _clamp(5.0, lo=10.0, hi=20.0) == 10.0
        assert _clamp(25.0, lo=10.0, hi=20.0) == 20.0
        assert _clamp(15.0, lo=10.0, hi=20.0) == 15.0


class TestScoreToStrength:
    def test_very_strong_at_80(self):
        assert score_to_strength(80) == ScoreStrength.VERY_STRONG

    def test_very_strong_above_80(self):
        assert score_to_strength(95) == ScoreStrength.VERY_STRONG

    def test_strong_at_60(self):
        assert score_to_strength(60) == ScoreStrength.STRONG

    def test_strong_at_79(self):
        assert score_to_strength(79) == ScoreStrength.STRONG

    def test_neutral_at_40(self):
        assert score_to_strength(40) == ScoreStrength.NEUTRAL

    def test_neutral_at_59(self):
        assert score_to_strength(59) == ScoreStrength.NEUTRAL

    def test_weak_at_20(self):
        assert score_to_strength(20) == ScoreStrength.WEAK

    def test_weak_at_39(self):
        assert score_to_strength(39) == ScoreStrength.WEAK

    def test_very_weak_below_20(self):
        assert score_to_strength(0) == ScoreStrength.VERY_WEAK

    def test_very_weak_at_19(self):
        assert score_to_strength(19) == ScoreStrength.VERY_WEAK

    def test_zero_score(self):
        assert score_to_strength(0.0) == ScoreStrength.VERY_WEAK

    def test_hundred_score(self):
        assert score_to_strength(100.0) == ScoreStrength.VERY_STRONG


class TestComputeWeightedScore:
    def test_empty_scores_returns_zero(self):
        assert compute_weighted_score({}, {}) == 0.0

    def test_equal_weights(self):
        scores = {
            FactorName.RSI: 80.0,
            FactorName.ADX: 60.0,
        }
        weights = {FactorGroup.MOMENTUM: 1.0}
        result = compute_weighted_score(scores, weights)
        assert abs(result - 70.0) < 1e-6

    def test_weighted_average(self):
        scores = {
            FactorName.REVENUE_GROWTH: 100.0,
            FactorName.NET_PROFIT_GROWTH: 50.0,
        }
        weights = {FactorGroup.GROWTH: 1.0}
        result = compute_weighted_score(scores, weights)
        assert abs(result - 75.0) < 1e-6

    def test_clamped_to_100(self):
        scores = {FactorName.RSI: 200.0}
        weights = {}
        result = compute_weighted_score(scores, weights)
        assert result == 100.0

    def test_clamped_to_0(self):
        scores = {FactorName.RSI: -50.0}
        weights = {}
        result = compute_weighted_score(scores, weights)
        assert result == 0.0


# ---------------------------------------------------------------------------
# Dataclass tests
# ---------------------------------------------------------------------------

class TestFactorScore:
    def test_creation(self):
        fs = FactorScore(factor=FactorName.RSI, score=75.0)
        assert fs.factor == FactorName.RSI
        assert fs.score == 75.0
        assert fs.weight == 1.0
        assert fs.strength == ScoreStrength.NEUTRAL

    def test_custom_fields(self):
        fs = FactorScore(
            factor=FactorName.ADX,
            score=85.0,
            weight=2.0,
            strength=ScoreStrength.STRONG,
            raw_value=30.0,
            normalized_value=0.85,
            metadata={"source": "test"},
        )
        assert fs.weight == 2.0
        assert fs.raw_value == 30.0
        assert fs.metadata["source"] == "test"


class TestGroupScore:
    def test_creation(self):
        gs = GroupScore(group=FactorGroup.VALUE, score=70.0)
        assert gs.group == FactorGroup.VALUE
        assert gs.score == 70.0
        assert gs.factors == []
        assert gs.rank == 0


class TestFactorProfile:
    def test_creation(self):
        fp = FactorProfile(symbol="TEST", reference_date="2024-01-01")
        assert fp.symbol == "TEST"
        assert fp.overall_score == 0.0
        assert fp.horizon == InvestmentHorizon.MONTH_3
        assert fp.regime is None

    def test_with_groups_and_factors(self):
        gs = GroupScore(group=FactorGroup.VALUE, score=75.0)
        fs = FactorScore(factor=FactorName.RSI, score=80.0)
        fp = FactorProfile(
            symbol="AAPL",
            reference_date="2024-06-01",
            group_scores=[gs],
            factor_scores=[fs],
            radar_data={"value": 75.0},
            strengths=["value (75.0)"],
            top_factors=["rsi (80.0)"],
        )
        assert len(fp.group_scores) == 1
        assert len(fp.factor_scores) == 1
        assert fp.radar_data["value"] == 75.0


class TestFactorAnalysisRequest:
    def test_defaults(self):
        req = FactorAnalysisRequest(symbol="TEST")
        assert req.symbol == "TEST"
        assert req.horizon == InvestmentHorizon.MONTH_3
        assert req.include_profile is True
        assert req.include_ranking is True
        assert req.market_data == {}

    def test_full_request(self):
        req = FactorAnalysisRequest(
            symbol="AAPL",
            reference_date="2024-01-01",
            horizon=InvestmentHorizon.MONTH_12,
            regime=MarketRegime.BULL,
            sector="technology",
            market_data={"price": 100.0},
            financial_data={"roe": 15.0},
            indicator_data={"rsi": 55.0},
        )
        assert req.regime == MarketRegime.BULL
        assert req.market_data["price"] == 100.0


class TestFactorAnalysisResult:
    def test_creation(self):
        req = FactorAnalysisRequest(symbol="TEST", reference_date="2024-01-01")
        result = FactorAnalysisResult(request=req)
        assert result.request.symbol == "TEST"
        assert result.profile is None
        assert result.ranking is None
        assert result.execution_time_ms == 0.0


class TestFactorRanking:
    def test_creation(self):
        fr = FactorRanking(symbol="TEST")
        assert fr.symbol == "TEST"
        assert fr.overall_rank == 0
        assert fr.strength_factors == []
        assert fr.weakness_factors == []


class TestBenchmarkResult:
    def test_success(self):
        br = BenchmarkResult(
            name="test_bench",
            status=BenchmarkResultStatus.SUCCESS,
            execution_time_ms=1.5,
            result="ok",
        )
        assert br.name == "test_bench"
        assert br.error is None

    def test_error(self):
        br = BenchmarkResult(
            name="failing",
            status=BenchmarkResultStatus.ERROR,
            error="something broke",
        )
        assert br.status == BenchmarkResultStatus.ERROR
        assert br.error == "something broke"

    def test_timeout(self):
        br = BenchmarkResult(
            name="slow",
            status=BenchmarkResultStatus.TIMEOUT,
            error="Timed out",
        )
        assert br.status == BenchmarkResultStatus.TIMEOUT
