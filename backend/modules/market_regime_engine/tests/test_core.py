from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.market_regime_engine.core.types import (
    MarketRegime,
    DetectionSignal,
    InvestmentHorizon,
    ReportType,
    SectorStrength,
    TransitionType,
    StrategyProfile,
    RegimeSignal,
    RegimeClassification,
    SectorAnalysis,
    RegimeTransition,
    RegimeHistoryEntry,
    RegimeAnalysisRequest,
    RegimeAnalysisResult,
    classify_regime,
    compute_transition_probability,
    get_strategy_profile,
    get_risk_level,
    compute_stability,
    _mean,
    _stdev,
    _median,
    REGIME_ORDER,
    REGIME_TO_STRATEGY,
    REGIME_RISK_LEVEL,
)


class TestMarketRegimeEnum:
    def test_all_values(self):
        expected = [
            "strong_bull", "bull", "weak_bull", "sideways",
            "weak_bear", "bear", "strong_bear", "recovery",
            "distribution", "accumulation", "high_volatility", "low_volatility",
        ]
        assert len(MarketRegime) == 12
        assert [r.value for r in MarketRegime] == expected

    def test_member_access(self):
        assert MarketRegime.STRONG_BULL.value == "strong_bull"
        assert MarketRegime.LOW_VOLATILITY.value == "low_volatility"


class TestDetectionSignalEnum:
    def test_all_values(self):
        expected = [
            "moving_average_structure", "breadth_indicators", "volatility",
            "momentum", "trend_strength", "volume_expansion",
            "sector_rotation", "liquidity", "market_participation",
        ]
        assert len(DetectionSignal) == 9
        assert [s.value for s in DetectionSignal] == expected


class TestInvestmentHorizonEnum:
    def test_all_values(self):
        expected = ["weekly", "1_month", "3_months", "6_months", "12_months"]
        assert len(InvestmentHorizon) == 5
        assert [h.value for h in InvestmentHorizon] == expected


class TestReportTypeEnum:
    def test_all_values(self):
        expected = [
            "current_regime", "regime_history", "regime_changes",
            "sector_rotation", "expected_next_regime", "risk_imPLICATIONS", "full",
        ]
        assert len(ReportType) == 7
        assert [r.value for r in ReportType] == expected


class TestSectorStrengthEnum:
    def test_all_values(self):
        expected = ["leading", "weak", "neutral", "rotating"]
        assert len(SectorStrength) == 4
        assert [s.value for s in SectorStrength] == expected


class TestTransitionTypeEnum:
    def test_all_values(self):
        expected = [
            "bull_to_sideways", "sideways_to_bear", "bear_to_recovery",
            "recovery_to_bull", "accumulation_to_breakout",
            "distribution_to_downtrend", "continuation",
        ]
        assert len(TransitionType) == 7
        assert [t.value for t in TransitionType] == expected


class TestStrategyProfileEnum:
    def test_all_values(self):
        expected = [
            "aggressive_growth", "moderate_growth", "balanced", "defensive",
            "very_defensive", "market_neutral", "momentum", "mean_reversion",
        ]
        assert len(StrategyProfile) == 8
        assert [p.value for p in StrategyProfile] == expected


class TestRegimeSignalDataclass:
    def test_defaults(self):
        s = RegimeSignal()
        assert s.signal_type == DetectionSignal.MOVING_AVERAGE_STRUCTURE
        assert s.value == 0.0
        assert s.normalized_value == 0.0
        assert s.confidence == 0.0
        assert s.weight == 1.0
        assert s.description == ""
        assert s.metadata == {}

    def test_custom_values(self):
        s = RegimeSignal(
            signal_type=DetectionSignal.MOMENTUM,
            value=0.8,
            normalized_value=0.75,
            confidence=0.9,
            weight=1.4,
            description="test",
            metadata={"key": "val"},
        )
        assert s.signal_type == DetectionSignal.MOMENTUM
        assert s.value == 0.8
        assert s.metadata == {"key": "val"}


class TestRegimeClassificationDataclass:
    def test_defaults(self):
        c = RegimeClassification()
        assert c.regime == MarketRegime.SIDEWAYS
        assert c.confidence == 0.0
        assert c.score == 0.0
        assert c.stability == 0.0
        assert c.transition_probabilities == {}
        assert c.signals == []
        assert c.contributing_signals == {}
        assert c.metadata == {}

    def test_custom(self):
        c = RegimeClassification(
            regime=MarketRegime.BULL,
            confidence=0.85,
            score=0.75,
        )
        assert c.regime == MarketRegime.BULL
        assert c.confidence == 0.85


class TestSectorAnalysisDataclass:
    def test_defaults(self):
        s = SectorAnalysis()
        assert s.sector_name == ""
        assert s.strength == SectorStrength.NEUTRAL
        assert s.score == 0.0

    def test_custom(self):
        s = SectorAnalysis(
            sector_name="Tech",
            strength=SectorStrength.LEADING,
            score=0.9,
            relative_performance=0.05,
            momentum=0.12,
        )
        assert s.sector_name == "Tech"
        assert s.strength == SectorStrength.LEADING


class TestRegimeTransitionDataclass:
    def test_defaults(self):
        t = RegimeTransition()
        assert t.from_regime == MarketRegime.SIDEWAYS
        assert t.to_regime == MarketRegime.SIDEWAYS
        assert t.transition_type == TransitionType.CONTINUATION
        assert t.probability == 0.0

    def test_custom(self):
        t = RegimeTransition(
            from_regime=MarketRegime.BULL,
            to_regime=MarketRegime.SIDEWAYS,
            transition_type=TransitionType.BULL_TO_SIDEWAYS,
            probability=0.35,
        )
        assert t.from_regime == MarketRegime.BULL
        assert t.probability == 0.35


class TestRegimeHistoryEntryDataclass:
    def test_defaults(self):
        e = RegimeHistoryEntry()
        assert e.date == ""
        assert e.regime == MarketRegime.SIDEWAYS
        assert e.confidence == 0.0
        assert e.duration_days == 0

    def test_custom(self):
        e = RegimeHistoryEntry(
            date="2025-01-15",
            regime=MarketRegime.BEAR,
            confidence=0.7,
            score=0.25,
            stability=0.8,
            duration_days=10,
        )
        assert e.date == "2025-01-15"
        assert e.regime == MarketRegime.BEAR


class TestRegimeAnalysisRequestDataclass:
    def test_defaults(self):
        r = RegimeAnalysisRequest()
        assert r.reference_date == ""
        assert r.horizon == InvestmentHorizon.MONTH_3
        assert r.lookback_days == 252
        assert r.min_confidence == 0.3
        assert r.include_transitions is True
        assert r.include_sectors is True

    def test_custom(self):
        r = RegimeAnalysisRequest(
            reference_date="2025-06-01",
            horizon=InvestmentHorizon.MONTH_6,
            lookback_days=500,
            market_data={"price": 100.0},
        )
        assert r.reference_date == "2025-06-01"
        assert r.market_data == {"price": 100.0}


class TestRegimeAnalysisResultDataclass:
    def test_defaults(self):
        r = RegimeAnalysisResult()
        assert r.strategy_profile == StrategyProfile.BALANCED
        assert r.execution_time_ms == 0.0
        assert r.sectors == []
        assert r.transitions == []

    def test_custom(self):
        r = RegimeAnalysisResult(
            strategy_profile=StrategyProfile.AGGRESSIVE_GROWTH,
            execution_time_ms=12.5,
        )
        assert r.strategy_profile == StrategyProfile.AGGRESSIVE_GROWTH
        assert r.execution_time_ms == 12.5


class TestClassifyRegime:
    @pytest.mark.parametrize("score,expected", [
        (0.85, MarketRegime.STRONG_BULL),
        (0.90, MarketRegime.STRONG_BULL),
        (1.00, MarketRegime.STRONG_BULL),
        (0.70, MarketRegime.BULL),
        (0.75, MarketRegime.BULL),
        (0.84, MarketRegime.BULL),
        (0.55, MarketRegime.WEAK_BULL),
        (0.65, MarketRegime.WEAK_BULL),
        (0.69, MarketRegime.WEAK_BULL),
        (0.42, MarketRegime.SIDEWAYS),
        (0.50, MarketRegime.SIDEWAYS),
        (0.54, MarketRegime.SIDEWAYS),
        (0.30, MarketRegime.WEAK_BEAR),
        (0.35, MarketRegime.WEAK_BEAR),
        (0.41, MarketRegime.WEAK_BEAR),
        (0.15, MarketRegime.BEAR),
        (0.25, MarketRegime.BEAR),
        (0.29, MarketRegime.BEAR),
        (0.05, MarketRegime.STRONG_BEAR),
        (0.00, MarketRegime.STRONG_BEAR),
        (0.14, MarketRegime.STRONG_BEAR),
    ])
    def test_boundary_values(self, score, expected):
        assert classify_regime(score) == expected


class TestComputeTransitionProbability:
    def test_empty_history(self):
        result = compute_transition_probability(
            MarketRegime.BULL, MarketRegime.SIDEWAYS, []
        )
        assert result == 0.0

    def test_no_transitions_from(self):
        history = [
            RegimeHistoryEntry(date="2025-01-01", regime=MarketRegime.BEAR),
            RegimeHistoryEntry(date="2025-01-02", regime=MarketRegime.BEAR),
        ]
        result = compute_transition_probability(
            MarketRegime.BULL, MarketRegime.SIDEWAYS, history
        )
        assert result == 0.0

    def test_with_transitions(self):
        history = [
            RegimeHistoryEntry(date="2025-01-01", regime=MarketRegime.BULL),
            RegimeHistoryEntry(date="2025-01-02", regime=MarketRegime.SIDEWAYS),
            RegimeHistoryEntry(date="2025-01-03", regime=MarketRegime.BULL),
            RegimeHistoryEntry(date="2025-01-04", regime=MarketRegime.BULL),
            RegimeHistoryEntry(date="2025-01-05", regime=MarketRegime.BEAR),
        ]
        result = compute_transition_probability(
            MarketRegime.BULL, MarketRegime.SIDEWAYS, history
        )
        assert result == pytest.approx(1 / 3)

    def test_all_same_regime(self):
        history = [
            RegimeHistoryEntry(date=f"2025-01-0{i}", regime=MarketRegime.BULL)
            for i in range(1, 6)
        ]
        result = compute_transition_probability(
            MarketRegime.BULL, MarketRegime.BEAR, history
        )
        assert result == 0.0


class TestGetStrategyProfile:
    def test_known_regimes(self):
        assert get_strategy_profile(MarketRegime.STRONG_BULL) == StrategyProfile.AGGRESSIVE_GROWTH
        assert get_strategy_profile(MarketRegime.BULL) == StrategyProfile.MODERATE_GROWTH
        assert get_strategy_profile(MarketRegime.WEAK_BULL) == StrategyProfile.BALANCED
        assert get_strategy_profile(MarketRegime.SIDEWAYS) == StrategyProfile.MARKET_NEUTRAL
        assert get_strategy_profile(MarketRegime.WEAK_BEAR) == StrategyProfile.DEFENSIVE
        assert get_strategy_profile(MarketRegime.BEAR) == StrategyProfile.VERY_DEFENSIVE
        assert get_strategy_profile(MarketRegime.STRONG_BEAR) == StrategyProfile.VERY_DEFENSIVE
        assert get_strategy_profile(MarketRegime.RECOVERY) == StrategyProfile.MOMENTUM
        assert get_strategy_profile(MarketRegime.DISTRIBUTION) == StrategyProfile.DEFENSIVE
        assert get_strategy_profile(MarketRegime.ACCUMULATION) == StrategyProfile.MEAN_REVERSION
        assert get_strategy_profile(MarketRegime.HIGH_VOLATILITY) == StrategyProfile.MARKET_NEUTRAL
        assert get_strategy_profile(MarketRegime.LOW_VOLATILITY) == StrategyProfile.MODERATE_GROWTH


class TestGetRiskLevel:
    def test_known_regimes(self):
        assert get_risk_level(MarketRegime.STRONG_BULL) == 0.2
        assert get_risk_level(MarketRegime.BULL) == 0.3
        assert get_risk_level(MarketRegime.WEAK_BULL) == 0.4
        assert get_risk_level(MarketRegime.SIDEWAYS) == 0.5
        assert get_risk_level(MarketRegime.WEAK_BEAR) == 0.6
        assert get_risk_level(MarketRegime.BEAR) == 0.8
        assert get_risk_level(MarketRegime.STRONG_BEAR) == 0.95
        assert get_risk_level(MarketRegime.RECOVERY) == 0.5
        assert get_risk_level(MarketRegime.DISTRIBUTION) == 0.7
        assert get_risk_level(MarketRegime.ACCUMULATION) == 0.5
        assert get_risk_level(MarketRegime.HIGH_VOLATILITY) == 0.8
        assert get_risk_level(MarketRegime.LOW_VOLATILITY) == 0.3


class TestComputeStability:
    def test_empty(self):
        assert compute_stability([]) == 0.0

    def test_all_same(self):
        regimes = [MarketRegime.BULL] * 5
        assert compute_stability(regimes) == 1.0

    def test_no_same(self):
        regimes = [MarketRegime.BULL, MarketRegime.BEAR, MarketRegime.SIDEWAYS, MarketRegime.BULL, MarketRegime.BEAR]
        assert compute_stability(regimes) == pytest.approx(0.4)

    def test_window(self):
        regimes = [
            MarketRegime.BULL, MarketRegime.BULL,
            MarketRegime.BEAR, MarketRegime.BEAR, MarketRegime.BEAR,
        ]
        assert compute_stability(regimes, window=5) == pytest.approx(0.6)

    def test_window_smaller_than_list(self):
        regimes = [MarketRegime.BULL] * 10 + [MarketRegime.BEAR] * 5
        assert compute_stability(regimes, window=5) == 1.0


class TestMean:
    def test_normal(self):
        assert _mean([1.0, 2.0, 3.0]) == pytest.approx(2.0)

    def test_empty(self):
        assert _mean([]) == 0.0

    def test_single(self):
        assert _mean([5.0]) == 5.0


class TestStdev:
    def test_normal(self):
        assert _stdev([1.0, 2.0, 3.0]) == pytest.approx(1.0)

    def test_single(self):
        assert _stdev([1.0]) == 0.0

    def test_empty(self):
        assert _stdev([]) == 0.0

    def test_two_values(self):
        result = _stdev([0.0, 10.0])
        assert result == pytest.approx(7.071, abs=0.01)


class TestMedian:
    def test_odd(self):
        assert _median([1.0, 3.0, 2.0]) == 2.0

    def test_even(self):
        assert _median([1.0, 2.0, 3.0, 4.0]) == 2.5

    def test_empty(self):
        assert _median([]) == 0.0

    def test_single(self):
        assert _median([7.0]) == 7.0


class TestRegimeOrder:
    def test_has_all_regimes(self):
        assert len(REGIME_ORDER) == 12

    def test_ordering(self):
        assert REGIME_ORDER[MarketRegime.STRONG_BEAR] < REGIME_ORDER[MarketRegime.BEAR]
        assert REGIME_ORDER[MarketRegime.BEAR] < REGIME_ORDER[MarketRegime.WEAK_BEAR]
        assert REGIME_ORDER[MarketRegime.WEAK_BEAR] < REGIME_ORDER[MarketRegime.SIDEWAYS]
        assert REGIME_ORDER[MarketRegime.SIDEWAYS] < REGIME_ORDER[MarketRegime.WEAK_BULL]
        assert REGIME_ORDER[MarketRegime.WEAK_BULL] < REGIME_ORDER[MarketRegime.BULL]
        assert REGIME_ORDER[MarketRegime.BULL] < REGIME_ORDER[MarketRegime.STRONG_BULL]
