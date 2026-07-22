from __future__ import annotations

from modules.volume_engine.core.base import BaseVolumePlugin
from modules.volume_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.volume_engine.signals.volume_signal_engine import VolumeSignalEngine
from modules.volume_engine.calculators.volume_calculator import VolumeCalculator
from modules.volume_engine.validators.volume_validator import VolumeValidator


class VolumeOscillatorPlugin(BaseVolumePlugin):

    def __init__(self) -> None:
        self._signal_engine = VolumeSignalEngine()

    @property
    def name(self) -> str:
        return "volume_oscillator"

    @property
    def display_name(self) -> str:
        return "Volume Oscillator"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"fast_period": 5, "slow_period": 20}

    def min_bars(self) -> int:
        return 25

    def metadata(self) -> dict:
        return {
            "name": self.name, "display_name": self.display_name,
            "category": "volume", "default_params": self.get_default_params(),
        }

    def parameters(self) -> dict:
        return {
            "fast_period": {"type": "int", "default": 5, "min": 2, "max": 100},
            "slow_period": {"type": "int", "default": 20, "min": 2, "max": 200},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = VolumeValidator.validate_prices(prices)
        errors.extend(VolumeValidator.validate_period(params.get("fast_period", 5), "fast_period"))
        errors.extend(VolumeValidator.validate_period(params.get("slow_period", 20), "slow_period"))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        fast_p = params.get("fast_period", 5)
        slow_p = params.get("slow_period", 20)
        n = len(prices)
        dates = [p.date for p in prices]
        volumes = [p.volume for p in prices]

        fast_sma = VolumeCalculator.sma(volumes, fast_p)
        slow_sma = VolumeCalculator.sma(volumes, slow_p)

        vo_values: list[float | None] = [None] * n
        for i in range(n):
            f = fast_sma[i]
            s = slow_sma[i]
            if f is not None and s is not None and s > 0:
                vo_values[i] = ((f - s) / s) * 100

        current = vo_values[-1]
        previous = vo_values[-2] if n >= 2 else None

        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current > 0:
                trend = TrendDirection.BULLISH
            elif current < 0:
                trend = TrendDirection.BEARISH

        return IndicatorResult(
            indicator=self.display_name,
            parameters={"fast_period": fast_p, "slow_period": slow_p},
            values=vo_values, dates=dates,
            current_value=current, previous_value=previous,
            trend=trend,
        )

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_generic_volume_signals(
            result, "VolumeOsc",
        )

    def shutdown(self) -> None:
        pass
