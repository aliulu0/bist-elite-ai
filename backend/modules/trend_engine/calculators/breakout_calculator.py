from __future__ import annotations

from modules.trend_engine.core.types import (
    PriceBar, IndicatorResult, BreakoutResult, BreakoutType,
    TrendDirection,
)


class BreakoutCalculator:

    @staticmethod
    def find_support(prices: list[PriceBar], lookback: int = 20) -> float:
        if not prices:
            return 0.0
        n = min(lookback, len(prices))
        return min(p.low for p in prices[-n:])

    @staticmethod
    def find_resistance(prices: list[PriceBar], lookback: int = 20) -> float:
        if not prices:
            return 0.0
        n = min(lookback, len(prices))
        return max(p.high for p in prices[-n:])

    @staticmethod
    def detect_breakout(
        prices: list[PriceBar],
        result: IndicatorResult,
        lookback: int = 20,
    ) -> BreakoutResult:
        if len(prices) < lookback:
            return BreakoutResult()

        resistance = BreakoutCalculator.find_resistance(prices[:-1], lookback)
        support = BreakoutCalculator.find_support(prices[:-1], lookback)
        current = prices[-1]

        if current.close > resistance:
            confirmed = current.close > resistance * 1.01
            confidence = min(1.0, (current.close - resistance) / (resistance * 0.05 + 1e-10))
            return BreakoutResult(
                breakout_type=BreakoutType.RESISTANCE_BREAKOUT,
                level=resistance,
                confidence=confidence,
                confirmed=confirmed,
                description=f"Resistance breakout at {resistance:.2f}",
            )

        if current.close < support:
            confirmed = current.close < support * 0.99
            confidence = min(1.0, (support - current.close) / (support * 0.05 + 1e-10))
            return BreakoutResult(
                breakout_type=BreakoutType.SUPPORT_BREAKDOWN,
                level=support,
                confidence=confidence,
                confirmed=confirmed,
                description=f"Support breakdown at {support:.2f}",
            )

        if len(prices) >= 3:
            prev = prices[-2]
            if prev.close > resistance and current.close < resistance:
                return BreakoutResult(
                    breakout_type=BreakoutType.FAKE_BREAKOUT,
                    level=resistance,
                    confidence=0.6,
                    description=f"Fake breakout at {resistance:.2f}",
                )
            if prev.close < support and current.close > support:
                return BreakoutResult(
                    breakout_type=BreakoutType.FALSE_BREAKDOWN,
                    level=support,
                    confidence=0.6,
                    description=f"False breakdown at {support:.2f}",
                )

        return BreakoutResult()

    @staticmethod
    def detect_retest(
        prices: list[PriceBar],
        breakout_level: float,
        tolerance: float = 0.02,
    ) -> bool:
        if len(prices) < 3:
            return False
        recent = prices[-3:]
        for bar in recent:
            if abs(bar.low - breakout_level) / (breakout_level + 1e-10) < tolerance:
                return True
            if abs(bar.high - breakout_level) / (breakout_level + 1e-10) < tolerance:
                return True
        return False
