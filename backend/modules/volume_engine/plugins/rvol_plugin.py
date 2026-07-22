from __future__ import annotations

from modules.volume_engine.core.base import BaseVolumePlugin
from modules.volume_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.volume_engine.signals.volume_signal_engine import VolumeSignalEngine
from modules.volume_engine.calculators.volume_calculator import VolumeCalculator
from modules.volume_engine.validators.volume_validator import VolumeValidator


class RVOLPlugin(BaseVolumePlugin):

    def __init__(self) -> None:
        self._signal_engine = VolumeSignalEngine()

    @property
    def name(self) -> str:
        return "rvol"

    @property
    def display_name(self) -> str:
        return "Relative Volume"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"period": 20}

    def min_bars(self) -> int:
        return 25

    def metadata(self) -> dict:
        return {
            "name": self.name, "display_name": self.display_name,
            "category": "volume", "default_params": self.get_default_params(),
        }

    def parameters(self) -> dict:
        return {"period": {"type": "int", "default": 20, "min": 2, "max": 200}}

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = VolumeValidator.validate_prices(prices)
        errors.extend(VolumeValidator.validate_period(params.get("period", 20)))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        period = params.get("period", 20)
        n = len(prices)
        dates = [p.date for p in prices]

        rvol_values = VolumeCalculator.relative_volume(prices, period)

        current = rvol_values[-1]
        previous = rvol_values[-2] if n >= 2 else None

        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current > 1.5:
                trend = TrendDirection.BULLISH
            elif current < 0.5:
                trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name, parameters={"period": period},
            values=rvol_values, dates=dates,
            current_value=current, previous_value=previous,
            trend=trend,
        )

        if current is not None:
            if current > 3.0:
                result.warnings.append(f"Extreme volume: {current:.2f}x average")
            elif current > 2.0:
                result.warnings.append(f"High volume: {current:.2f}x average")
            elif current < 0.3:
                result.warnings.append(f"Very low volume: {current:.2f}x average")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_rvol_signals(result)

    def shutdown(self) -> None:
        pass
