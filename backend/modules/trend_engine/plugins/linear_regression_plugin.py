from __future__ import annotations

from modules.trend_engine.core.base import BaseTrendPlugin
from modules.trend_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.trend_engine.signals.trend_signal_engine import TrendSignalEngine
from modules.trend_engine.calculators.trend_calculator import TrendCalculator
from modules.trend_engine.validators.trend_validator import TrendValidator


class LinearRegressionPlugin(BaseTrendPlugin):

    def __init__(self) -> None:
        self._signal_engine = TrendSignalEngine()

    @property
    def name(self) -> str:
        return "linear_regression"

    @property
    def display_name(self) -> str:
        return "Linear Regression Trend"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"period": 20}

    def min_bars(self) -> int:
        return 25

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "trend",
            "default_params": self.get_default_params(),
            "output_fields": [
                "current_value", "trend", "slope", "r_squared",
            ],
        }

    def parameters(self) -> dict:
        return {
            "period": {"type": "int", "default": 20, "min": 5, "max": 200},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = TrendValidator.validate_prices(prices)
        period = params.get("period", 20)
        errors.extend(TrendValidator.validate_period(period, "period"))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        period = params.get("period", 20)
        n = len(prices)
        dates = [p.date for p in prices]
        closes = [p.close for p in prices]

        trend_line, upper, lower = TrendCalculator.linear_regression(closes, period)

        r_squared: list[float | None] = [None] * n
        for i in range(period - 1, n):
            window = closes[i - period + 1:i + 1]
            x_mean = (period - 1) / 2.0
            y_mean = sum(window) / period

            ss_xx = 0.0
            ss_xy = 0.0
            ss_yy = 0.0
            for j in range(period):
                x = j - x_mean
                y = window[j] - y_mean
                ss_xx += x * x
                ss_xy += x * y
                ss_yy += y * y

            if ss_xx > 0 and ss_yy > 0:
                r_squared[i] = (ss_xy ** 2) / (ss_xx * ss_yy)
            else:
                r_squared[i] = 0.0

        current_trend = trend_line[-1]
        current_close = closes[-1]
        deviation = 0.0
        if current_trend is not None and current_trend != 0:
            deviation = (current_close - current_trend) / abs(current_trend)

        current_slope = TrendCalculator.first_derivative(trend_line, n - 1)

        trend = TrendDirection.NEUTRAL
        if current_slope is not None:
            if current_slope > 0:
                trend = TrendDirection.BULLISH
            elif current_slope < 0:
                trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"period": period},
            values=trend_line,
            dates=dates,
            current_value=deviation,
            previous_value=trend_line[-2] if n >= 2 else None,
            slope=current_slope,
            acceleration=TrendCalculator.second_derivative(trend_line, n - 1),
            trend=trend,
        )

        current_r2 = r_squared[-1]
        if current_r2 is not None and current_r2 < 0.3:
            result.warnings.append(f"Low R² ({current_r2:.2f}) - weak linear fit")
        if current_r2 is not None and current_r2 > 0.8:
            result.warnings.append(f"Strong R² ({current_r2:.2f}) - reliable trend")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_linear_reg_signals(result)

    def shutdown(self) -> None:
        pass
