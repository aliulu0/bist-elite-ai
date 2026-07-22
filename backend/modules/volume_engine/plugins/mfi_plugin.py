from __future__ import annotations

from modules.volume_engine.core.base import BaseVolumePlugin
from modules.volume_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.volume_engine.signals.volume_signal_engine import VolumeSignalEngine
from modules.volume_engine.calculators.volume_calculator import VolumeCalculator
from modules.volume_engine.validators.volume_validator import VolumeValidator


class MFIPlugin(BaseVolumePlugin):

    def __init__(self) -> None:
        self._signal_engine = VolumeSignalEngine()

    @property
    def name(self) -> str:
        return "mfi"

    @property
    def display_name(self) -> str:
        return "Money Flow Index"

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

        tp = [(p.high + p.low + p.close) / 3 for p in prices]
        raw_mf = [tp[i] * prices[i].volume for i in range(n)]

        mfi_values: list[float | None] = [None] * n
        for i in range(period, n):
            pos_mf = 0.0
            neg_mf = 0.0
            for j in range(i - period + 1, i + 1):
                if j > 0 and tp[j] > tp[j - 1]:
                    pos_mf += raw_mf[j]
                elif j > 0:
                    neg_mf += raw_mf[j]
            if neg_mf == 0:
                mfi_values[i] = 100.0
            else:
                mf_ratio = pos_mf / neg_mf
                mfi_values[i] = 100.0 - (100.0 / (1.0 + mf_ratio))

        current = mfi_values[-1]
        previous = mfi_values[-2] if n >= 2 else None

        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current > 50:
                trend = TrendDirection.BULLISH
            elif current < 50:
                trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name, parameters={"period": period},
            values=mfi_values, dates=dates,
            current_value=current, previous_value=previous,
            trend=trend,
        )

        if current is not None:
            if current > 80:
                result.warnings.append(f"MFI overbought: {current:.1f}")
            elif current < 20:
                result.warnings.append(f"MFI oversold: {current:.1f}")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_mfi_signals(result)

    def shutdown(self) -> None:
        pass
