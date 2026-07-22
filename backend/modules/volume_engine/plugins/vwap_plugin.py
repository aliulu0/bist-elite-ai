from __future__ import annotations

from modules.volume_engine.core.base import BaseVolumePlugin
from modules.volume_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.volume_engine.signals.volume_signal_engine import VolumeSignalEngine
from modules.volume_engine.calculators.volume_calculator import VolumeCalculator
from modules.volume_engine.validators.volume_validator import VolumeValidator


class VWAPPlugin(BaseVolumePlugin):

    def __init__(self) -> None:
        self._signal_engine = VolumeSignalEngine()

    @property
    def name(self) -> str:
        return "vwap"

    @property
    def display_name(self) -> str:
        return "Volume Weighted Average Price"

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

        vwap_values = VolumeCalculator.volume_weighted_average(prices)

        current = vwap_values[-1]
        previous = vwap_values[-2] if n >= 2 else None
        current_close = prices[-1].close

        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current_close > current:
                trend = TrendDirection.BULLISH
            elif current_close < current:
                trend = TrendDirection.BEARISH

        slope = None
        if current is not None and previous is not None and previous != 0:
            slope = (current - previous) / abs(previous)

        result = IndicatorResult(
            indicator=self.display_name, parameters={},
            values=vwap_values, dates=dates,
            current_value=current, previous_value=previous,
            slope=slope, trend=trend,
        )

        if current is not None:
            deviation = (current_close - current) / current if current != 0 else 0
            if abs(deviation) > 0.02:
                result.warnings.append(f"Price {'above' if deviation > 0 else 'below'} VWAP by {abs(deviation):.1%}")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_vwap_signals(result)

    def shutdown(self) -> None:
        pass
