from __future__ import annotations

from modules.trend_engine.core.base import BaseTrendPlugin
from modules.trend_engine.core.types import (
    PriceBar, IndicatorResult, Signal, TrendDirection,
)
from modules.trend_engine.signals.trend_signal_engine import TrendSignalEngine
from modules.trend_engine.calculators.trend_calculator import TrendCalculator
from modules.trend_engine.validators.trend_validator import TrendValidator


class IchimokuPlugin(BaseTrendPlugin):

    def __init__(self) -> None:
        self._signal_engine = TrendSignalEngine()

    @property
    def name(self) -> str:
        return "ichimoku"

    @property
    def display_name(self) -> str:
        return "Ichimoku Cloud"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {
            "tenkan_period": 9,
            "kijun_period": 26,
            "senkou_b_period": 52,
        }

    def min_bars(self) -> int:
        return 60

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "trend",
            "default_params": self.get_default_params(),
            "output_fields": [
                "current_value", "trend", "cloud_direction", "cloud_thickness",
            ],
        }

    def parameters(self) -> dict:
        return {
            "tenkan_period": {"type": "int", "default": 9, "min": 2, "max": 200},
            "kijun_period": {"type": "int", "default": 26, "min": 2, "max": 200},
            "senkou_b_period": {"type": "int", "default": 52, "min": 2, "max": 200},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors = TrendValidator.validate_prices(prices)
        for key in ["tenkan_period", "kijun_period", "senkou_b_period"]:
            val = params.get(key, self.get_default_params()[key])
            errors.extend(TrendValidator.validate_period(val, key))
        return errors

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        tenkan_p = params.get("tenkan_period", 9)
        kijun_p = params.get("kijun_period", 26)
        senkou_b_p = params.get("senkou_b_period", 52)
        n = len(prices)
        dates = [p.date for p in prices]

        def period_high(data, idx, period):
            start = max(0, idx - period + 1)
            return max(p.high for p in data[start:idx + 1])

        def period_low(data, idx, period):
            start = max(0, idx - period + 1)
            return min(p.low for p in data[start:idx + 1])

        tenkan: list[float | None] = [None] * n
        kijun: list[float | None] = [None] * n
        for i in range(max(tenkan_p, kijun_p) - 1, n):
            tenkan[i] = (period_high(prices, i, tenkan_p) + period_low(prices, i, tenkan_p)) / 2
            kijun[i] = (period_high(prices, i, kijun_p) + period_low(prices, i, kijun_p)) / 2

        senkou_a: list[float | None] = [None] * n
        senkou_b: list[float | None] = [None] * n
        for i in range(max(tenkan_p, kijun_p) - 1, n):
            if tenkan[i] is not None and kijun[i] is not None:
                senkou_a[i] = (tenkan[i] + kijun[i]) / 2
            if i >= senkou_b_p - 1:
                senkou_b[i] = (period_high(prices, i, senkou_b_p) + period_low(prices, i, senkou_b_p)) / 2

        cloud_thickness: list[float | None] = [None] * n
        cloud_direction_list: list[float | None] = [None] * n
        for i in range(n):
            if senkou_a[i] is not None and senkou_b[i] is not None:
                cloud_thickness[i] = abs(senkou_a[i] - senkou_b[i])
                cloud_direction_list[i] = 1.0 if senkou_a[i] > senkou_b[i] else -1.0

        current_close = prices[-1].close
        current_tenkan = tenkan[-1]
        current_kijun = kijun[-1]
        current_senkou_a = senkou_a[-1]
        current_senkou_b = senkou_b[-1]
        current_thickness = cloud_thickness[-1]

        cloud_val = 0.0
        if current_senkou_a is not None and current_senkou_b is not None:
            mid = (current_senkou_a + current_senkou_b) / 2
            spread = abs(current_senkou_a - current_senkou_b) + 1e-10
            cloud_val = (current_close - mid) / spread

        trend = TrendDirection.NEUTRAL
        if current_senkou_a is not None and current_senkou_b is not None:
            if current_close > current_senkou_a and current_close > current_senkou_b:
                trend = TrendDirection.BULLISH
            elif current_close < current_senkou_a and current_close < current_senkou_b:
                trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={
                "tenkan_period": tenkan_p, "kijun_period": kijun_p,
                "senkou_b_period": senkou_b_p,
            },
            values=cloud_thickness,
            dates=dates,
            current_value=cloud_val,
            previous_value=None,
            slope=TrendCalculator.first_derivative(
                [v if v is not None else 0.0 for v in cloud_direction_list], n - 1
            ),
            trend=trend,
        )

        if current_senkou_a is not None and current_senkou_b is not None:
            thickness_pct = current_thickness / (current_close + 1e-10) if current_thickness else 0
            if thickness_pct > 0.05:
                result.warnings.append(f"Thick cloud: {thickness_pct:.1%}")
            elif thickness_pct < 0.005:
                result.warnings.append("Thin cloud - potential reversal zone")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        return self._signal_engine.generate_ichimoku_signals(result)

    def shutdown(self) -> None:
        pass
