from __future__ import annotations

from modules.momentum_engine.core.types import (
    IndicatorResult, Signal, SignalType, TrendDirection, MomentumScore,
)


class ScoringEngine:

    def calculate_momentum_score(self, result: IndicatorResult) -> float:
        if result.current_value is None:
            return 50.0
        v = result.current_value
        slope = result.slope or 0
        score = 50.0
        score += min(30, slope * 3000)
        if result.acceleration is not None:
            score += min(10, result.acceleration * 5000)
        return max(0.0, min(100.0, score))

    def calculate_trend_score(self, result: IndicatorResult) -> float:
        if result.trend == TrendDirection.BULLISH:
            return 70.0
        elif result.trend == TrendDirection.BEARISH:
            return 30.0
        return 50.0

    def calculate_signal_score(self, signals: list[Signal]) -> float:
        if not signals:
            return 50.0
        score = 0.0
        count = 0
        for s in signals:
            if s.signal_type in (SignalType.STRONG_BUY,):
                score += 90 * s.confidence
            elif s.signal_type == SignalType.BUY:
                score += 70 * s.confidence
            elif s.signal_type == SignalType.SELL:
                score += 30 * s.confidence
            elif s.signal_type == SignalType.STRONG_SELL:
                score += 10 * s.confidence
            else:
                score += 50 * s.confidence
            count += 1
        return max(0.0, min(100.0, score / count if count > 0 else 50.0))

    def calculate_strength_score(self, result: IndicatorResult) -> float:
        if result.current_value is None:
            return 0.0
        return min(100.0, abs(result.slope or 0) * 5000 + 50)

    def calculate_confidence_score(
        self, result: IndicatorResult, prices: list
    ) -> float:
        if not prices:
            return 0.0
        data_score = min(50.0, len(prices) / 2)
        validity_score = 50.0 if result.current_value is not None else 0.0
        return min(100.0, (data_score + validity_score))

    def calculate_composite(
        self,
        result: IndicatorResult,
        signals: list[Signal],
        prices: list,
    ) -> MomentumScore:
        ms = self.calculate_momentum_score(result)
        ts = self.calculate_trend_score(result)
        ss = self.calculate_signal_score(signals)
        str_s = self.calculate_strength_score(result)
        cs = self.calculate_confidence_score(result, prices)
        composite = (
            ms * 0.25 + ts * 0.25 + ss * 0.25 + str_s * 0.15 + cs * 0.10
        )
        return MomentumScore(
            momentum_score=round(ms, 2),
            trend_score=round(ts, 2),
            signal_score=round(ss, 2),
            strength_score=round(str_s, 2),
            confidence_score=round(cs, 2),
            composite_score=round(composite, 2),
            components={
                "current_value": result.current_value,
                "slope": result.slope,
                "acceleration": result.acceleration,
                "trend": result.trend.value,
                "signal_count": len(signals),
            },
        )
