from __future__ import annotations


class TrendCalculator:

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
    def ema(values: list[float], period: int) -> list[float | None]:
        n = len(values)
        result: list[float | None] = [None] * n
        if n < period:
            return result
        k = 2.0 / (period + 1)
        sma_val = sum(values[:period]) / period
        result[period - 1] = sma_val
        for i in range(period, n):
            sma_val = values[i] * k + sma_val * (1 - k)
            result[i] = sma_val
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

    @staticmethod
    def true_range(prices: list) -> list[float]:
        n = len(prices)
        tr = [0.0] * n
        for i in range(1, n):
            h = prices[i].high
            l = prices[i].low
            pc = prices[i - 1].close
            tr[i] = max(h - l, abs(h - pc), abs(l - pc))
        return tr

    @staticmethod
    def atr(prices: list, period: int) -> list[float | None]:
        tr = TrendCalculator.true_range(prices)
        return TrendCalculator.wilder_smoothing(tr, period)

    @staticmethod
    def first_derivative(values: list[float | None], idx: int) -> float | None:
        if idx < 1:
            return None
        curr = values[idx]
        prev = values[idx - 1]
        if curr is None or prev is None or prev == 0:
            return None
        return (curr - prev) / abs(prev)

    @staticmethod
    def second_derivative(values: list[float | None], idx: int) -> float | None:
        if idx < 2:
            return None
        d1 = TrendCalculator.first_derivative(values, idx)
        d0 = TrendCalculator.first_derivative(values, idx - 1)
        if d1 is None or d0 is None:
            return None
        return d1 - d0

    @staticmethod
    def linear_regression(values: list[float], period: int) -> tuple[list[float | None], list[float | None], list[float | None]]:
        n = len(values)
        trend_line: list[float | None] = [None] * n
        upper_band: list[float | None] = [None] * n
        lower_band: list[float | None] = [None] * n

        for i in range(period - 1, n):
            window = values[i - period + 1:i + 1]
            x_mean = (period - 1) / 2.0
            y_mean = sum(window) / period

            ss_xx = 0.0
            ss_xy = 0.0
            for j in range(period):
                x = j - x_mean
                ss_xx += x * x
                ss_xy += x * (window[j] - y_mean)

            if ss_xx == 0:
                slope = 0.0
                intercept = y_mean
            else:
                slope = ss_xy / ss_xx
                intercept = y_mean - slope * x_mean

            trend_line[i] = intercept + slope * (period - 1)

            ss_res = 0.0
            for j in range(period):
                predicted = intercept + slope * j
                ss_res += (window[j] - predicted) ** 2
            std_err = (ss_res / period) ** 0.5 if period > 0 else 0.0

            upper_band[i] = trend_line[i] + 2 * std_err
            lower_band[i] = trend_line[i] - 2 * std_err

        return trend_line, upper_band, lower_band

    @staticmethod
    def slope_angle(slope: float | None) -> float | None:
        if slope is None:
            return None
        import math
        return math.degrees(math.atan(slope))
