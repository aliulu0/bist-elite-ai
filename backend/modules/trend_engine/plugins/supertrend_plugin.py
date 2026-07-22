from __future__ import annotations

from modules.trend_engine.core.base import BaseTrendPlugin
from modules.trend_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.trend_engine.signals.trend_signal_engine import TrendSignalEngine
from modules.trend_engine.calculators.trend_calculator import TrendCalculator
from modules.trend_engine.validators.trend_validator import TrendValidator


class SuperTrendPlugin(BaseTrendPlugin):

    def __init__(self) -> None:
        self._signal_engine = TrendSignalEngine()

    @property
    def name(self) -> str:
        return "supertrend"

    @property
    def display_name(self) -> str:
        return "SuperTrend"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"period": 10, "multiplier": 3.0}

    def min_bars(self) -> int:
        return 30

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "trend",
            "default_params": self.get_default_params(),
            "output_fields": [
                "current_value", "previous_value", "slope",
                "trend", "supertrend_direction", "stop_level",
            ],
        }

    def parameters(self) -> dict:
        return {
            "period": {"type": "int", "default": 10, "min": 2, "max": 200},
            "multiplier": {"type": "float", "default": 3.0, "min": 0.5, "max": 10.0},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = TrendValidator.validate_prices(prices)
        period = params.get("period", 10)
        errors.extend(TrendValidator.validate_period(period, "period"))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        period = params.get("period", 10)
        multiplier = params.get("multiplier", 3.0)
        n = len(prices)
        dates = [p.date for p in prices]

        atr = TrendCalculator.atr(prices, period)

        hl2 = [(p.high + p.low) / 2 for p in prices]

        upper_band: list[float | None] = [None] * n
        lower_band: list[float | None] = [None] * n
        for i in range(n):
            if atr[i] is not None:
                upper_band[i] = hl2[i] + multiplier * atr[i]
                lower_band[i] = hl2[i] - multiplier * atr[i]

        st_values: list[float | None] = [None] * n
        direction: list[float | None] = [None] * n

        for i in range(n):
            if upper_band[i] is None or lower_band[i] is None:
                continue

            prev_st = st_values[i - 1] if i > 0 and st_values[i - 1] is not None else None
            prev_dir = direction[i - 1] if i > 0 and direction[i - 1] is not None else None

            if prev_st is not None:
                if prev_dir == 1.0:
                    lower_band[i] = max(lower_band[i], prev_st) if lower_band[i] is not None else prev_st
                elif prev_dir == -1.0:
                    upper_band[i] = min(upper_band[i], prev_st) if upper_band[i] is not None else prev_st

            if prev_dir is None or prev_dir == -1.0:
                if prices[i].close > upper_band[i]:
                    direction[i] = 1.0
                    st_values[i] = lower_band[i]
                else:
                    direction[i] = -1.0
                    st_values[i] = upper_band[i]
            else:
                if prices[i].close < lower_band[i]:
                    direction[i] = -1.0
                    st_values[i] = upper_band[i]
                else:
                    direction[i] = 1.0
                    st_values[i] = lower_band[i]

        current_dir = direction[-1]
        prev_dir = direction[-2] if n >= 2 else None
        current = st_values[-1]
        previous = st_values[-2] if n >= 2 else None

        if current_dir is not None:
            diff = prices[-1].close - current
        else:
            diff = 0.0

        trend = TrendDirection.NEUTRAL
        if current_dir == 1.0:
            trend = TrendDirection.BULLISH
        elif current_dir == -1.0:
            trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"period": period, "multiplier": multiplier},
            values=st_values,
            dates=dates,
            current_value=diff,
            previous_value=prices[-2].close - previous if n >= 2 and previous is not None else None,
            slope=TrendCalculator.first_derivative([d if d is not None else 0.0 for d in direction], n - 1),
            trend=trend,
        )

        if current_dir is not None and prev_dir is not None and current_dir != prev_dir:
            flip = "bullish" if current_dir == 1.0 else "bearish"
            result.warnings.append(f"SuperTrend flipped {flip}")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_supertrend_signals(result)

    def shutdown(self) -> None:
        pass
