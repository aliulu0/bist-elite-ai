from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.market_regime_engine.core.types import (
    DetectionSignal,
    MarketRegime,
    RegimeClassification,
    RegimeHistoryEntry,
    RegimeSignal,
    StrategyProfile,
)
from modules.market_regime_engine.classification.engine import RegimeClassifier


def _make_signal(sig_type: DetectionSignal, value: float, weight: float = 1.0) -> RegimeSignal:
    return RegimeSignal(
        signal_type=sig_type,
        value=value,
        normalized_value=value,
        confidence=abs(value - 0.5) * 2.0,
        weight=weight,
    )


def _bullish_signals() -> list[RegimeSignal]:
    return [
        _make_signal(DetectionSignal.MOVING_AVERAGE_STRUCTURE, 0.9, 1.5),
        _make_signal(DetectionSignal.BREADTH_INDICATORS, 0.85, 1.3),
        _make_signal(DetectionSignal.VOLATILITY, 0.8, 1.2),
        _make_signal(DetectionSignal.MOMENTUM, 0.85, 1.4),
        _make_signal(DetectionSignal.TREND_STRENGTH, 0.8, 1.3),
        _make_signal(DetectionSignal.VOLUME_EXPANSION, 0.7, 1.0),
        _make_signal(DetectionSignal.SECTOR_ROTATION, 0.75, 1.1),
        _make_signal(DetectionSignal.LIQUIDITY, 0.7, 0.8),
        _make_signal(DetectionSignal.MARKET_PARTICIPATION, 0.8, 1.2),
    ]


def _bearish_signals() -> list[RegimeSignal]:
    return [
        _make_signal(DetectionSignal.MOVING_AVERAGE_STRUCTURE, 0.1, 1.5),
        _make_signal(DetectionSignal.BREADTH_INDICATORS, 0.15, 1.3),
        _make_signal(DetectionSignal.VOLATILITY, 0.2, 1.2),
        _make_signal(DetectionSignal.MOMENTUM, 0.15, 1.4),
        _make_signal(DetectionSignal.TREND_STRENGTH, 0.2, 1.3),
        _make_signal(DetectionSignal.VOLUME_EXPANSION, 0.3, 1.0),
        _make_signal(DetectionSignal.SECTOR_ROTATION, 0.25, 1.1),
        _make_signal(DetectionSignal.LIQUIDITY, 0.3, 0.8),
        _make_signal(DetectionSignal.MARKET_PARTICIPATION, 0.2, 1.2),
    ]


def _neutral_signals() -> list[RegimeSignal]:
    return [
        _make_signal(DetectionSignal.MOVING_AVERAGE_STRUCTURE, 0.5, 1.5),
        _make_signal(DetectionSignal.BREADTH_INDICATORS, 0.5, 1.3),
        _make_signal(DetectionSignal.VOLATILITY, 0.5, 1.2),
        _make_signal(DetectionSignal.MOMENTUM, 0.5, 1.4),
        _make_signal(DetectionSignal.TREND_STRENGTH, 0.5, 1.3),
        _make_signal(DetectionSignal.VOLUME_EXPANSION, 0.5, 1.0),
        _make_signal(DetectionSignal.SECTOR_ROTATION, 0.5, 1.1),
        _make_signal(DetectionSignal.LIQUIDITY, 0.5, 0.8),
        _make_signal(DetectionSignal.MARKET_PARTICIPATION, 0.5, 1.2),
    ]


class TestRegimeClassifierClassify:
    def setup_method(self):
        self.classifier = RegimeClassifier()

    def test_bullish_signals(self):
        signals = _bullish_signals()
        result = self.classifier.classify(signals)
        assert result.regime in (MarketRegime.BULL, MarketRegime.STRONG_BULL, MarketRegime.WEAK_BULL)
        assert result.score > 0.5
        assert result.confidence > 0.0

    def test_bearish_signals(self):
        signals = _bearish_signals()
        result = self.classifier.classify(signals)
        assert result.regime in (MarketRegime.BEAR, MarketRegime.STRONG_BEAR, MarketRegime.WEAK_BEAR)
        assert result.score < 0.5

    def test_neutral_signals(self):
        signals = _neutral_signals()
        result = self.classifier.classify(signals)
        assert result.regime == MarketRegime.SIDEWAYS
        assert result.score == pytest.approx(0.5, abs=0.05)

    def test_empty_signals(self):
        result = self.classifier.classify([])
        assert result.regime == MarketRegime.SIDEWAYS
        assert result.confidence == 0.0
        assert result.score == 0.0

    def test_contributing_signals_populated(self):
        signals = _bullish_signals()
        result = self.classifier.classify(signals)
        assert len(result.contributing_signals) == 9

    def test_signals_stored(self):
        signals = _bullish_signals()
        result = self.classifier.classify(signals)
        assert len(result.signals) == 9

    def test_transition_probabilities(self):
        signals = _bullish_signals()
        result = self.classifier.classify(signals)
        assert len(result.transition_probabilities) > 0

    def test_stability_no_history(self):
        signals = _bullish_signals()
        result = self.classifier.classify(signals, history=[])
        assert result.stability == 0.0

    def test_stability_with_history(self):
        signals = _bullish_signals()
        history = [
            RegimeHistoryEntry(date=f"2025-01-0{i}", regime=MarketRegime.BULL)
            for i in range(1, 6)
        ]
        result = self.classifier.classify(signals, history=history)
        assert result.stability == 1.0


class TestClassifyFromMarketData:
    def setup_method(self):
        self.classifier = RegimeClassifier()

    def test_bullish_market_data(self):
        market_data = {
            "price": 120.0, "ma20": 115.0, "ma50": 110.0, "ma200": 100.0,
            "rsi": 70.0, "macd_hist": 1.0, "roc": 5.0, "stochastic_k": 80.0,
            "adx": 40.0, "plus_di": 45.0, "minus_di": 15.0,
            "vix": 12.0, "atr": 0.8, "atr_pct": 0.7,
            "advance_decline_ratio": 2.0, "pct_above_ma50": 80.0,
            "relative_volume": 2.0, "obv_trend": 0.8, "cmf": 0.3,
            "leading_sectors": 8.0, "weak_sectors": 1.0, "total_sectors": 10.0,
            "bid_ask_spread": 0.002, "market_depth": 1.8, "turnover_ratio": 1.8,
            "advance_decline_pct": 75.0, "pct_above_ma200": 80.0,
            "new_52w_highs_pct": 25.0, "up_volume_pct": 75.0,
            "new_highs_lows_ratio": 0.8,
        }
        result = self.classifier.classify_from_market_data(market_data)
        assert isinstance(result, RegimeClassification)
        assert result.confidence > 0.0

    def test_empty_market_data(self):
        result = self.classifier.classify_from_market_data({})
        assert isinstance(result, RegimeClassification)

    def test_with_specific_signals(self):
        market_data = {
            "price": 120.0, "ma20": 115.0, "ma50": 110.0, "ma200": 100.0,
        }
        result = self.classifier.classify_from_market_data(
            market_data,
            signals=[DetectionSignal.MOVING_AVERAGE_STRUCTURE],
        )
        assert isinstance(result, RegimeClassification)
        assert len(result.signals) == 1


class TestComputeNextRegimePrediction:
    def setup_method(self):
        self.classifier = RegimeClassifier()

    def test_with_transitions(self):
        current = RegimeClassification(
            regime=MarketRegime.BULL,
            transition_probabilities={"sideways": 0.3, "weak_bull": 0.5, "bear": 0.2},
        )
        prediction = self.classifier.compute_next_regime_prediction(current)
        assert prediction is not None
        assert prediction.regime == MarketRegime.WEAK_BULL

    def test_no_transitions(self):
        current = RegimeClassification(
            regime=MarketRegime.BULL,
            transition_probabilities={},
        )
        prediction = self.classifier.compute_next_regime_prediction(current)
        assert prediction is None

    def test_invalid_regime_value(self):
        current = RegimeClassification(
            regime=MarketRegime.BULL,
            transition_probabilities={"invalid_regime": 0.9},
        )
        prediction = self.classifier.compute_next_regime_prediction(current)
        assert prediction is None


class TestDetermineStrategyProfile:
    def setup_method(self):
        self.classifier = RegimeClassifier()

    def test_bull(self):
        classification = RegimeClassification(regime=MarketRegime.BULL)
        assert self.classifier.determine_strategy_profile(classification) == StrategyProfile.MODERATE_GROWTH

    def test_sideways(self):
        classification = RegimeClassification(regime=MarketRegime.SIDEWAYS)
        assert self.classifier.determine_strategy_profile(classification) == StrategyProfile.MARKET_NEUTRAL

    def test_bear(self):
        classification = RegimeClassification(regime=MarketRegime.BEAR)
        assert self.classifier.determine_strategy_profile(classification) == StrategyProfile.VERY_DEFENSIVE
