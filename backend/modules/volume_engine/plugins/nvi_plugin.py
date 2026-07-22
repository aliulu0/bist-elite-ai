from __future__ import annotations

from modules.volume_engine.core.base import BaseVolumePlugin
from modules.volume_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.volume_engine.signals.volume_signal_engine import VolumeSignalEngine
from modules.volume_engine.validators.volume_validator import VolumeValidator


class NVIPlugin(BaseVolumePlugin):

    def __init__(self) -> None:
        self._signal_engine = VolumeSignalEngine()

    @property
    def name(self) -> str:
        return "nvi"

    @property
    def display_name(self) -> str:
        return "Negative Volume Index"

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
        nvi_values: list[float | None] = [None] * n

        if n == 0:
            return IndicatorResult(
                indicator=self.display_name, parameters={}, values=nvi_values, dates=dates,
            )

        nvi_values[0] = 1000.0
        for i in range(1, n):
            prev_nvi = nvi_values[i - 1] or 1000.0
            if prices[i].volume < prices[i - 1].volume:
                pct_change = (prices[i].close - prices[i - 1].close) / prices[i - 1].close if prices[i - 1].close != 0 else 0
                nvi_values[i] = prev_nvi + pct_change * prev_nvi
            else:
                nvi_values[i] = prev_nvi

        current = nvi_values[-1]
        previous = nvi_values[-2] if n >= 2 else None

        trend = TrendDirection.NEUTRAL
        if current is not None and previous is not None:
            if current > previous:
                trend = TrendDirection.BULLISH
            elif current < previous:
                trend = TrendDirection.BEARISH

        slope = None
        if current is not None and previous is not None and previous != 0:
            slope = (current - previous) / abs(previous)

        result = IndicatorResult(
            indicator=self.display_name, parameters={},
            values=nvi_values, dates=dates,
            current_value=current, previous_value=previous,
            slope=slope, trend=trend,
        )
        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_generic_volume_signals(
            result, "NVI",
        )

    def shutdown(self) -> None:
        pass
