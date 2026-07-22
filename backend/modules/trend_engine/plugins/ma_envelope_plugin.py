from __future__ import annotations

from modules.trend_engine.core.base import BaseTrendPlugin
from modules.trend_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.trend_engine.signals.trend_signal_engine import TrendSignalEngine
from modules.trend_engine.calculators.trend_calculator import TrendCalculator
from modules.trend_engine.validators.trend_validator import TrendValidator


class MAEnvelopePlugin(BaseTrendPlugin):

    def __init__(self) -> None:
        self._signal_engine = TrendSignalEngine()

    @property
    def name(self) -> str:
        return "ma_envelope"

    @property
    def display_name(self) -> str:
        return "Moving Average Envelope"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"period": 20, "envelope_pct": 0.025}

    def min_bars(self) -> int:
        return 25

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "trend",
            "default_params": self.get_default_params(),
            "output_fields": [
                "current_value", "trend", "upper_envelope", "lower_envelope",
            ],
        }

    def parameters(self) -> dict:
        return {
            "period": {"type": "int", "default": 20, "min": 2, "max": 200},
            "envelope_pct": {"type": "float", "default": 0.025, "min": 0.005, "max": 0.2},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = TrendValidator.validate_prices(prices)
        period = params.get("period", 20)
        errors.extend(TrendValidator.validate_period(period, "period"))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        period = params.get("period", 20)
        envelope_pct = params.get("envelope_pct", 0.025)
        n = len(prices)
        dates = [p.date for p in prices]
        closes = [p.close for p in prices]

        ma = TrendCalculator.sma(closes, period)

        upper: list[float | None] = [None] * n
        lower: list[float | None] = [None] * n
        for i in range(n):
            if ma[i] is not None:
                upper[i] = ma[i] * (1 + envelope_pct)
                lower[i] = ma[i] * (1 - envelope_pct)

        current_close = closes[-1]
        current_ma = ma[-1]
        current_upper = upper[-1]
        current_lower = lower[-1]

        norm_val = 0.0
        if current_upper is not None and current_lower is not None:
            spread = current_upper - current_lower
            if spread > 0:
                norm_val = 2 * (current_close - current_lower) / spread - 1

        trend = TrendDirection.NEUTRAL
        if current_ma is not None:
            if current_close > current_ma:
                trend = TrendDirection.BULLISH
            elif current_close < current_ma:
                trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"period": period, "envelope_pct": envelope_pct},
            values=ma,
            dates=dates,
            current_value=norm_val,
            slope=TrendCalculator.first_derivative(ma, n - 1),
            trend=trend,
        )

        if norm_val > 1.0:
            result.warnings.append(f"Above upper envelope: {norm_val:.2f}")
        elif norm_val < -1.0:
            result.warnings.append(f"Below lower envelope: {norm_val:.2f}")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_ma_envelope_signals(result)

    def shutdown(self) -> None:
        pass
