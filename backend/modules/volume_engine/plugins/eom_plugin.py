from __future__ import annotations

from modules.volume_engine.core.base import BaseVolumePlugin
from modules.volume_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.volume_engine.signals.volume_signal_engine import VolumeSignalEngine
from modules.volume_engine.calculators.volume_calculator import VolumeCalculator
from modules.volume_engine.validators.volume_validator import VolumeValidator


class EoMPlugin(BaseVolumePlugin):

    def __init__(self) -> None:
        self._signal_engine = VolumeSignalEngine()

    @property
    def name(self) -> str:
        return "eom"

    @property
    def display_name(self) -> str:
        return "Ease of Movement"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"period": 14}

    def min_bars(self) -> int:
        return 20

    def metadata(self) -> dict:
        return {
            "name": self.name, "display_name": self.display_name,
            "category": "volume", "default_params": self.get_default_params(),
        }

    def parameters(self) -> dict:
        return {"period": {"type": "int", "default": 14, "min": 2, "max": 200}}

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = VolumeValidator.validate_prices(prices)
        errors.extend(VolumeValidator.validate_period(params.get("period", 14)))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        period = params.get("period", 14)
        n = len(prices)
        dates = [p.date for p in prices]

        raw_eom: list[float] = [0.0] * n
        for i in range(1, n):
            dist_moved = ((prices[i].high + prices[i].low) / 2) - ((prices[i - 1].high + prices[i - 1].low) / 2)
            box_ratio = (prices[i].volume / 1_000_000) / max(prices[i].high - prices[i].low, 1e-10)
            raw_eom[i] = dist_moved / box_ratio if box_ratio != 0 else 0.0

        eom_values = VolumeCalculator.sma(raw_eom, period)

        current = eom_values[-1]
        previous = eom_values[-2] if n >= 2 else None

        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current > 0:
                trend = TrendDirection.BULLISH
            elif current < 0:
                trend = TrendDirection.BEARISH

        return IndicatorResult(
            indicator=self.display_name, parameters={"period": period},
            values=eom_values, dates=dates,
            current_value=current, previous_value=previous,
            trend=trend,
        )

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_generic_volume_signals(
            result, "EoM",
        )

    def shutdown(self) -> None:
        pass
