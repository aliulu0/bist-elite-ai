import pytest
from modules.moving_average.scoring.score_engine import ScoreEngine
from modules.moving_average.core.types import (
    TrendResult, TrendDirection, SlopeResult, CrossResult,
    CrossType, CrossStrength, MAScore,
)


class TestScoreEngine:
    def setup_method(self):
        self.engine = ScoreEngine()

    def test_perfect_uptrend(self):
        trend = TrendResult(TrendDirection.UPTREND, 0.9, 10, 0.95, 110.0, "above")
        slope = SlopeResult(0.01, 45.0, 0.001, True)
        ma = [100.0 + i for i in range(20)]
        closes = [102.0 + i for i in range(20)]
        score = self.engine.calculate(ma, closes, slope, trend, [])
        assert score.trend_score > 70
        assert score.ma_score > 60

    def test_perfect_downtrend(self):
        trend = TrendResult(TrendDirection.DOWNTREND, 0.9, 10, 0.95, 90.0, "below")
        slope = SlopeResult(-0.01, -45.0, -0.001, False)
        ma = [100.0 - i for i in range(20)]
        closes = [98.0 - i for i in range(20)]
        score = self.engine.calculate(ma, closes, slope, trend, [])
        assert score.trend_score < 30

    def test_no_trend(self):
        score = self.engine.calculate(
            [100.0] * 20, [100.0] * 20, None, None, []
        )
        assert score.trend_score == 50.0
        assert score.momentum_score == 50.0

    def test_score_range(self):
        ma = [100.0 + i for i in range(20)]
        closes = [102.0 + i for i in range(20)]
        score = self.engine.calculate(ma, closes, None, None, [])
        assert 0 <= score.ma_score <= 100
        assert 0 <= score.trend_score <= 100

    def test_cross_score_golden(self):
        cross = CrossResult(
            cross_type=CrossType.GOLDEN,
            cross_strength=CrossStrength.STRONG,
            cross_date="2024-01-01",
            fast_period=5, slow_period=20,
            confirmed=True, false_cross=False,
            distance_at_cross=0.5,
        )
        ma = [100.0] * 20
        closes = [100.0] * 20
        score = self.engine.calculate(ma, closes, None, None, [cross])
        assert score.cross_score > 50

    def test_cross_score_death(self):
        cross = CrossResult(
            cross_type=CrossType.DEATH,
            cross_strength=CrossStrength.STRONG,
            cross_date="2024-01-01",
            fast_period=5, slow_period=20,
            confirmed=True, false_cross=False,
            distance_at_cross=0.5,
        )
        ma = [100.0] * 20
        closes = [100.0] * 20
        score = self.engine.calculate(ma, closes, None, None, [cross])
        assert score.cross_score < 50

    def test_composite_score(self):
        ma = [100.0 + i for i in range(20)]
        closes = [102.0 + i for i in range(20)]
        trend = TrendResult(TrendDirection.UPTREND, 0.8, 5, 0.9, 110.0, "above")
        slope = SlopeResult(0.005, 30.0, 0.001, True)
        score = self.engine.calculate(ma, closes, slope, trend, [])
        assert 0 <= score.ma_score <= 100
