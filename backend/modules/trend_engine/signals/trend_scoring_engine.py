from __future__ import annotations

from modules.trend_engine.core.types import (
    IndicatorResult, Signal, SignalType, TrendDirection, TrendScore,
)


class TrendScoringEngine:

    def calculate_trend_score(self, result: IndicatorResult) -> float:
        if result.current_value is None:
            return 50.0
        score = 50.0
        slope = result.slope or 0
        score += min(25, slope * 2000)
        if result.acceleration is not None:
            score += min(10, result.acceleration * 3000)
        if result.trend == TrendDirection.BULLISH:
            score += 10
        elif result.trend == TrendDirection.BEARISH:
            score -= 10
        return max(0.0, min(100.0, score))

    def calculate_breakout_score(self, result: IndicatorResult) -> float:
        if result.current_value is None:
            return 50.0
        v = result.current_value
        if result.trend == TrendDirection.BULLISH:
            return min(100.0, 60.0 + abs(v) * 10)
        elif result.trend == TrendDirection.BEARISH:
            return max(0.0, 40.0 - abs(v) * 10)
        return 50.0

    def calculate_continuation_score(self, result: IndicatorResult) -> float:
        if result.current_value is None:
            return 50.0
        score = 50.0
        slope = result.slope or 0
        if result.trend == TrendDirection.BULLISH and slope > 0:
            score += min(30, slope * 2000)
        elif result.trend == TrendDirection.BEARISH and slope < 0:
            score += min(30, abs(slope) * 2000)
        if result.acceleration is not None:
            score += min(10, result.acceleration * 3000)
        return max(0.0, min(100.0, score))

    def calculate_reversal_score(self, result: IndicatorResult) -> float:
        if result.current_value is None:
            return 50.0
        score = 50.0
        slope = result.slope or 0
        if result.trend == TrendDirection.BULLISH and slope < 0:
            score += min(30, abs(slope) * 2000)
        elif result.trend == TrendDirection.BEARISH and slope > 0:
            score += min(30, slope * 2000)
        if result.acceleration is not None:
            score += min(15, abs(result.acceleration) * 3000)
        return max(0.0, min(100.0, score))

    def calculate_confidence(
        self, result: IndicatorResult, prices: list
    ) -> float:
        if not prices:
            return 0.0
        data_score = min(50.0, len(prices) / 2)
        validity_score = 50.0 if result.current_value is not None else 0.0
        return min(100.0, data_score + validity_score)

    def calculate_composite(
        self,
        result: IndicatorResult,
        signals: list[Signal],
        prices: list,
    ) -> TrendScore:
        ts = self.calculate_trend_score(result)
        bs = self.calculate_breakout_score(result)
        cs = self.calculate_continuation_score(result)
        rs = self.calculate_reversal_score(result)
        conf = self.calculate_confidence(result, prices)
        composite = ts * 0.30 + bs * 0.20 + cs * 0.25 + rs * 0.15 + conf * 0.10
        return TrendScore(
            trend_score=round(ts, 2),
            breakout_score=round(bs, 2),
            continuation_score=round(cs, 2),
            reversal_score=round(rs, 2),
            confidence=round(conf, 2),
            components={
                "current_value": result.current_value,
                "slope": result.slope,
                "trend": result.trend.value,
                "signal_count": len(signals),
            },
        )
