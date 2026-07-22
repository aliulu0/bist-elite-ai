from __future__ import annotations

from modules.volume_engine.core.base import BaseVolumePlugin
from modules.volume_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.volume_engine.signals.volume_signal_engine import VolumeSignalEngine
from modules.volume_engine.calculators.volume_calculator import VolumeCalculator
from modules.volume_engine.validators.volume_validator import VolumeValidator


class ChaikinPlugin(BaseVolumePlugin):

    def __init__(self) -> None:
        self._signal_engine = VolumeSignalEngine()

    @property
    def name(self) -> str:
        return "chaikin"

    @property
    def display_name(self) -> str:
        return "Chaikin Oscillator"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"fast_period": 3, "slow_period": 10}

    def min_bars(self) -> int:
        return 15

    def metadata(self) -> dict:
        return {
            "name": self.name, "display_name": self.display_name,
            "category": "volume", "default_params": self.get_default_params(),
        }

    def parameters(self) -> dict:
        return {
            "fast_period": {"type": "int", "default": 3, "min": 2, "max": 100},
            "slow_period": {"type": "int", "default": 10, "min": 2, "max": 200},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = VolumeValidator.validate_prices(prices)
        errors.extend(VolumeValidator.validate_period(params.get("fast_period", 3), "fast_period"))
        errors.extend(VolumeValidator.validate_period(params.get("slow_period", 10), "slow_period"))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        fast_p = params.get("fast_period", 3)
        slow_p = params.get("slow_period", 10)
        n = len(prices)
        dates = [p.date for p in prices]

        adl: list[float | None] = [None] * n
        if n > 0:
            adl[0] = 0.0
            for i in range(1, n):
                rng = prices[i].high - prices[i].low
                if rng > 0:
                    cfm = ((prices[i].close - prices[i].low) - (prices[i].high - prices[i].close)) / rng
                else:
                    cfm = 0.0
                adl[i] = (adl[i - 1] or 0.0) + cfm * prices[i].volume

        adl_float = [v if v is not None else 0.0 for v in adl]
        fast_ema = VolumeCalculator.ema(adl_float, fast_p)
        slow_ema = VolumeCalculator.ema(adl_float, slow_p)

        chaikin_values: list[float | None] = [None] * n
        for i in range(n):
            f = fast_ema[i]
            s = slow_ema[i]
            if f is not None and s is not None:
                chaikin_values[i] = f - s

        current = chaikin_values[-1]
        previous = chaikin_values[-2] if n >= 2 else None

        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current > 0:
                trend = TrendDirection.BULLISH
            elif current < 0:
                trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"fast_period": fast_p, "slow_period": slow_p},
            values=chaikin_values, dates=dates,
            current_value=current, previous_value=previous,
            trend=trend,
        )
        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_generic_volume_signals(
            result, "Chaikin",
        )

    def shutdown(self) -> None:
        pass
