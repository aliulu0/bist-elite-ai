from __future__ import annotations

from modules.momentum_engine.core.base import BaseMomentumPlugin
from modules.momentum_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.momentum_engine.signals.signal_engine import SignalEngine
from modules.momentum_engine.calculators.smoothing_calculator import SmoothingCalculator
from modules.momentum_engine.calculators.slope_calculator import SlopeCalculator
from modules.momentum_engine.validators.momentum_validator import MomentumValidator


class RSIPlugin(BaseMomentumPlugin):

    def __init__(self) -> None:
        self._signal_engine = SignalEngine()
        self._params: dict = {}

    @property
    def name(self) -> str:
        return "rsi"

    @property
    def display_name(self) -> str:
        return "Relative Strength Index"

    def initialize(self, **kwargs) -> None:
        self._params = kwargs

    def get_default_params(self) -> dict:
        return {"period": 14}

    def min_bars(self) -> int:
        return 50

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "momentum",
            "default_params": self.get_default_params(),
            "output_fields": [
                "current_value", "previous_value", "slope",
                "acceleration", "trend", "overbought", "oversold",
            ],
        }

    def parameters(self) -> dict:
        return {
            "period": {"type": "int", "default": 14, "min": 2, "max": 500, "description": "RSI lookback period"},
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

        gains = [0.0] * n
        losses = [0.0] * n
        for i in range(1, n):
            diff = closes[i] - closes[i - 1]
            if diff > 0:
                gains[i] = diff
            else:
                losses[i] = abs(diff)

        avg_gains = SmoothingCalculator.wilder_smoothing(gains, period)
        avg_losses = SmoothingCalculator.wilder_smoothing(losses, period)

        rsi_values: list[float | None] = [None] * n
        for i in range(n):
            ag = avg_gains[i]
            al = avg_losses[i]
            if ag is not None and al is not None:
                if al == 0:
                    rsi_values[i] = 100.0
                else:
                    rs = ag / al
                    rsi_values[i] = 100.0 - (100.0 / (1.0 + rs))

        current = rsi_values[-1]
        previous = rsi_values[-2] if n >= 2 else None

        slope_data = SlopeCalculator.calculate(rsi_values, n - 1)
        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current > 50 and slope_data["slope"] and slope_data["slope"] > 0:
                trend = TrendDirection.BULLISH
            elif current < 50 and slope_data["slope"] and slope_data["slope"] < 0:
                trend = TrendDirection.BEARISH

        overbought = current is not None and current > 70
        oversold = current is not None and current < 30

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"period": period},
            values=rsi_values,
            dates=dates,
            current_value=current,
            previous_value=previous,
            slope=slope_data["slope"],
            acceleration=slope_data["acceleration"],
            trend=trend,
        )

        if overbought:
            result.warnings.append("Overbought zone (>70)")
        if oversold:
            result.warnings.append("Oversold zone (<30)")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_rsi_signals(result)

    def shutdown(self) -> None:
        pass
