import pytest
from modules.volume_engine.signals.volume_scoring_engine import VolumeScoringEngine
from modules.volume_engine.core.types import IndicatorResult, TrendDirection, SmartMoneyResult, SmartMoneyType, Signal, SignalType
from tests.volume_engine.conftest import _bars


class TestVolumeScoringEngine:
    def setup_method(self):
        self.engine = VolumeScoringEngine()

    def test_calculate_volume_score(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[100, 200],
            dates=["2024-01-01", "2024-01-02"],
            current_value=200, previous_value=100,
            slope=0.001, trend=TrendDirection.BULLISH,
        )
        score = self.engine.calculate_volume_score(result)
        assert 0 <= score <= 100

    def test_calculate_volume_score_none(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[None],
            dates=["2024-01-01"], current_value=None,
        )
        score = self.engine.calculate_volume_score(result)
        assert score == 50.0

    def test_calculate_liquidity_score(self):
        bars = _bars(50)
        score = self.engine.calculate_liquidity_score(bars)
        assert score >= 0

    def test_calculate_liquidity_score_empty(self):
        score = self.engine.calculate_liquidity_score([])
        assert score == 0.0

    def test_calculate_participation_score(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[100],
            dates=["2024-01-01"], current_value=100,
        )
        score = self.engine.calculate_participation_score(result, _bars(50))
        assert 0 <= score <= 100

    def test_calculate_institutional_score(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[100],
            dates=["2024-01-01"], current_value=100,
        )
        sm = SmartMoneyResult(detection_type=SmartMoneyType.INSTITUTIONAL_ACCUMULATION, confidence=0.8)
        score = self.engine.calculate_institutional_score(result, sm)
        assert score >= 50

    def test_calculate_confidence(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[100],
            dates=["2024-01-01"], current_value=100,
        )
        score = self.engine.calculate_confidence(result, _bars(50))
        assert score >= 0

    def test_calculate_composite(self):
        result = IndicatorResult(
            indicator="OBV", parameters={}, values=[100, 200],
            dates=["2024-01-01", "2024-01-02"],
            current_value=200, slope=0.001,
            trend=TrendDirection.BULLISH,
        )
        signals = [Signal(signal_type=SignalType.BUY, indicator="OBV",
                         confidence=0.7, strength=0.5, description="buy")]
        score = self.engine.calculate_composite(result, signals, _bars(50))
        assert 0 <= score.volume_score <= 100
        assert 0 <= score.confidence <= 100

    def test_calculate_institutional(self):
        results = {
            "obv": IndicatorResult(
                indicator="OBV", parameters={}, values=[100],
                dates=["2024-01-01"], current_value=100,
                trend=TrendDirection.BULLISH,
            ),
            "cmf": IndicatorResult(
                indicator="CMF", parameters={}, values=[0.1],
                dates=["2024-01-01"], current_value=0.1,
                trend=TrendDirection.BULLISH,
            ),
        }
        score = self.engine.calculate_institutional(_bars(50), results)
        assert score.smart_money_score >= 0
        assert score.accumulation_score >= 50
