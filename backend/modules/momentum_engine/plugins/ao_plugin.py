from __future__ import annotations

from modules.momentum_engine.core.base import BaseMomentumPlugin
from modules.momentum_engine.core.types import (
    PriceBar, IndicatorResult, Signal, SignalType, TrendDirection,
)
from modules.momentum_engine.signals.signal_engine import SignalEngine
from modules.momentum_engine.calculators.smoothing_calculator import SmoothingCalculator
from modules.momentum_engine.calculators.slope_calculator import SlopeCalculator
from modules.momentum_engine.validators.momentum_validator import MomentumValidator


class AwesomeOscillatorPlugin(BaseMomentumPlugin):

    def __init__(self) -> None:
        self._signal_engine = SignalEngine()

    @property
    def name(self) -> str:
        return "ao"

    @property
    def display_name(self) -> str:
        return "Awesome Oscillator"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"fast_period": 5, "slow_period": 34}

    def min_bars(self) -> int:
        return 40

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "momentum",
            "default_params": self.get_default_params(),
        }

    def parameters(self) -> dict:
        return {
            "fast_period": {"type": "int", "default": 5, "min": 2, "max": 100},
            "slow_period": {"type": "int", "default": 34, "min": 5, "max": 500},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = MomentumValidator.validate_prices(prices)
        errors.extend(MomentumValidator.validate_period(params.get("fast_period", 5), "fast_period"))
        errors.extend(MomentumValidator.validate_period(params.get("slow_period", 34), "slow_period"))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        fast_period = params.get("fast_period", 5)
        slow_period = params.get("slow_period", 34)
        n = len(prices)
        dates = [p.date for p in prices]

        median_prices = [(p.high + p.low) / 2 for p in prices]

        fast_sma = SmoothingCalculator.sma(median_prices, fast_period)
        slow_sma = SmoothingCalculator.sma(median_prices, slow_period)

        ao_values: list[float | None] = [None] * n
        for i in range(n):
            f = fast_sma[i]
            s = slow_sma[i]
            if f is not None and s is not None:
                ao_values[i] = f - s

        current = ao_values[-1]
        previous = ao_values[-2] if n >= 2 else None

        slope_data = SlopeCalculator.calculate(ao_values, n - 1)

        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current > 0:
                trend = TrendDirection.BULLISH
            elif current < 0:
                trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"fast_period": fast_period, "slow_period": slow_period},
            values=ao_values,
            dates=dates,
            current_value=current,
            previous_value=previous,
            slope=slope_data["slope"],
            acceleration=slope_data["acceleration"],
            trend=trend,
        )

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        prev = result.previous_value
        if v is None:
            return signals
        if prev is not None:
            if prev < 0 and v > 0:
                signals.append(Signal(
                    signal_type=SignalType.BUY,
                    indicator="AO",
                    confidence=0.7,
                    strength=min(1.0, abs(v) * 2),
                    description="AO bullish crossover",
                ))
            elif prev > 0 and v < 0:
                signals.append(Signal(
                    signal_type=SignalType.SELL,
                    indicator="AO",
                    confidence=0.7,
                    strength=min(1.0, abs(v) * 2),
                    description="AO bearish crossover",
                ))
        if not signals:
            if v > 0:
                signals.append(Signal(
                    signal_type=SignalType.BUY,
                    indicator="AO",
                    confidence=0.5,
                    strength=min(1.0, abs(v) * 2),
                    description=f"AO positive: {v:.4f}",
                ))
            elif v < 0:
                signals.append(Signal(
                    signal_type=SignalType.SELL,
                    indicator="AO",
                    confidence=0.5,
                    strength=min(1.0, abs(v) * 2),
                    description=f"AO negative: {v:.4f}",
                ))
            else:
                signals.append(Signal(
                    signal_type=SignalType.NEUTRAL,
                    indicator="AO",
                    confidence=0.5,
                    strength=0.0,
                    description="AO at zero",
                ))
        return signals

    def shutdown(self) -> None:
        pass
