from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.market_regime_engine.core.types import DetectionSignal
from modules.market_regime_engine.detectors.detectors import (
    MovingAverageDetector,
    BreadthDetector,
    VolatilityDetector,
    MomentumDetector,
    TrendStrengthDetector,
    VolumeExpansionDetector,
    SectorRotationDetector,
    LiquidityDetector,
    ParticipationDetector,
    DETECTOR_MAP,
)

BULLISH_DATA = {
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

BEARISH_DATA = {
    "price": 80.0, "ma20": 85.0, "ma50": 90.0, "ma200": 100.0,
    "rsi": 30.0, "macd_hist": -1.0, "roc": -5.0, "stochastic_k": 20.0,
    "adx": 35.0, "plus_di": 15.0, "minus_di": 40.0,
    "vix": 35.0, "atr": 3.0, "atr_pct": 3.5,
    "advance_decline_ratio": 0.4, "pct_above_ma50": 20.0,
    "relative_volume": 0.5, "obv_trend": -0.6, "cmf": -0.2,
    "leading_sectors": 1.0, "weak_sectors": 8.0, "total_sectors": 10.0,
    "bid_ask_spread": 0.05, "market_depth": 0.5, "turnover_ratio": 0.4,
    "advance_decline_pct": 25.0, "pct_above_ma200": 20.0,
    "new_52w_highs_pct": 2.0, "up_volume_pct": 25.0,
    "new_highs_lows_ratio": -0.8,
}

NEUTRAL_DATA = {
    "price": 100.0, "ma20": 100.0, "ma50": 100.0, "ma200": 100.0,
    "rsi": 50.0, "macd_hist": 0.0, "roc": 0.0, "stochastic_k": 50.0,
    "adx": 20.0, "plus_di": 25.0, "minus_di": 22.0,
    "vix": 20.0, "atr": 1.5, "atr_pct": 1.5,
    "advance_decline_ratio": 1.0, "pct_above_ma50": 50.0,
    "relative_volume": 1.0, "obv_trend": 0.0, "cmf": 0.0,
    "leading_sectors": 3.0, "weak_sectors": 3.0, "total_sectors": 10.0,
    "bid_ask_spread": 0.01, "market_depth": 1.0, "turnover_ratio": 1.0,
    "advance_decline_pct": 50.0, "pct_above_ma200": 50.0,
    "new_52w_highs_pct": 10.0, "up_volume_pct": 50.0,
    "new_highs_lows_ratio": 0.0,
}


class TestMovingAverageDetector:
    def setup_method(self):
        self.detector = MovingAverageDetector()

    def test_bullish(self):
        signal = self.detector.detect(BULLISH_DATA)
        assert signal.signal_type == DetectionSignal.MOVING_AVERAGE_STRUCTURE
        assert signal.value == pytest.approx(0.9)
        assert signal.confidence > 0.5

    def test_bearish(self):
        signal = self.detector.detect(BEARISH_DATA)
        assert signal.value == pytest.approx(0.1)
        assert signal.confidence > 0.5

    def test_neutral(self):
        signal = self.detector.detect(NEUTRAL_DATA)
        assert signal.value == pytest.approx(0.5)
        assert signal.confidence == pytest.approx(0.0)

    def test_defaults_without_data(self):
        signal = self.detector.detect({})
        assert signal.signal_type == DetectionSignal.MOVING_AVERAGE_STRUCTURE


class TestBreadthDetector:
    def setup_method(self):
        self.detector = BreadthDetector()

    def test_bullish(self):
        signal = self.detector.detect(BULLISH_DATA)
        assert signal.signal_type == DetectionSignal.BREADTH_INDICATORS
        assert signal.value > 0.5

    def test_bearish(self):
        signal = self.detector.detect(BEARISH_DATA)
        assert signal.value < 0.5

    def test_neutral(self):
        signal = self.detector.detect(NEUTRAL_DATA)
        assert 0.3 <= signal.value <= 0.7

    def test_weight(self):
        signal = self.detector.detect({})
        assert signal.weight == 1.3


class TestVolatilityDetector:
    def setup_method(self):
        self.detector = VolatilityDetector()

    def test_bullish_low_vol(self):
        signal = self.detector.detect(BULLISH_DATA)
        assert signal.signal_type == DetectionSignal.VOLATILITY
        assert signal.value > 0.5

    def test_bearish_high_vol(self):
        signal = self.detector.detect(BEARISH_DATA)
        assert signal.value < 0.5

    def test_neutral(self):
        signal = self.detector.detect(NEUTRAL_DATA)
        assert 0.3 <= signal.value <= 0.8

    def test_weight(self):
        signal = self.detector.detect({})
        assert signal.weight == 1.2


class TestMomentumDetector:
    def setup_method(self):
        self.detector = MomentumDetector()

    def test_bullish(self):
        signal = self.detector.detect(BULLISH_DATA)
        assert signal.signal_type == DetectionSignal.MOMENTUM
        assert signal.value > 0.5

    def test_bearish(self):
        signal = self.detector.detect(BEARISH_DATA)
        assert signal.value < 0.5

    def test_neutral(self):
        signal = self.detector.detect(NEUTRAL_DATA)
        assert 0.3 <= signal.value <= 0.7

    def test_weight(self):
        signal = self.detector.detect({})
        assert signal.weight == 1.4


class TestTrendStrengthDetector:
    def setup_method(self):
        self.detector = TrendStrengthDetector()

    def test_bullish(self):
        signal = self.detector.detect(BULLISH_DATA)
        assert signal.signal_type == DetectionSignal.TREND_STRENGTH
        assert signal.value > 0.5

    def test_bearish(self):
        signal = self.detector.detect(BEARISH_DATA)
        assert signal.value < 0.5

    def test_neutral(self):
        signal = self.detector.detect(NEUTRAL_DATA)
        assert 0.3 <= signal.value <= 0.7

    def test_weight(self):
        signal = self.detector.detect({})
        assert signal.weight == 1.3


class TestVolumeExpansionDetector:
    def setup_method(self):
        self.detector = VolumeExpansionDetector()

    def test_bullish(self):
        signal = self.detector.detect(BULLISH_DATA)
        assert signal.signal_type == DetectionSignal.VOLUME_EXPANSION
        assert signal.value > 0.5

    def test_bearish(self):
        signal = self.detector.detect(BEARISH_DATA)
        assert signal.value < 0.5

    def test_neutral(self):
        signal = self.detector.detect(NEUTRAL_DATA)
        assert 0.3 <= signal.value <= 0.7

    def test_weight(self):
        signal = self.detector.detect({})
        assert signal.weight == 1.0


class TestSectorRotationDetector:
    def setup_method(self):
        self.detector = SectorRotationDetector()

    def test_bullish(self):
        signal = self.detector.detect(BULLISH_DATA)
        assert signal.signal_type == DetectionSignal.SECTOR_ROTATION
        assert signal.value > 0.5

    def test_bearish(self):
        signal = self.detector.detect(BEARISH_DATA)
        assert signal.value < 0.5

    def test_neutral(self):
        signal = self.detector.detect(NEUTRAL_DATA)
        assert 0.3 <= signal.value <= 0.5

    def test_zero_total_sectors(self):
        data = {"leading_sectors": 5.0, "weak_sectors": 2.0, "total_sectors": 0.0}
        signal = self.detector.detect(data)
        assert signal.signal_type == DetectionSignal.SECTOR_ROTATION


class TestLiquidityDetector:
    def setup_method(self):
        self.detector = LiquidityDetector()

    def test_bullish(self):
        signal = self.detector.detect(BULLISH_DATA)
        assert signal.signal_type == DetectionSignal.LIQUIDITY
        assert signal.value > 0.5

    def test_bearish(self):
        signal = self.detector.detect(BEARISH_DATA)
        assert signal.value < 0.5

    def test_neutral(self):
        signal = self.detector.detect(NEUTRAL_DATA)
        assert 0.3 <= signal.value <= 0.7

    def test_weight(self):
        signal = self.detector.detect({})
        assert signal.weight == 0.8


class TestParticipationDetector:
    def setup_method(self):
        self.detector = ParticipationDetector()

    def test_bullish(self):
        signal = self.detector.detect(BULLISH_DATA)
        assert signal.signal_type == DetectionSignal.MARKET_PARTICIPATION
        assert signal.value > 0.5

    def test_bearish(self):
        signal = self.detector.detect(BEARISH_DATA)
        assert signal.value < 0.5

    def test_neutral(self):
        signal = self.detector.detect(NEUTRAL_DATA)
        assert 0.3 <= signal.value <= 0.7

    def test_weight(self):
        signal = self.detector.detect({})
        assert signal.weight == 1.2


class TestDetectorMap:
    def test_all_nine_entries(self):
        assert len(DETECTOR_MAP) == 9

    def test_all_signal_types_present(self):
        for sig in DetectionSignal:
            assert sig in DETECTOR_MAP

    def test_all_detectors_instantiable(self):
        for sig, cls in DETECTOR_MAP.items():
            detector = cls()
            signal = detector.detect({})
            assert signal.signal_type == sig
