from __future__ import annotations

from modules.trend_engine.core.types import (
    PriceBar, IndicatorResult, PullbackResult, PullbackType,
    TrendDirection,
)


class PullbackCalculator:

    @staticmethod
    def detect_pullback(
        prices: list[PriceBar],
        result: IndicatorResult,
        lookback: int = 20,
    ) -> PullbackResult:
        if len(prices) < lookback:
            return PullbackResult()

        n = len(prices)
        trend_start = max(0, n - lookback)
        closes = [p.close for p in prices]

        if result.trend == TrendDirection.NEUTRAL:
            return PullbackResult()

        if result.trend == TrendDirection.BULLISH:
            recent_high = max(closes[-lookback:])
            current = closes[-1]
            depth = (recent_high - current) / (recent_high + 1e-10)

            if depth < 0.02:
                return PullbackResult(
                    pullback_type=PullbackType.HEALTHY,
                    depth=depth,
                    recovery=1.0 - depth,
                    trend_resuming=True,
                    description=f"Healthy pullback: {depth:.1%} depth",
                )
            elif depth < 0.05:
                return PullbackResult(
                    pullback_type=PullbackType.WEAK,
                    depth=depth,
                    recovery=max(0.0, 1.0 - depth * 2),
                    trend_resuming=depth < 0.03,
                    description=f"Weak pullback: {depth:.1%} depth",
                )
            elif depth < 0.10:
                return PullbackResult(
                    pullback_type=PullbackType.DEEP,
                    depth=depth,
                    recovery=max(0.0, 1.0 - depth * 3),
                    trend_resuming=False,
                    description=f"Deep pullback: {depth:.1%} depth",
                )

        elif result.trend == TrendDirection.BEARISH:
            recent_low = min(closes[-lookback:])
            current = closes[-1]
            depth = (current - recent_low) / (recent_low + 1e-10)

            if depth < 0.02:
                return PullbackResult(
                    pullback_type=PullbackType.HEALTHY,
                    depth=depth,
                    recovery=1.0 - depth,
                    trend_resuming=True,
                    description=f"Healthy bounce: {depth:.1%}",
                )
            elif depth < 0.05:
                return PullbackResult(
                    pullback_type=PullbackType.WEAK,
                    depth=depth,
                    recovery=max(0.0, 1.0 - depth * 2),
                    trend_resuming=depth < 0.03,
                    description=f"Weak bounce: {depth:.1%}",
                )
            elif depth < 0.10:
                return PullbackResult(
                    pullback_type=PullbackType.DEEP,
                    depth=depth,
                    recovery=max(0.0, 1.0 - depth * 3),
                    trend_resuming=False,
                    description=f"Deep bounce: {depth:.1%}",
                )

        return PullbackResult()

    @staticmethod
    def is_trend_resuming(
        prices: list[PriceBar],
        result: IndicatorResult,
        pullback: PullbackResult,
    ) -> bool:
        if pullback.pullback_type == PullbackType.NONE:
            return False
        if len(prices) < 3:
            return False

        closes = [p.close for p in prices]
        if result.trend == TrendDirection.BULLISH:
            return closes[-1] > closes[-2] > closes[-3]
        elif result.trend == TrendDirection.BEARISH:
            return closes[-1] < closes[-2] < closes[-3]
        return False
