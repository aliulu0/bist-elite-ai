from __future__ import annotations

from modules.momentum_engine.core.base import BaseMomentumPlugin
from modules.momentum_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.momentum_engine.signals.signal_engine import SignalEngine
from modules.momentum_engine.calculators.smoothing_calculator import SmoothingCalculator
from modules.momentum_engine.calculators.slope_calculator import SlopeCalculator
from modules.momentum_engine.validators.momentum_validator import MomentumValidator


class CCIPlugin(BaseMomentumPlugin):

    def __init__(self) -> None:
        self._signal_engine = SignalEngine()

    @property
    def name(self) -> str:
        return "cci"

    @property
    def display_name(self) -> str:
        return "Commodity Channel Index"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"period": 20}

    def min_bars(self) -> int:
        return 30

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "momentum",
            "default_params": self.get_default_params(),
        }

    def parameters(self) -> dict:
        return {
            "period": {"type": "int", "default": 20, "min": 5, "max": 500},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = MomentumValidator.validate_prices(prices)
        period = params.get("period", 20)
        errors.extend(MomentumValidator.validate_period(period, "period"))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        period = params.get("period", 20)
        n = len(prices)
        dates = [p.date for p in prices]

        tp = [(p.high + p.low + p.close) / 3 for p in prices]
        sma_tp = SmoothingCalculator.sma(tp, period)

        cci_values: list[float | None] = [None] * n
        for i in range(period - 1, n):
            mean = sma_tp[i]
            if mean is None:
                continue
            window = tp[i - period + 1:i + 1]
            mad = sum(abs(v - mean) for v in window) / period
            if mad == 0:
                cci_values[i] = 0.0
            else:
                cci_values[i] = (tp[i] - mean) / (0.015 * mad)

        current = cci_values[-1]
        previous = cci_values[-2] if n >= 2 else None

        slope_data = SlopeCalculator.calculate(cci_values, n - 1)

        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current > 100:
                trend = TrendDirection.BULLISH
            elif current < -100:
                trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"period": period},
            values=cci_values,
            dates=dates,
            current_value=current,
            previous_value=previous,
            slope=slope_data["slope"],
            acceleration=slope_data["acceleration"],
            trend=trend,
        )

        if current is not None:
            if current > 200:
                result.warnings.append(f"Extremely overbought: CCI={current:.1f}")
            elif current < -200:
                result.warnings.append(f"Extremely oversold: CCI={current:.1f}")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_generic_signals(
            result, "CCI", overbought=100, oversold=-100
        )

    def shutdown(self) -> None:
        pass
