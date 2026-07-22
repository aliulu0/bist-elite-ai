from __future__ import annotations

from modules.moving_average.core.types import (
    MAScore, SlopeResult, TrendResult, TrendDirection, CrossResult,
)
from modules.moving_average.signals.cross_detector import CrossDetector


class ScoreEngine:

    def calculate(
        self,
        ma_values: list[float | None],
        closes: list[float],
        slope: SlopeResult | None,
        trend: TrendResult | None,
        crosses: list[CrossResult],
    ) -> MAScore:
        trend_score = self._trend_score(trend)
        momentum_score = self._momentum_score(slope, ma_values)
        cross_score = self._cross_score(crosses)
        acc_score = self._acceleration_score(slope)
        ma_score = self._composite_ma_score(
            trend_score, momentum_score, cross_score, acc_score
        )

        return MAScore(
            trend_score=round(trend_score, 2),
            momentum_score=round(momentum_score, 2),
            cross_score=round(cross_score, 2),
            acceleration_score=round(acc_score, 2),
            ma_score=round(ma_score, 2),
            components={
                "trend_direction": trend.direction.value if trend else "unknown",
                "trend_strength": trend.strength if trend else 0,
                "trend_age": trend.age if trend else 0,
                "slope": slope.slope if slope else None,
                "angle": slope.angle_degrees if slope else None,
                "is_accelerating": slope.is_accelerating if slope else False,
            },
        )

    @staticmethod
    def _trend_score(trend: TrendResult | None) -> float:
        if trend is None:
            return 50.0
        score = 50.0
        if trend.direction == TrendDirection.UPTREND:
            score += trend.strength * 40
        elif trend.direction == TrendDirection.DOWNTREND:
            score -= trend.strength * 40
        age_bonus = min(20, trend.age * 2)
        if trend.direction == TrendDirection.UPTREND:
            score += age_bonus
        elif trend.direction == TrendDirection.DOWNTREND:
            score -= age_bonus
        return max(0.0, min(100.0, score))

    @staticmethod
    def _momentum_score(slope: SlopeResult | None, ma_values: list[float | None]) -> float:
        if slope is None or slope.slope is None:
            return 50.0
        score = 50.0
        score += min(30, slope.slope * 3000)
        if slope.angle_degrees is not None:
            angle_factor = min(1.0, abs(slope.angle_degrees) / 45.0)
            score += angle_factor * 15 if slope.slope > 0 else -angle_factor * 15
        return max(0.0, min(100.0, score))

    @staticmethod
    def _cross_score(crosses: list[CrossResult]) -> float:
        if not crosses:
            return 50.0
        latest = crosses[-1]
        from modules.moving_average.core.types import CrossType, CrossStrength
        score = 50.0
        if latest.cross_type == CrossType.GOLDEN:
            score += 20
        elif latest.cross_type == CrossType.DEATH:
            score -= 20
        if latest.cross_strength == CrossStrength.STRONG:
            score += 15 if latest.cross_type == CrossType.GOLDEN else -15
        elif latest.cross_strength == CrossStrength.WEAK:
            score += 5 if latest.cross_type == CrossType.GOLDEN else -5
        if latest.confirmed:
            score += 10 if latest.cross_type == CrossType.GOLDEN else -10
        if latest.false_cross:
            score = 50.0
        return max(0.0, min(100.0, score))

    @staticmethod
    def _acceleration_score(slope: SlopeResult | None) -> float:
        if slope is None or slope.acceleration is None:
            return 50.0
        score = 50.0
        acc = slope.acceleration
        score += min(30, acc * 5000) if acc > 0 else max(-30, acc * 5000)
        return max(0.0, min(100.0, score))

    @staticmethod
    def _composite_ma_score(
        trend_score: float,
        momentum_score: float,
        cross_score: float,
        acceleration_score: float,
    ) -> float:
        return (
            trend_score * 0.30
            + momentum_score * 0.25
            + cross_score * 0.25
            + acceleration_score * 0.20
        )
