from __future__ import annotations

from modules.momentum_engine.core.base import BaseMomentumPlugin
from modules.momentum_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.momentum_engine.signals.signal_engine import SignalEngine
from modules.momentum_engine.calculators.slope_calculator import SlopeCalculator
from modules.momentum_engine.validators.momentum_validator import MomentumValidator


class ROCPlugin(BaseMomentumPlugin):

    def __init__(self) -> None:
        self._signal_engine = SignalEngine()

    @property
    def name(self) -> str:
        return "roc"

    @property
    def display_name(self) -> str:
        return "Rate of Change"

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
            "period": {"type": "int", "default": 14, "min": 1, "max": 500},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = MomentumValidator.validate_prices(prices)
        period = params.get("period", 14)
        errors.extend(MomentumValidator.validate_period(period, "period"))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        period = params.get("period", 14)
        closes = [p.close for p in prices]
        dates = [p.date for p in prices]
        n = len(closes)

        roc_values: list[float | None] = [None] * n
        for i in range(period, n):
            if closes[i - period] != 0:
                roc_values[i] = ((closes[i] - closes[i - period]) / closes[i - period]) * 100
            else:
                roc_values[i] = 0.0

        current = roc_values[-1]
        previous = roc_values[-2] if n >= 2 else None

        slope_data = SlopeCalculator.calculate(roc_values, n - 1)

        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current > 0:
                trend = TrendDirection.BULLISH
            elif current < 0:
                trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"period": period},
            values=roc_values,
            dates=dates,
            current_value=current,
            previous_value=previous,
            slope=slope_data["slope"],
            acceleration=slope_data["acceleration"],
            trend=trend,
        )

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_generic_signals(
            result, "ROC", overbought=5, oversold=-5
        )

    def shutdown(self) -> None:
        pass
