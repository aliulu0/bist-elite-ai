from __future__ import annotations

from modules.momentum_engine.core.base import BaseMomentumPlugin
from modules.momentum_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.momentum_engine.signals.signal_engine import SignalEngine
from modules.momentum_engine.calculators.smoothing_calculator import SmoothingCalculator
from modules.momentum_engine.calculators.slope_calculator import SlopeCalculator
from modules.momentum_engine.validators.momentum_validator import MomentumValidator


class StochRSIPlugin(BaseMomentumPlugin):

    def __init__(self) -> None:
        self._signal_engine = SignalEngine()

    @property
    def name(self) -> str:
        return "stoch_rsi"

    @property
    def display_name(self) -> str:
        return "Stochastic RSI"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"rsi_period": 14, "stoch_period": 14, "k_smooth": 3, "d_smooth": 3}

    def min_bars(self) -> int:
        return 60

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "momentum",
            "default_params": self.get_default_params(),
        }

    def parameters(self) -> dict:
        return {
            "rsi_period": {"type": "int", "default": 14, "min": 2, "max": 500},
            "stoch_period": {"type": "int", "default": 14, "min": 2, "max": 500},
            "k_smooth": {"type": "int", "default": 3, "min": 1, "max": 50},
            "d_smooth": {"type": "int", "default": 3, "min": 1, "max": 50},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = MomentumValidator.validate_prices(prices)
        for key in ["rsi_period", "stoch_period", "k_smooth", "d_smooth"]:
            val = params.get(key, 14)
            errors.extend(MomentumValidator.validate_period(val, key))
        return errors

    def _calculate_rsi(self, closes: list[float], period: int) -> list[float | None]:
        n = len(closes)
        gains = [0.0] * n
        losses = [0.0] * n
        for i in range(1, n):
            diff = closes[i] - closes[i - 1]
            if diff > 0:
                gains[i] = diff
            else:
                losses[i] = abs(diff)
        avg_gains = SmoothingCalculator.wilder_smoothing(gains, period)
        avg_losses = SmoothingCalculator.wilder_smoothing(losses, period)
        rsi: list[float | None] = [None] * n
        for i in range(n):
            ag = avg_gains[i]
            al = avg_losses[i]
            if ag is not None and al is not None:
                if al == 0:
                    rsi[i] = 100.0
                else:
                    rs = ag / al
                    rsi[i] = 100.0 - (100.0 / (1.0 + rs))
        return rsi

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        rsi_period = params.get("rsi_period", 14)
        stoch_period = params.get("stoch_period", 14)
        k_smooth = params.get("k_smooth", 3)
        d_smooth = params.get("d_smooth", 3)

        closes = [p.close for p in prices]
        dates = [p.date for p in prices]
        n = len(closes)

        rsi_values = self._calculate_rsi(closes, rsi_period)

        stoch_values: list[float | None] = [None] * n
        for i in range(stoch_period - 1, n):
            window = [v for v in rsi_values[i - stoch_period + 1:i + 1] if v is not None]
            if len(window) == stoch_period:
                min_rsi = min(window)
                max_rsi = max(window)
                if max_rsi - min_rsi != 0:
                    stoch_values[i] = ((rsi_values[i] or 0) - min_rsi) / (max_rsi - min_rsi) * 100
                else:
                    stoch_values[i] = 50.0

        k_values = SmoothingCalculator.sma(
            [v if v is not None else 50.0 for v in stoch_values], k_smooth
        )
        d_values = SmoothingCalculator.sma(
            [v if v is not None else 50.0 for v in k_values], d_smooth
        )

        current_k = k_values[-1]
        current_d = d_values[-1]

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"rsi_period": rsi_period, "stoch_period": stoch_period, "k_smooth": k_smooth, "d_smooth": d_smooth},
            values=k_values,
            dates=dates,
            current_value=current_k,
            previous_value=k_values[-2] if len(k_values) >= 2 else None,
        )

        if current_k is not None and current_k < 20:
            result.warnings.append("StochRSI oversold")
        elif current_k is not None and current_k > 80:
            result.warnings.append("StochRSI overbought")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_stoch_rsi_signals(result)

    def shutdown(self) -> None:
        pass
