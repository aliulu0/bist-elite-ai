from __future__ import annotations

import math
from modules.momentum_engine.core.base import BaseMomentumPlugin
from modules.momentum_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.momentum_engine.signals.signal_engine import SignalEngine
from modules.momentum_engine.calculators.smoothing_calculator import SmoothingCalculator
from modules.momentum_engine.calculators.slope_calculator import SlopeCalculator
from modules.momentum_engine.validators.momentum_validator import MomentumValidator


class ADXPlugin(BaseMomentumPlugin):

    def __init__(self) -> None:
        self._signal_engine = SignalEngine()

    @property
    def name(self) -> str:
        return "adx"

    @property
    def display_name(self) -> str:
        return "Average Directional Index"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"period": 14}

    def min_bars(self) -> int:
        return 30

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "trend",
            "default_params": self.get_default_params(),
        }

    def parameters(self) -> dict:
        return {
            "period": {"type": "int", "default": 14, "min": 2, "max": 500},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = MomentumValidator.validate_prices(prices)
        period = params.get("period", 14)
        errors.extend(MomentumValidator.validate_period(period, "period"))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        period = params.get("period", 14)
        n = len(prices)
        dates = [p.date for p in prices]

        tr_list = [0.0] * n
        plus_dm = [0.0] * n
        minus_dm = [0.0] * n

        for i in range(1, n):
            h, l, pc = prices[i].high, prices[i].low, prices[i - 1].close
            tr_list[i] = max(h - l, abs(h - pc), abs(l - pc))
            up = prices[i].high - prices[i - 1].high
            down = prices[i - 1].low - prices[i].low
            if up > down and up > 0:
                plus_dm[i] = up
            if down > up and down > 0:
                minus_dm[i] = down

        atr = SmoothingCalculator.wilder_smoothing(tr_list, period)
        smooth_plus = SmoothingCalculator.wilder_smoothing(plus_dm, period)
        smooth_minus = SmoothingCalculator.wilder_smoothing(minus_dm, period)

        plus_di = [None] * n
        minus_di = [None] * n
        dx = [None] * n

        for i in range(n):
            a = atr[i]
            p = smooth_plus[i]
            m = smooth_minus[i]
            if a is not None and a > 0 and p is not None and m is not None:
                plus_di[i] = (p / a) * 100
                minus_di[i] = (m / a) * 100
                di_sum = plus_di[i] + minus_di[i]
                if di_sum > 0:
                    dx[i] = abs(plus_di[i] - minus_di[i]) / di_sum * 100

        dx_valid = [v if v is not None else 0.0 for v in dx]
        adx_values = SmoothingCalculator.wilder_smoothing(dx_valid, period)

        current_adx = adx_values[-1] if adx_values[-1] is not None else None
        current_plus = plus_di[-1]
        current_minus = minus_di[-1]

        slope_data = SlopeCalculator.calculate(adx_values, n - 1)

        trend = TrendDirection.NEUTRAL
        if current_plus is not None and current_minus is not None:
            if current_plus > current_minus:
                trend = TrendDirection.BULLISH
            else:
                trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"period": period},
            values=adx_values,
            dates=dates,
            current_value=current_adx,
            previous_value=adx_values[-2] if n >= 2 and adx_values[-2] is not None else None,
            slope=slope_data["slope"],
            acceleration=slope_data["acceleration"],
            trend=trend,
        )

        if current_adx is not None:
            if current_adx > 50:
                result.warnings.append(f"Very strong trend: ADX={current_adx:.1f}")
            elif current_adx < 20:
                result.warnings.append(f"Weak/no trend: ADX={current_adx:.1f}")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_adx_signals(result)

    def shutdown(self) -> None:
        pass
