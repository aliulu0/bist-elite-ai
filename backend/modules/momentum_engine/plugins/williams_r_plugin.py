from __future__ import annotations

from modules.momentum_engine.core.base import BaseMomentumPlugin
from modules.momentum_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.momentum_engine.signals.signal_engine import SignalEngine
from modules.momentum_engine.calculators.slope_calculator import SlopeCalculator
from modules.momentum_engine.validators.momentum_validator import MomentumValidator


class WilliamsRPlugin(BaseMomentumPlugin):

    def __init__(self) -> None:
        self._signal_engine = SignalEngine()

    @property
    def name(self) -> str:
        return "williams_r"

    @property
    def display_name(self) -> str:
        return "Williams %R"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"period": 14}

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
            "period": {"type": "int", "default": 14, "min": 2, "max": 500},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = MomentumValidator.validate_prices(prices)
        period = params.get("period", 14)
        errors.extend(MomentumValidator.validate_period(period, "period"))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        period = params.get("period", 14)
        n = len(prices)
        dates = [p.date for p in prices]

        wr_values: list[float | None] = [None] * n
        for i in range(period - 1, n):
            window = prices[i - period + 1:i + 1]
            highest = max(p.high for p in window)
            lowest = min(p.low for p in window)
            if highest == lowest:
                wr_values[i] = -50.0
            else:
                wr_values[i] = ((highest - prices[i].close) / (highest - lowest)) * -100

        current = wr_values[-1]
        previous = wr_values[-2] if n >= 2 else None

        slope_data = SlopeCalculator.calculate(wr_values, n - 1)

        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current < -80:
                trend = TrendDirection.BULLISH
            elif current > -20:
                trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"period": period},
            values=wr_values,
            dates=dates,
            current_value=current,
            previous_value=previous,
            slope=slope_data["slope"],
            acceleration=slope_data["acceleration"],
            trend=trend,
        )

        if current is not None:
            if current < -80:
                result.warnings.append(f"Oversold: Williams %R={current:.1f}")
            elif current > -20:
                result.warnings.append(f"Overbought: Williams %R={current:.1f}")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_generic_signals(
            result, "Williams %R", overbought=-20, oversold=-80
        )

    def shutdown(self) -> None:
        pass
