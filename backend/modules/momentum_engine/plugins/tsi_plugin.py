from __future__ import annotations

from modules.momentum_engine.core.base import BaseMomentumPlugin
from modules.momentum_engine.core.types import (
    PriceBar, IndicatorResult, Signal, SignalType, TrendDirection,
)
from modules.momentum_engine.signals.signal_engine import SignalEngine
from modules.momentum_engine.calculators.smoothing_calculator import SmoothingCalculator
from modules.momentum_engine.calculators.slope_calculator import SlopeCalculator
from modules.momentum_engine.validators.momentum_validator import MomentumValidator


class TSIPlugin(BaseMomentumPlugin):

    def __init__(self) -> None:
        self._signal_engine = SignalEngine()

    @property
    def name(self) -> str:
        return "tsi"

    @property
    def display_name(self) -> str:
        return "True Strength Index"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"long_period": 25, "short_period": 13}

    def min_bars(self) -> int:
        return 50

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "momentum",
            "default_params": self.get_default_params(),
        }

    def parameters(self) -> dict:
        return {
            "long_period": {"type": "int", "default": 25, "min": 5, "max": 500},
            "short_period": {"type": "int", "default": 13, "min": 2, "max": 200},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = MomentumValidator.validate_prices(prices)
        errors.extend(MomentumValidator.validate_period(params.get("long_period", 25), "long_period"))
        errors.extend(MomentumValidator.validate_period(params.get("short_period", 13), "short_period"))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        long_period = params.get("long_period", 25)
        short_period = params.get("short_period", 13)
        closes = [p.close for p in prices]
        dates = [p.date for p in prices]
        n = len(closes)

        pc = [0.0] * n
        for i in range(1, n):
            pc[i] = closes[i] - closes[i - 1]

        abs_pc = [abs(v) for v in pc]

        double_smoothed = SmoothingCalculator.ema(
            [v for v in SmoothingCalculator.ema(pc, long_period) if v is not None],
            short_period,
        ) if n > long_period + short_period else [None] * n

        double_smoothed_abs = SmoothingCalculator.ema(
            [v for v in SmoothingCalculator.ema(abs_pc, long_period) if v is not None],
            short_period,
        ) if n > long_period + short_period else [None] * n

        tsi_values: list[float | None] = [None] * n
        offset = n - len(double_smoothed) if len(double_smoothed) < n else 0

        for i in range(len(double_smoothed)):
            idx = i + offset
            ds = double_smoothed[i]
            dsa = double_smoothed_abs[i]
            if ds is not None and dsa is not None and dsa != 0:
                tsi_values[idx] = (ds / dsa) * 100

        current = tsi_values[-1]
        previous = tsi_values[-2] if n >= 2 else None

        slope_data = SlopeCalculator.calculate(tsi_values, n - 1)

        trend = TrendDirection.NEUTRAL
        if current is not None:
            if current > 0:
                trend = TrendDirection.BULLISH
            elif current < 0:
                trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"long_period": long_period, "short_period": short_period},
            values=tsi_values,
            dates=dates,
            current_value=current,
            previous_value=previous,
            slope=slope_data["slope"],
            acceleration=slope_data["acceleration"],
            trend=trend,
        )

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_generic_signals(
            result, "TSI", overbought=25, oversold=-25
        )

    def shutdown(self) -> None:
        pass
