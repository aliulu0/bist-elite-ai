from __future__ import annotations

from modules.trend_engine.core.base import BaseTrendPlugin
from modules.trend_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.trend_engine.signals.trend_signal_engine import TrendSignalEngine
from modules.trend_engine.calculators.trend_calculator import TrendCalculator
from modules.trend_engine.validators.trend_validator import TrendValidator


class KeltnerPlugin(BaseTrendPlugin):

    def __init__(self) -> None:
        self._signal_engine = TrendSignalEngine()

    @property
    def name(self) -> str:
        return "keltner"

    @property
    def display_name(self) -> str:
        return "Keltner Channel"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"ema_period": 20, "atr_period": 10, "multiplier": 2.0}

    def min_bars(self) -> int:
        return 30

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "trend",
            "default_params": self.get_default_params(),
            "output_fields": [
                "current_value", "trend", "upper", "lower", "squeeze",
            ],
        }

    def parameters(self) -> dict:
        return {
            "ema_period": {"type": "int", "default": 20, "min": 2, "max": 200},
            "atr_period": {"type": "int", "default": 10, "min": 2, "max": 200},
            "multiplier": {"type": "float", "default": 2.0, "min": 0.5, "max": 5.0},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = TrendValidator.validate_prices(prices)
        for key in ["ema_period", "atr_period"]:
            errors.extend(TrendValidator.validate_period(params.get(key, self.get_default_params()[key]), key))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        ema_period = params.get("ema_period", 20)
        atr_period = params.get("atr_period", 10)
        multiplier = params.get("multiplier", 2.0)
        n = len(prices)
        dates = [p.date for p in prices]
        closes = [p.close for p in prices]

        ema = TrendCalculator.ema(closes, ema_period)
        atr = TrendCalculator.atr(prices, atr_period)

        upper: list[float | None] = [None] * n
        lower: list[float | None] = [None] * n
        for i in range(n):
            if ema[i] is not None and atr[i] is not None:
                upper[i] = ema[i] + multiplier * atr[i]
                lower[i] = ema[i] - multiplier * atr[i]

        current_close = closes[-1]
        current_upper = upper[-1]
        current_lower = lower[-1]
        current_ema = ema[-1]

        norm_val = 0.0
        if current_upper is not None and current_lower is not None:
            spread = current_upper - current_lower
            if spread > 0:
                norm_val = 2 * (current_close - current_lower) / spread - 1

        trend = TrendDirection.NEUTRAL
        if current_ema is not None:
            if current_close > current_ema:
                trend = TrendDirection.BULLISH
            elif current_close < current_ema:
                trend = TrendDirection.BEARISH

        squeeze = False
        if current_upper is not None and current_lower is not None:
            channel_width = current_upper - current_lower
            if len(prices) >= ema_period + 20:
                recent_upper = upper[-20:]
                recent_lower = lower[-20:]
                widths = []
                for j in range(len(recent_upper)):
                    if recent_upper[j] is not None and recent_lower[j] is not None:
                        widths.append(recent_upper[j] - recent_lower[j])
                if widths:
                    avg_width = sum(widths) / len(widths)
                    squeeze = channel_width < avg_width * 0.75

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"ema_period": ema_period, "atr_period": atr_period, "multiplier": multiplier},
            values=ema,
            dates=dates,
            current_value=norm_val,
            slope=TrendCalculator.first_derivative(ema, n - 1),
            trend=trend,
        )

        if squeeze:
            result.warnings.append("Keltner squeeze detected")
        if norm_val > 1.5:
            result.warnings.append(f"Above upper channel: {norm_val:.2f}")
        elif norm_val < -1.5:
            result.warnings.append(f"Below lower channel: {norm_val:.2f}")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_keltner_signals(result)

    def shutdown(self) -> None:
        pass
