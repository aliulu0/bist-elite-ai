from __future__ import annotations

from modules.trend_engine.core.types import (
    PriceBar, IndicatorResult, PullbackResult, PullbackType,
    TrendDirection, Signal, SignalType,
)
from modules.trend_engine.calculators.pullback_calculator import PullbackCalculator


class PullbackEngine:

    def __init__(self) -> None:
        self._calculator = PullbackCalculator()

    def detect(
        self,
        prices: list[PriceBar],
        result: IndicatorResult,
        lookback: int = 20,
    ) -> PullbackResult:
        return self._calculator.detect_pullback(prices, result, lookback)

    def is_trend_resuming(
        self,
        prices: list[PriceBar],
        result: IndicatorResult,
        pullback: PullbackResult,
    ) -> bool:
        return self._calculator.is_trend_resuming(prices, result, pullback)

    def generate_signals(
        self, pullback: PullbackResult, result: IndicatorResult
    ) -> list[Signal]:
        signals: list[Signal] = []

        if pullback.pullback_type == PullbackType.HEALTHY:
            if result.trend == TrendDirection.BULLISH:
                signals.append(Signal(
                    signal_type=SignalType.BUY,
                    indicator="Pullback",
                    confidence=0.7,
                    strength=pullback.recovery,
                    description=f"Healthy pullback in uptrend: {pullback.depth:.1%}",
                ))
            elif result.trend == TrendDirection.BEARISH:
                signals.append(Signal(
                    signal_type=SignalType.SELL,
                    indicator="Pullback",
                    confidence=0.7,
                    strength=pullback.recovery,
                    description=f"Healthy bounce in downtrend: {pullback.depth:.1%}",
                ))
        elif pullback.pullback_type == PullbackType.WEAK:
            signals.append(Signal(
                signal_type=SignalType.WAIT,
                indicator="Pullback",
                confidence=0.5,
                strength=pullback.depth,
                description=f"Weak pullback: {pullback.depth:.1%}",
            ))
        elif pullback.pullback_type == PullbackType.DEEP:
            signals.append(Signal(
                signal_type=SignalType.WAIT,
                indicator="Pullback",
                confidence=0.4,
                strength=pullback.depth,
                description=f"Deep pullback: {pullback.depth:.1%} - caution",
            ))
        return signals
