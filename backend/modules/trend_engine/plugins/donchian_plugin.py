from __future__ import annotations

from modules.trend_engine.core.base import BaseTrendPlugin
from modules.trend_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.trend_engine.signals.trend_signal_engine import TrendSignalEngine
from modules.trend_engine.calculators.trend_calculator import TrendCalculator
from modules.trend_engine.validators.trend_validator import TrendValidator


class DonchianPlugin(BaseTrendPlugin):

    def __init__(self) -> None:
        self._signal_engine = TrendSignalEngine()

    @property
    def name(self) -> str:
        return "donchian"

    @property
    def display_name(self) -> str:
        return "Donchian Channel"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"period": 20}

    def min_bars(self) -> int:
        return 25

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "trend",
            "default_params": self.get_default_params(),
            "output_fields": [
                "current_value", "trend", "upper_channel", "lower_channel",
                "middle_channel", "breakout", "breakdown",
            ],
        }

    def parameters(self) -> dict:
        return {
            "period": {"type": "int", "default": 20, "min": 2, "max": 200},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = TrendValidator.validate_prices(prices)
        period = params.get("period", 20)
        errors.extend(TrendValidator.validate_period(period, "period"))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        period = params.get("period", 20)
        n = len(prices)
        dates = [p.date for p in prices]

        upper: list[float | None] = [None] * n
        lower: list[float | None] = [None] * n
        middle: list[float | None] = [None] * n

        for i in range(period - 1, n):
            window = prices[i - period + 1:i + 1]
            upper[i] = max(p.high for p in window)
            lower[i] = min(p.low for p in window)
            middle[i] = (upper[i] + lower[i]) / 2

        channel_width: list[float | None] = [None] * n
        for i in range(n):
            if upper[i] is not None and lower[i] is not None:
                mid = middle[i] if middle[i] else 1e-10
                channel_width[i] = (upper[i] - lower[i]) / (abs(mid) + 1e-10)

        current_close = prices[-1].close
        current_upper = upper[-1]
        current_lower = lower[-1]
        current_middle = middle[-1]

        norm_val = 0.0
        if current_upper is not None and current_lower is not None:
            spread = current_upper - current_lower
            if spread > 0:
                norm_val = 2 * (current_close - current_lower) / spread - 1

        trend = TrendDirection.NEUTRAL
        if current_close > (current_middle or 0):
            trend = TrendDirection.BULLISH
        elif current_close < (current_middle or 0):
            trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"period": period},
            values=channel_width,
            dates=dates,
            current_value=norm_val,
            previous_value=None,
            slope=TrendCalculator.first_derivative(channel_width, n - 1),
            trend=trend,
        )

        if n >= 2:
            prev_upper = upper[-2]
            prev_close = prices[-2].close
            if prev_upper is not None and current_close > prev_upper:
                result.warnings.append(f"Channel breakout above {prev_upper:.2f}")
            prev_lower = lower[-2]
            if prev_lower is not None and current_close < prev_lower:
                result.warnings.append(f"Channel breakdown below {prev_lower:.2f}")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_donchian_signals(result)

    def shutdown(self) -> None:
        pass
