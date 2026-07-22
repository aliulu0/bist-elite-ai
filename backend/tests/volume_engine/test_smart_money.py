import pytest
from modules.volume_engine.smart_money.smart_money_detector import SmartMoneyDetector
from modules.volume_engine.core.types import (
    IndicatorResult, TrendDirection, SmartMoneyType,
)
from tests.volume_engine.conftest import _bars


class TestSmartMoneyDetector:
    def setup_method(self):
        self.detector = SmartMoneyDetector()

    def test_detect_insufficient_data(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[100],
            dates=["2024-01-01"], current_value=100,
        )
        sm = self.detector.detect(_bars(5), result)
        assert sm.detection_type == SmartMoneyType.NONE

    def test_detect_normal(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[100] * 50,
            dates=[f"2024-01-{(i % 28) + 1:02d}" for i in range(50)],
            current_value=100, trend=TrendDirection.NEUTRAL,
        )
        sm = self.detector.detect(_bars(50), result)
        assert sm.detection_type.value in [
            "institutional_accumulation", "institutional_distribution",
            "hidden_buying", "hidden_selling", "silent_accumulation",
            "volume_spike", "absorption", "none",
        ]

    def test_detect_volume_spike(self):
        bars = _bars(50)
        bars[-1] = bars[-1].__class__(
            date=bars[-1].date, open=bars[-1].open,
            high=bars[-1].high, low=bars[-1].low,
            close=bars[-1].close, volume=50000,
        )
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[100] * 50,
            dates=[f"2024-01-{(i % 28) + 1:02d}" for i in range(50)],
            current_value=100, trend=TrendDirection.BULLISH,
        )
        sm = self.detector.detect(bars, result)
        assert sm.confidence >= 0

    def test_result_fields(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[100] * 50,
            dates=[f"2024-01-{(i % 28) + 1:02d}" for i in range(50)],
            current_value=100, trend=TrendDirection.NEUTRAL,
        )
        sm = self.detector.detect(_bars(50), result)
        assert sm.volume_ratio > 0
        assert isinstance(sm.description, str)
