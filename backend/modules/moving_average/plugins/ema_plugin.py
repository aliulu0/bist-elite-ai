from __future__ import annotations

from modules.moving_average.plugins.base import BaseMAPattern


class EMAPlugin(BaseMAPattern):

    @property
    def name(self) -> str:
        return "ema"

    @property
    def display_name(self) -> str:
        return "Exponential Moving Average"

    def calculate(self, closes: list[float], period: int) -> list[float | None]:
        n = len(closes)
        result: list[float | None] = [None] * n
        if n < period:
            return result
        k = 2.0 / (period + 1)
        sma_sum = sum(closes[:period])
        ema = sma_sum / period
        result[period - 1] = ema
        for i in range(period, n):
            ema = closes[i] * k + ema * (1 - k)
            result[i] = ema
        return result
