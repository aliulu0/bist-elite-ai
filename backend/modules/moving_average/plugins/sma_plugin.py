from __future__ import annotations

from modules.moving_average.plugins.base import BaseMAPattern


class SMAPlugin(BaseMAPattern):

    @property
    def name(self) -> str:
        return "sma"

    @property
    def display_name(self) -> str:
        return "Simple Moving Average"

    def calculate(self, closes: list[float], period: int) -> list[float | None]:
        n = len(closes)
        result: list[float | None] = [None] * n
        if n < period:
            return result
        window_sum = sum(closes[:period])
        result[period - 1] = window_sum / period
        for i in range(period, n):
            window_sum += closes[i] - closes[i - period]
            result[i] = window_sum / period
        return result
