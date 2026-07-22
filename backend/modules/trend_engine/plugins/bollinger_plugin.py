from __future__ import annotations

from modules.trend_engine.core.base import BaseTrendPlugin
from modules.trend_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.trend_engine.signals.trend_signal_engine import TrendSignalEngine
from modules.trend_engine.calculators.trend_calculator import TrendCalculator
from modules.trend_engine.validators.trend_validator import TrendValidator


class BollingerPlugin(BaseTrendPlugin):

    def __init__(self) -> None:
        self._signal_engine = TrendSignalEngine()

    @property
    def name(self) -> str:
        return "bollinger"

    @property
    def display_name(self) -> str:
        return "Bollinger Bands"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"period": 20, "std_dev": 2.0}

    def min_bars(self) -> int:
        return 25

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "trend",
            "default_params": self.get_default_params(),
            "output_fields": [
                "current_value", "trend", "bandwidth", "squeeze",
            ],
        }

    def parameters(self) -> dict:
        return {
            "period": {"type": "int", "default": 20, "min": 2, "max": 200},
            "std_dev": {"type": "float", "default": 2.0, "min": 0.5, "max": 5.0},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = TrendValidator.validate_prices(prices)
        period = params.get("period", 20)
        errors.extend(TrendValidator.validate_period(period, "period"))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        period = params.get("period", 20)
        std_dev = params.get("std_dev", 2.0)
        n = len(prices)
        dates = [p.date for p in prices]
        closes = [p.close for p in prices]

        sma = TrendCalculator.sma(closes, period)

        upper: list[float | None] = [None] * n
        lower: list[float | None] = [None] * n
        bandwidth: list[float | None] = [None] * n

        for i in range(period - 1, n):
            mean = sma[i]
            if mean is None:
                continue
            window = closes[i - period + 1:i + 1]
            variance = sum((v - mean) ** 2 for v in window) / period
            sd = variance ** 0.5
            upper[i] = mean + std_dev * sd
            lower[i] = mean - std_dev * sd
            if mean != 0:
                bandwidth[i] = (upper[i] - lower[i]) / abs(mean)

        current_close = closes[-1]
        current_upper = upper[-1]
        current_lower = lower[-1]
        current_middle = sma[-1]
        current_bw = bandwidth[-1]

        bb_position = 0.0
        if current_upper is not None and current_lower is not None:
            spread = current_upper - current_lower
            if spread > 0:
                bb_position = 2 * (current_close - current_lower) / spread - 1

        trend = TrendDirection.NEUTRAL
        if current_close > (current_middle or 0):
            trend = TrendDirection.BULLISH
        elif current_close < (current_middle or 0):
            trend = TrendDirection.BEARISH

        squeeze = False
        if len(bandwidth) >= 20:
            recent_bw = [b for b in bandwidth[-20:] if b is not None]
            if recent_bw and current_bw is not None:
                avg_bw = sum(recent_bw) / len(recent_bw)
                squeeze = current_bw < avg_bw * 0.75

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"period": period, "std_dev": std_dev},
            values=bandwidth,
            dates=dates,
            current_value=bb_position,
            slope=TrendCalculator.first_derivative(bandwidth, n - 1),
            trend=trend,
        )

        if squeeze:
            result.warnings.append("Bollinger squeeze detected - volatility expansion imminent")
        if current_bw is not None and current_bw > 0.1:
            result.warnings.append(f"High volatility: bandwidth={current_bw:.3f}")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_bollinger_signals(result)

    def shutdown(self) -> None:
        pass
