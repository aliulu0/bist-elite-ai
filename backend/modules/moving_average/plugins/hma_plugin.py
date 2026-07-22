from __future__ import annotations

from modules.moving_average.plugins.base import BaseMAPattern


class HMAPlugin(BaseMAPattern):

    @property
    def name(self) -> str:
        return "hma"

    @property
    def display_name(self) -> str:
        return "Hull Moving Average"

    def calculate(self, closes: list[float], period: int) -> list[float | None]:
        n = len(closes)
        result: list[float | None] = [None] * n
        half = max(period // 2, 1)
        sqrt_p = max(int(period ** 0.5), 1)

        wma_half = self._wma(closes, half)
        wma_full = self._wma(closes, period)

        diff: list[float | None] = [None] * n
        for i in range(n):
            if wma_half[i] is not None and wma_full[i] is not None:
                diff[i] = 2.0 * wma_half[i] - wma_full[i]

        raw_hma = self._wma_from(diff, sqrt_p)

        for i in range(n):
            if raw_hma[i] is not None:
                result[i] = raw_hma[i]
        return result

    @staticmethod
    def _wma(data: list[float], period: int) -> list[float | None]:
        n = len(data)
        result: list[float | None] = [None] * n
        denom = period * (period + 1) / 2
        for i in range(period - 1, n):
            s = 0.0
            for j in range(period):
                s += data[i - period + 1 + j] * (j + 1)
            result[i] = s / denom
        return result

    @staticmethod
    def _wma_from(data: list[float | None], period: int) -> list[float | None]:
        n = len(data)
        result: list[float | None] = [None] * n
        denom = period * (period + 1) / 2
        for i in range(period - 1, n):
            s = 0.0
            valid = True
            for j in range(period):
                val = data[i - period + 1 + j]
                if val is None:
                    valid = False
                    break
                s += val * (j + 1)
            if valid:
                result[i] = s / denom
        return result
