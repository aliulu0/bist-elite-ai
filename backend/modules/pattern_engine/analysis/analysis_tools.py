from __future__ import annotations

from modules.pattern_engine.core.types import (
    PriceBar, SwingPoint, SwingType, PatternDirection, TrendDirection,
)


class SwingDetector:

    @staticmethod
    def detect_swings(
        prices: list[PriceBar], lookback: int = 5
    ) -> list[SwingPoint]:
        n = len(prices)
        if n < 2 * lookback + 1:
            return []

        swings: list[SwingPoint] = []
        for i in range(lookback, n - lookback):
            is_high = True
            is_low = True
            for j in range(1, lookback + 1):
                if prices[i].high <= prices[i - j].high or prices[i].high <= prices[i + j].high:
                    is_high = False
                if prices[i].low >= prices[i - j].low or prices[i].low >= prices[i + j].low:
                    is_low = False
            if is_high:
                swings.append(SwingPoint(
                    index=i, price=prices[i].high,
                    swing_type=SwingType.HIGH, date=prices[i].date,
                ))
            if is_low:
                swings.append(SwingPoint(
                    index=i, price=prices[i].low,
                    swing_type=SwingType.LOW, date=prices[i].date,
                ))
        return sorted(swings, key=lambda s: s.index)

    @staticmethod
    def find_swing_highs(swings: list[SwingPoint]) -> list[SwingPoint]:
        return [s for s in swings if s.swing_type == SwingType.HIGH]

    @staticmethod
    def find_swing_lows(swings: list[SwingPoint]) -> list[SwingPoint]:
        return [s for s in swings if s.swing_type == SwingType.LOW]

    @staticmethod
    def find_nearest_swing(
        swings: list[SwingPoint], price: float, swing_type: SwingType
    ) -> SwingPoint | None:
        candidates = [s for s in swings if s.swing_type == swing_type]
        if not candidates:
            return None
        return min(candidates, key=lambda s: abs(s.price - price))


class SupportResistance:

    @staticmethod
    def find_support(
        prices: list[PriceBar], lookback: int = 20, tolerance: float = 0.02
    ) -> list[float]:
        if len(prices) < lookback:
            return []
        lows = [p.low for p in prices[-lookback:]]
        levels: list[float] = []
        for low in lows:
            is_new = True
            for existing in levels:
                if abs(low - existing) / (existing + 1e-10) < tolerance:
                    is_new = False
                    break
            if is_new:
                levels.append(low)
        return sorted(levels)

    @staticmethod
    def find_resistance(
        prices: list[PriceBar], lookback: int = 20, tolerance: float = 0.02
    ) -> list[float]:
        if len(prices) < lookback:
            return []
        highs = [p.high for p in prices[-lookback:]]
        levels: list[float] = []
        for high in highs:
            is_new = True
            for existing in levels:
                if abs(high - existing) / (existing + 1e-10) < tolerance:
                    is_new = False
                    break
            if is_new:
                levels.append(high)
        return sorted(levels)

    @staticmethod
    def nearest_support(prices: list[PriceBar], current_price: float) -> float:
        supports = SupportResistance.find_support(prices)
        below = [s for s in supports if s < current_price]
        return max(below) if below else current_price * 0.95

    @staticmethod
    def nearest_resistance(prices: list[PriceBar], current_price: float) -> float:
        resistances = SupportResistance.find_resistance(prices)
        above = [r for r in resistances if r > current_price]
        return min(above) if above else current_price * 1.05


class TrendLineCalculator:

    @staticmethod
    def slope(prices: list[PriceBar], start_idx: int, end_idx: int) -> float:
        if end_idx <= start_idx or start_idx < 0 or end_idx >= len(prices):
            return 0.0
        n = end_idx - start_idx + 1
        sum_x = sum(range(n))
        sum_y = sum(prices[start_idx + i].close for i in range(n))
        sum_xy = sum(i * prices[start_idx + i].close for i in range(n))
        sum_x2 = sum(i * i for i in range(n))
        denom = n * sum_x2 - sum_x * sum_x
        if denom == 0:
            return 0.0
        return (n * sum_xy - sum_x * sum_y) / denom

    @staticmethod
    def is_uptrend(prices: list[PriceBar], lookback: int = 20) -> bool:
        if len(prices) < lookback:
            return False
        recent = prices[-lookback:]
        return recent[-1].close > recent[0].close

    @staticmethod
    def is_downtrend(prices: list[PriceBar], lookback: int = 20) -> bool:
        if len(prices) < lookback:
            return False
        recent = prices[-lookback:]
        return recent[-1].close < recent[0].close

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


class BodyCalculator:

    @staticmethod
    def body(bar: PriceBar) -> float:
        return abs(bar.close - bar.open)

    @staticmethod
    def upper_shadow(bar: PriceBar) -> float:
        return bar.high - max(bar.open, bar.close)

    @staticmethod
    def lower_shadow(bar: PriceBar) -> float:
        return min(bar.open, bar.close) - bar.low

    @staticmethod
    def total_range(bar: PriceBar) -> float:
        return bar.high - bar.low

    @staticmethod
    def is_bullish(bar: PriceBar) -> bool:
        return bar.close > bar.open

    @staticmethod
    def is_bearish(bar: PriceBar) -> bool:
        return bar.close < bar.open

    @staticmethod
    def body_ratio(bar: PriceBar) -> float:
        rng = BodyCalculator.total_range(bar)
        if rng == 0:
            return 0.0
        return BodyCalculator.body(bar) / rng

    @staticmethod
    def upper_shadow_ratio(bar: PriceBar) -> float:
        rng = BodyCalculator.total_range(bar)
        if rng == 0:
            return 0.0
        return BodyCalculator.upper_shadow(bar) / rng

    @staticmethod
    def lower_shadow_ratio(bar: PriceBar) -> float:
        rng = BodyCalculator.total_range(bar)
        if rng == 0:
            return 0.0
        return BodyCalculator.lower_shadow(bar) / rng

    @staticmethod
    def is_engulfing(prev: PriceBar, curr: PriceBar) -> str:
        prev_bullish = BodyCalculator.is_bullish(prev)
        curr_bullish = BodyCalculator.is_bullish(curr)
        if prev_bullish and not curr_bullish:
            if curr.open >= prev.close and curr.close <= prev.open:
                return "bearish"
        if not prev_bullish and curr_bullish:
            if curr.open <= prev.close and curr.close >= prev.open:
                return "bullish"
        return "none"

    @staticmethod
    def is_harami(prev: PriceBar, curr: PriceBar) -> str:
        prev_body_top = max(prev.open, prev.close)
        prev_body_bottom = min(prev.open, prev.close)
        curr_body_top = max(curr.open, curr.close)
        curr_body_bottom = min(curr.open, curr.close)
        if curr_body_top < prev_body_top and curr_body_bottom > prev_body_bottom:
            if BodyCalculator.is_bullish(curr) and not BodyCalculator.is_bullish(prev):
                return "bullish"
            if not BodyCalculator.is_bullish(curr) and BodyCalculator.is_bullish(prev):
                return "bearish"
        return "none"
