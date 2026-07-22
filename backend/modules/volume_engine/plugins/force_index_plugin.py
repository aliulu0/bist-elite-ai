from __future__ import annotations

from modules.volume_engine.core.base import BaseVolumePlugin
from modules.volume_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.volume_engine.signals.volume_signal_engine import VolumeSignalEngine
from modules.volume_engine.calculators.volume_calculator import VolumeCalculator
from modules.volume_engine.validators.volume_validator import VolumeValidator


class ForceIndexPlugin(BaseVolumePlugin):

    def __init__(self) -> None:
        self._signal_engine = VolumeSignalEngine()

    @property
    def name(self) -> str:
        return "force_index"

    @property
    def display_name(self) -> str:
        return "Force Index"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"period": 13}

    def min_bars(self) -> int:
        return 20

    def metadata(self) -> dict:
        return {
            "name": self.name, "display_name": self.display_name,
            "category": "volume", "default_params": self.get_default_params(),
        }

    def parameters(self) -> dict:
        return {"period": {"type": "int", "default": 13, "min": 2, "max": 200}}

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = VolumeValidator.validate_prices(prices)
        errors.extend(VolumeValidator.validate_period(params.get("period", 13)))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        period = params.get("period", 13)
        n = len(prices)
        dates = [p.date for p in prices]

        raw_fi: list[float] = [0.0] * n
        for i in range(1, n):
            change = prices[i].close - prices[i - 1].close
            raw_fi[i] = change * prices[i].volume

        fi_values = VolumeCalculator.ema(raw_fi, period)

        current = fi_values[-1]
        previous = fi_values[-2] if n >= 2 else None

        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current > 0:
                trend = TrendDirection.BULLISH
            elif current < 0:
                trend = TrendDirection.BEARISH

        slope = None
        if current is not None and previous is not None and previous != 0:
            slope = (current - previous) / abs(previous)

        return IndicatorResult(
            indicator=self.display_name, parameters={"period": period},
            values=fi_values, dates=dates,
            current_value=current, previous_value=previous,
            slope=slope, trend=trend,
        )

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_generic_volume_signals(
            result, "ForceIndex",
        )

    def shutdown(self) -> None:
        pass
