from __future__ import annotations

import math


class SmoothingCalculator:

    @staticmethod
    def ema(values: list[float], period: int) -> list[float | None]:
        n = len(values)
        result: list[float | None] = [None] * n
        if n < period:
            return result
        k = 2.0 / (period + 1)
        sma = sum(values[:period]) / period
        result[period - 1] = sma
        for i in range(period, n):
            sma = values[i] * k + sma * (1 - k)
            result[i] = sma
        return result

    @staticmethod
    def sma(values: list[float], period: int) -> list[float | None]:
        n = len(values)
        result: list[float | None] = [None] * n
        if n < period:
            return result
        window = sum(values[:period])
        result[period - 1] = window / period
        for i in range(period, n):
            window += values[i] - values[i - period]
            result[i] = window / period
        return result

    @staticmethod
    def wma(values: list[float], period: int) -> list[float | None]:
        n = len(values)
        result: list[float | None] = [None] * n
        if n < period:
            return result
        denom = period * (period + 1) / 2
        for i in range(period - 1, n):
            s = 0.0
            for j in range(period):
                s += values[i - period + 1 + j] * (j + 1)
            result[i] = s / denom
        return result

    @staticmethod
    def wilder_smoothing(values: list[float], period: int) -> list[float | None]:
        n = len(values)
        result: list[float | None] = [None] * n
        if n < period:
            return result
        avg = sum(values[:period]) / period
        result[period - 1] = avg
        for i in range(period, n):
            avg = (avg * (period - 1) + values[i]) / period
            result[i] = avg
        return result
