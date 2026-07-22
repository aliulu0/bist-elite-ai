from __future__ import annotations

from modules.moving_average.plugins.base import BaseMAPattern


class SMMAPlugin(BaseMAPattern):

    @property
    def name(self) -> str:
        return "smma"

    @property
    def display_name(self) -> str:
        return "Smoothed Moving Average"

    def calculate(self, closes: list[float], period: int) -> list[float | None]:
        n = len(closes)
        result: list[float | None] = [None] * n
        if n < period:
            return result
        smma = sum(closes[:period]) / period
        result[period - 1] = smma
        for i in range(period, n):
            smma = (smma * (period - 1) + closes[i]) / period
            result[i] = smma
        return result
