from __future__ import annotations

from modules.momentum_engine.core.base import BaseMomentumPlugin
from modules.momentum_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.momentum_engine.signals.signal_engine import SignalEngine
from modules.momentum_engine.calculators.smoothing_calculator import SmoothingCalculator
from modules.momentum_engine.calculators.slope_calculator import SlopeCalculator
from modules.momentum_engine.validators.momentum_validator import MomentumValidator


class MACDPlugin(BaseMomentumPlugin):

    def __init__(self) -> None:
        self._signal_engine = SignalEngine()

    @property
    def name(self) -> str:
        return "macd"

    @property
    def display_name(self) -> str:
        return "MACD"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"fast_period": 12, "slow_period": 26, "signal_period": 9}

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
            "fast_period": {"type": "int", "default": 12, "min": 2, "max": 200},
            "slow_period": {"type": "int", "default": 26, "min": 5, "max": 500},
            "signal_period": {"type": "int", "default": 9, "min": 2, "max": 100},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = MomentumValidator.validate_prices(prices)
        fast = params.get("fast_period", 12)
        slow = params.get("slow_period", 26)
        signal = params.get("signal_period", 9)
        errors.extend(MomentumValidator.validate_period(fast, "fast_period"))
        errors.extend(MomentumValidator.validate_period(slow, "slow_period"))
        errors.extend(MomentumValidator.validate_period(signal, "signal_period"))
        if fast >= slow:
            errors.append("fast_period must be less than slow_period")
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        fast_period = params.get("fast_period", 12)
        slow_period = params.get("slow_period", 26)
        signal_period = params.get("signal_period", 9)

        closes = [p.close for p in prices]
        dates = [p.date for p in prices]
        n = len(closes)

        fast_ema = SmoothingCalculator.ema(closes, fast_period)
        slow_ema = SmoothingCalculator.ema(closes, slow_period)

        macd_line: list[float | None] = [None] * n
        for i in range(n):
            f = fast_ema[i]
            s = slow_ema[i]
            if f is not None and s is not None:
                macd_line[i] = f - s

        macd_valid = [v if v is not None else 0.0 for v in macd_line]
        signal_line = SmoothingCalculator.ema(macd_valid, signal_period)

        histogram: list[float | None] = [None] * n
        for i in range(n):
            m = macd_line[i]
            s = signal_line[i]
            if m is not None and s is not None:
                histogram[i] = m - s

        current_macd = macd_line[-1]
        current_signal = signal_line[-1]
        current_hist = histogram[-1]

        slope_data = SlopeCalculator.calculate(histogram, n - 1)

        trend = TrendDirection.NEUTRAL
        if current_hist is not None:
            if current_hist > 0:
                trend = TrendDirection.BULLISH
            elif current_hist < 0:
                trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"fast_period": fast_period, "slow_period": slow_period, "signal_period": signal_period},
            values=macd_line,
            dates=dates,
            current_value=current_macd,
            previous_value=macd_line[-2] if n >= 2 else None,
            slope=slope_data["slope"],
            acceleration=slope_data["acceleration"],
            trend=trend,
        )

        if current_hist is not None and current_hist > 0:
            result.warnings.append(f"Positive histogram: {current_hist:.4f}")
        elif current_hist is not None and current_hist < 0:
            result.warnings.append(f"Negative histogram: {current_hist:.4f}")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_macd_signals(result)

    def shutdown(self) -> None:
        pass
