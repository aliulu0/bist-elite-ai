from __future__ import annotations

from modules.momentum_engine.core.base import BaseMomentumPlugin
from modules.momentum_engine.core.types import (
    PriceBar, IndicatorResult, Signal, SignalType, TrendDirection,
)
from modules.momentum_engine.signals.signal_engine import SignalEngine
from modules.momentum_engine.calculators.slope_calculator import SlopeCalculator
from modules.momentum_engine.validators.momentum_validator import MomentumValidator


class MomentumPlugin(BaseMomentumPlugin):

    def __init__(self) -> None:
        self._signal_engine = SignalEngine()

    @property
    def name(self) -> str:
        return "momentum"

    @property
    def display_name(self) -> str:
        return "Momentum"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"period": 10}

    def min_bars(self) -> int:
        return 30

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "momentum",
            "default_params": self.get_default_params(),
        }

    def parameters(self) -> dict:
        return {
            "period": {"type": "int", "default": 10, "min": 1, "max": 500},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = MomentumValidator.validate_prices(prices)
        period = params.get("period", 10)
        errors.extend(MomentumValidator.validate_period(period, "period"))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        period = params.get("period", 10)
        closes = [p.close for p in prices]
        dates = [p.date for p in prices]
        n = len(closes)

        mom_values: list[float | None] = [None] * n
        for i in range(period, n):
            mom_values[i] = closes[i] - closes[i - period]

        current = mom_values[-1]
        previous = mom_values[-2] if n >= 2 else None

        slope_data = SlopeCalculator.calculate(mom_values, n - 1)

        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current > 0:
                trend = TrendDirection.BULLISH
            elif current < 0:
                trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"period": period},
            values=mom_values,
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
        if v is None:
            return signals
        if v > 0:
            signals.append(Signal(
                signal_type=SignalType.BUY,
                indicator="Momentum",
                confidence=0.6,
                strength=min(1.0, abs(v) / 10),
                description=f"Positive momentum: {v:.2f}",
            ))
        elif v < 0:
            signals.append(Signal(
                signal_type=SignalType.SELL,
                indicator="Momentum",
                confidence=0.6,
                strength=min(1.0, abs(v) / 10),
                description=f"Negative momentum: {v:.2f}",
            ))
        else:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL,
                indicator="Momentum",
                confidence=0.5,
                strength=0.0,
                description="Zero momentum",
            ))
        return signals

    def shutdown(self) -> None:
        pass
