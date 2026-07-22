from __future__ import annotations

from modules.moving_average.core.types import DistanceResult


class DistanceCalculator:

    @staticmethod
    def distance_from_price(ma_value: float, price: float) -> DistanceResult:
        if ma_value == 0:
            return DistanceResult(
                distance_pct=None, distance_abs=None,
                bars_to_cross=None, cross_probability=None,
            )
        diff = price - ma_value
        pct = diff / abs(ma_value)
        return DistanceResult(
            distance_pct=pct,
            distance_abs=diff,
            bars_to_cross=None,
            cross_probability=None,
        )

    @staticmethod
    def distance_between(
        fast_ma: list[float | None],
        slow_ma: list[float | None],
    ) -> DistanceResult:
        n = min(len(fast_ma), len(slow_ma))
        if n == 0:
            return DistanceResult(None, None, None, None)
        f = fast_ma[-1]
        s = slow_ma[-1]
        if f is None or s is None or s == 0:
            return DistanceResult(None, None, None, None)
        diff = f - s
        pct = diff / abs(s)
        return DistanceResult(
            distance_pct=pct,
            distance_abs=diff,
            bars_to_cross=None,
            cross_probability=None,
        )
