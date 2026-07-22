from __future__ import annotations

from modules.moving_average.plugins.base import BaseMAPattern


class WMAPlugin(BaseMAPattern):

    @property
    def name(self) -> str:
        return "wma"

    @property
    def display_name(self) -> str:
        return "Weighted Moving Average"

    def calculate(self, closes: list[float], period: int) -> list[float | None]:
        n = len(closes)
        result: list[float | None] = [None] * n
        if n < period:
            return result
        denom = period * (period + 1) / 2
        for i in range(period - 1, n):
            weighted_sum = 0.0
            for j in range(period):
                weighted_sum += closes[i - period + 1 + j] * (j + 1)
            result[i] = weighted_sum / denom
        return result
