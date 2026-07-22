from __future__ import annotations

from modules.volume_engine.core.base import BaseVolumePlugin
from modules.volume_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.volume_engine.signals.volume_signal_engine import VolumeSignalEngine
from modules.volume_engine.calculators.volume_calculator import VolumeCalculator
from modules.volume_engine.validators.volume_validator import VolumeValidator


class OBVPlugin(BaseVolumePlugin):

    def __init__(self) -> None:
        self._signal_engine = VolumeSignalEngine()

    @property
    def name(self) -> str:
        return "obv"

    @property
    def display_name(self) -> str:
        return "On Balance Volume"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {}

    def min_bars(self) -> int:
        return 5

    def metadata(self) -> dict:
        return {
            "name": self.name, "display_name": self.display_name,
            "category": "volume", "default_params": self.get_default_params(),
        }

    def parameters(self) -> dict:
        return {}

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return VolumeValidator.validate_prices(prices)

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        n = len(prices)
        dates = [p.date for p in prices]
        obv_values: list[float | None] = [None] * n

        if n == 0:
            return IndicatorResult(
                indicator=self.display_name, parameters={}, values=obv_values,
                dates=dates,
            )

        obv_values[0] = 0.0
        for i in range(1, n):
            prev_obv = obv_values[i - 1] or 0.0
            if prices[i].close > prices[i - 1].close:
                obv_values[i] = prev_obv + prices[i].volume
            elif prices[i].close < prices[i - 1].close:
                obv_values[i] = prev_obv - prices[i].volume
            else:
                obv_values[i] = prev_obv

        current = obv_values[-1]
        previous = obv_values[-2] if n >= 2 else None

        trend = TrendDirection.NEUTRAL
        if current is not None and previous is not None:
            if current > previous:
                trend = TrendDirection.BULLISH
            elif current < previous:
                trend = TrendDirection.BEARISH

        valid = [v for v in obv_values if v is not None]
        slope = None
        if len(valid) >= 2:
            diff = valid[-1] - valid[-2]
            slope = diff / abs(valid[-2]) if valid[-2] != 0 else diff

        result = IndicatorResult(
            indicator=self.display_name, parameters={},
            values=obv_values, dates=dates,
            current_value=current, previous_value=previous,
            slope=slope, trend=trend,
        )

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_obv_signals(result)

    def shutdown(self) -> None:
        pass
