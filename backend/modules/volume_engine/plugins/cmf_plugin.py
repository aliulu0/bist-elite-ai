from __future__ import annotations

from modules.volume_engine.core.base import BaseVolumePlugin
from modules.volume_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.volume_engine.signals.volume_signal_engine import VolumeSignalEngine
from modules.volume_engine.calculators.volume_calculator import VolumeCalculator
from modules.volume_engine.validators.volume_validator import VolumeValidator


class CMFPlugin(BaseVolumePlugin):

    def __init__(self) -> None:
        self._signal_engine = VolumeSignalEngine()

    @property
    def name(self) -> str:
        return "cmf"

    @property
    def display_name(self) -> str:
        return "Chaikin Money Flow"

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

        mfv: list[float] = [0.0] * n
        for i in range(n):
            rng = prices[i].high - prices[i].low
            if rng > 0:
                mfm = ((prices[i].close - prices[i].low) - (prices[i].high - prices[i].close)) / rng
            else:
                mfm = 0.0
            mfv[i] = mfm * prices[i].volume

        cmf_values: list[float | None] = [None] * n
        for i in range(period - 1, n):
            vol_sum = sum(prices[j].volume for j in range(i - period + 1, i + 1))
            if vol_sum > 0:
                cmf_values[i] = sum(mfv[j] for j in range(i - period + 1, i + 1)) / vol_sum
            else:
                cmf_values[i] = 0.0

        current = cmf_values[-1]
        previous = cmf_values[-2] if n >= 2 else None

        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current > 0.05:
                trend = TrendDirection.BULLISH
            elif current < -0.05:
                trend = TrendDirection.BEARISH

        slope = None
        if current is not None and previous is not None:
            slope = current - previous

        result = IndicatorResult(
            indicator=self.display_name, parameters={"period": period},
            values=cmf_values, dates=dates,
            current_value=current, previous_value=previous,
            slope=slope, trend=trend,
        )
        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_cmf_signals(result)

    def shutdown(self) -> None:
        pass
