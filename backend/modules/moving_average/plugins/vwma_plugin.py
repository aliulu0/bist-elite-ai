from __future__ import annotations

from modules.moving_average.plugins.base import BaseMAPattern


class VWMAPlugin(BaseMAPattern):

    @property
    def name(self) -> str:
        return "vwma"

    @property
    def display_name(self) -> str:
        return "Volume Weighted Moving Average"

    def calculate(self, closes: list[float], period: int, volumes: list[float] | None = None) -> list[float | None]:
        n = len(closes)
        result: list[float | None] = [None] * n
        if n < period:
            return result
        if volumes is None or len(volumes) != n:
            return [None] * n
        for i in range(period - 1, n):
            pv_sum = 0.0
            v_sum = 0.0
            for j in range(period):
                idx = i - period + 1 + j
                pv_sum += closes[idx] * volumes[idx]
                v_sum += volumes[idx]
            if v_sum > 0:
                result[i] = pv_sum / v_sum
        return result

    def calculate_with_volumes(self, closes: list[float], volumes: list[float], period: int) -> list[float | None]:
        return self.calculate(closes, period, volumes)
