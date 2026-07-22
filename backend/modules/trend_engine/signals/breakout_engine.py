from __future__ import annotations

from modules.trend_engine.core.types import (
    PriceBar, IndicatorResult, BreakoutResult, BreakoutType,
    TrendDirection, Signal, SignalType,
)
from modules.trend_engine.calculators.breakout_calculator import BreakoutCalculator


class BreakoutEngine:

    def __init__(self) -> None:
        self._calculator = BreakoutCalculator()

    def detect(
        self,
        prices: list[PriceBar],
        result: IndicatorResult,
        lookback: int = 20,
    ) -> BreakoutResult:
        return self._calculator.detect_breakout(prices, result, lookback)

    def detect_retest(
        self,
        prices: list[PriceBar],
        breakout_level: float,
        tolerance: float = 0.02,
    ) -> bool:
        return self._calculator.detect_retest(prices, breakout_level, tolerance)

    def generate_signals(
        self, breakout: BreakoutResult
    ) -> list[Signal]:
        signals: list[Signal] = []
        if breakout.breakout_type == BreakoutType.RESISTANCE_BREAKOUT:
            signals.append(Signal(
                signal_type=SignalType.BUY if breakout.confirmed else SignalType.WAIT,
                indicator="Breakout",
                confidence=breakout.confidence,
                strength=breakout.confidence,
                description=breakout.description,
            ))
        elif breakout.breakout_type == BreakoutType.SUPPORT_BREAKDOWN:
            signals.append(Signal(
                signal_type=SignalType.SELL if breakout.confirmed else SignalType.WAIT,
                indicator="Breakout",
                confidence=breakout.confidence,
                strength=breakout.confidence,
                description=breakout.description,
            ))
        elif breakout.breakout_type == BreakoutType.FAKE_BREAKOUT:
            signals.append(Signal(
                signal_type=SignalType.SELL,
                indicator="Breakout",
                confidence=breakout.confidence,
                strength=breakout.confidence * 0.5,
                description=breakout.description,
            ))
        elif breakout.breakout_type == BreakoutType.FALSE_BREAKDOWN:
            signals.append(Signal(
                signal_type=SignalType.BUY,
                indicator="Breakout",
                confidence=breakout.confidence,
                strength=breakout.confidence * 0.5,
                description=breakout.description,
            ))
        return signals
