from __future__ import annotations

from modules.trend_engine.core.base import BaseTrendPlugin
from modules.trend_engine.core.types import (
    PriceBar, IndicatorResult, Signal, SignalType, TrendDirection,
)
from modules.trend_engine.signals.trend_signal_engine import TrendSignalEngine
from modules.trend_engine.calculators.trend_calculator import TrendCalculator
from modules.trend_engine.validators.trend_validator import TrendValidator


class ParabolicSARPlugin(BaseTrendPlugin):

    def __init__(self) -> None:
        self._signal_engine = TrendSignalEngine()

    @property
    def name(self) -> str:
        return "parabolic_sar"

    @property
    def display_name(self) -> str:
        return "Parabolic SAR"

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"af_start": 0.02, "af_increment": 0.02, "af_max": 0.2}

    def min_bars(self) -> int:
        return 10

    def metadata(self) -> dict:
        return {
            "name": self.name,
            "display_name": self.display_name,
            "category": "trend",
            "default_params": self.get_default_params(),
            "output_fields": [
                "current_value", "trend", "stop_level", "acceleration_factor",
            ],
        }

    def parameters(self) -> dict:
        return {
            "af_start": {"type": "float", "default": 0.02, "min": 0.001, "max": 0.2},
            "af_increment": {"type": "float", "default": 0.02, "min": 0.001, "max": 0.2},
            "af_max": {"type": "float", "default": 0.2, "min": 0.05, "max": 1.0},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return TrendValidator.validate_prices(prices)

    def calculate(self, prices: list[PriceBar], **params) -> IndicatorResult:
        af_start = params.get("af_start", 0.02)
        af_increment = params.get("af_increment", 0.02)
        af_max = params.get("af_max", 0.2)
        n = len(prices)
        dates = [p.date for p in prices]

        sar: list[float | None] = [None] * n
        af_values: list[float | None] = [None] * n
        direction_list: list[float | None] = [None] * n

        if n < 2:
            return IndicatorResult(
                indicator=self.display_name,
                parameters=params,
                values=sar,
                dates=dates,
            )

        is_uptrend = prices[1].close > prices[0].close
        af = af_start
        ep = prices[0].high if is_uptrend else prices[0].low
        sar_val = prices[0].low if is_uptrend else prices[0].high

        for i in range(1, n):
            prev_sar = sar_val

            if is_uptrend:
                sar_val = prev_sar + af * (ep - prev_sar)
                sar_val = min(sar_val, prices[i - 1].low)
                if i >= 2:
                    sar_val = min(sar_val, prices[i - 2].low)

                if prices[i].low < sar_val:
                    is_uptrend = False
                    sar_val = ep
                    ep = prices[i].low
                    af = af_start
                else:
                    if prices[i].high > ep:
                        ep = prices[i].high
                        af = min(af + af_increment, af_max)
            else:
                sar_val = prev_sar + af * (ep - prev_sar)
                sar_val = max(sar_val, prices[i - 1].high)
                if i >= 2:
                    sar_val = max(sar_val, prices[i - 2].high)

                if prices[i].high > sar_val:
                    is_uptrend = True
                    sar_val = ep
                    ep = prices[i].high
                    af = af_start
                else:
                    if prices[i].low < ep:
                        ep = prices[i].low
                        af = min(af + af_increment, af_max)

            sar[i] = sar_val
            af_values[i] = af
            direction_list[i] = 1.0 if is_uptrend else -1.0

        current_sar = sar[-1]
        previous_sar = sar[-2] if n >= 2 else None
        current_dir = direction_list[-1]
        prev_dir = direction_list[-2] if n >= 2 else None

        trend = TrendDirection.NEUTRAL
        if current_dir == 1.0:
            trend = TrendDirection.BULLISH
        elif current_dir == -1.0:
            trend = TrendDirection.BEARISH

        result = IndicatorResult(
            indicator=self.display_name,
            parameters={"af_start": af_start, "af_increment": af_increment, "af_max": af_max},
            values=sar,
            dates=dates,
            current_value=current_sar,
            previous_value=previous_sar,
            slope=TrendCalculator.first_derivative(sar, n - 1),
            trend=trend,
        )

        if current_dir is not None and prev_dir is not None and current_dir != prev_dir:
            flip = "bullish" if current_dir == 1.0 else "bearish"
            result.warnings.append(f"Parabolic SAR flipped {flip}")

        if af_values[-1] is not None and af_values[-1] >= af_max * 0.9:
            result.warnings.append("Acceleration factor near maximum - trend may be exhausting")

        return result

    def signals(self, result: IndicatorResult) -> list[Signal]:
        signals: list[Signal] = []
        v = result.current_value
        if v is None:
            return signals

        prev = result.previous_value
        if prev is not None:
            prev_trend = TrendDirection.BULLISH if result.previous_value and result.previous_value < v else TrendDirection.BEARISH
            if result.trend != TrendDirection.NEUTRAL:
                if result.trend == TrendDirection.BULLISH:
                    signals.append(Signal(
                        signal_type=SignalType.BUY,
                        indicator="Parabolic SAR",
                        confidence=0.75,
                        strength=min(1.0, abs(result.slope or 0) * 50 + 0.3),
                        description="Parabolic SAR bullish",
                    ))
                else:
                    signals.append(Signal(
                        signal_type=SignalType.SELL,
                        indicator="Parabolic SAR",
                        confidence=0.75,
                        strength=min(1.0, abs(result.slope or 0) * 50 + 0.3),
                        description="Parabolic SAR bearish",
                    ))
        if not signals:
            signals.append(Signal(
                signal_type=SignalType.NEUTRAL,
                indicator="Parabolic SAR",
                confidence=0.5,
                strength=0.0,
                description="Parabolic SAR neutral",
            ))
        return signals

    def shutdown(self) -> None:
        pass
