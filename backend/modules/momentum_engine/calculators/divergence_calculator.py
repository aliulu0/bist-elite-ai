from __future__ import annotations

import math
from modules.momentum_engine.core.types import Divergence, DivergenceType


class DivergenceCalculator:

    @staticmethod
    def find_swing_highs(
        values: list[float | None], window: int = 5
    ) -> list[tuple[int, float]]:
        swings: list[tuple[int, float]] = []
        for i in range(window, len(values) - window):
            v = values[i]
            if v is None:
                continue
            is_high = True
            for j in range(i - window, i + window + 1):
                if j == i:
                    continue
                if j < 0 or j >= len(values):
                    continue
                if values[j] is not None and values[j] > v:
                    is_high = False
                    break
            if is_high:
                swings.append((i, v))
        return swings

    @staticmethod
    def find_swing_lows(
        values: list[float | None], window: int = 5
    ) -> list[tuple[int, float]]:
        swings: list[tuple[int, float]] = []
        for i in range(window, len(values) - window):
            v = values[i]
            if v is None:
                continue
            is_low = True
            for j in range(i - window, i + window + 1):
                if j == i:
                    continue
                if j < 0 or j >= len(values):
                    continue
                if values[j] is not None and values[j] < v:
                    is_low = False
                    break
            if is_low:
                swings.append((i, v))
        return swings

    @staticmethod
    def detect_regular_bullish(
        indicator: list[float | None],
        prices: list[float],
    ) -> list[Divergence]:
        from modules.momentum_engine.core.types import DivergenceType
        divergences: list[Divergence] = []
        price_lows = DivergenceCalculator.find_swing_lows(
            [None] * len(prices), window=3
        )
        ind_lows = DivergenceCalculator.find_swing_lows(indicator, window=3)

        price_swings = []
        for i in range(len(prices)):
            v = prices[i]
            if v is not None:
                is_low = True
                for j in range(max(0, i - 3), min(len(prices), i + 4)):
                    if j != i and prices[j] is not None and prices[j] < v:
                        is_low = False
                        break
                if is_low:
                    price_swings.append((i, v))

        for idx in range(1, min(len(price_swings), len(ind_lows))):
            p1_i, p1_v = price_swings[idx - 1]
            p2_i, p2_v = price_swings[idx]
            i1_i, i1_v = ind_lows[idx - 1]
            i2_i, i2_v = ind_lows[idx]

            if p2_v < p1_v and i2_v > i1_v:
                divergences.append(Divergence(
                    divergence_type=DivergenceType.REGULAR_BULLISH,
                    indicator="divergence",
                    start_idx=p1_i,
                    end_idx=p2_i,
                    confidence=0.7,
                    description="Price making lower low while indicator makes higher low",
                ))
        return divergences

    @staticmethod
    def detect_regular_bearish(
        indicator: list[float | None],
        prices: list[float],
    ) -> list[Divergence]:
        divergences: list[Divergence] = []

        price_swings = []
        for i in range(len(prices)):
            v = prices[i]
            if v is not None:
                is_high = True
                for j in range(max(0, i - 3), min(len(prices), i + 4)):
                    if j != i and prices[j] is not None and prices[j] > v:
                        is_high = False
                        break
                if is_high:
                    price_swings.append((i, v))

        ind_swings = []
        for i in range(len(indicator)):
            v = indicator[i]
            if v is not None:
                is_high = True
                for j in range(max(0, i - 3), min(len(indicator), i + 4)):
                    if j != i and indicator[j] is not None and indicator[j] > v:
                        is_high = False
                        break
                if is_high:
                    ind_swings.append((i, v))

        for idx in range(1, min(len(price_swings), len(ind_swings))):
            p1_i, p1_v = price_swings[idx - 1]
            p2_i, p2_v = price_swings[idx]
            i1_i, i1_v = ind_swings[idx - 1]
            i2_i, i2_v = ind_swings[idx]

            if p2_v > p1_v and i2_v < i1_v:
                divergences.append(Divergence(
                    divergence_type=DivergenceType.REGULAR_BEARISH,
                    indicator="divergence",
                    start_idx=p1_i,
                    end_idx=p2_i,
                    confidence=0.7,
                    description="Price making higher high while indicator makes lower high",
                ))
        return divergences

    @staticmethod
    def detect_hidden_bullish(
        indicator: list[float | None],
        prices: list[float],
    ) -> list[Divergence]:
        divergences: list[Divergence] = []

        price_lows = []
        for i in range(len(prices)):
            v = prices[i]
            if v is not None:
                is_low = True
                for j in range(max(0, i - 3), min(len(prices), i + 4)):
                    if j != i and prices[j] is not None and prices[j] < v:
                        is_low = False
                        break
                if is_low:
                    price_lows.append((i, v))

        ind_lows = []
        for i in range(len(indicator)):
            v = indicator[i]
            if v is not None:
                is_low = True
                for j in range(max(0, i - 3), min(len(indicator), i + 4)):
                    if j != i and indicator[j] is not None and indicator[j] < v:
                        is_low = False
                        break
                if is_low:
                    ind_lows.append((i, v))

        for idx in range(1, min(len(price_lows), len(ind_lows))):
            p1_i, p1_v = price_lows[idx - 1]
            p2_i, p2_v = price_lows[idx]
            i1_i, i1_v = ind_lows[idx - 1]
            i2_i, i2_v = ind_lows[idx]

            if p2_v > p1_v and i2_v < i1_v:
                divergences.append(Divergence(
                    divergence_type=DivergenceType.HIDDEN_BULLISH,
                    indicator="divergence",
                    start_idx=p1_i,
                    end_idx=p2_i,
                    confidence=0.6,
                    description="Price making higher low while indicator makes lower low",
                ))
        return divergences

    @staticmethod
    def detect_hidden_bearish(
        indicator: list[float | None],
        prices: list[float],
    ) -> list[Divergence]:
        divergences: list[Divergence] = []

        price_highs = []
        for i in range(len(prices)):
            v = prices[i]
            if v is not None:
                is_high = True
                for j in range(max(0, i - 3), min(len(prices), i + 4)):
                    if j != i and prices[j] is not None and prices[j] > v:
                        is_high = False
                        break
                if is_high:
                    price_highs.append((i, v))

        ind_highs = []
        for i in range(len(indicator)):
            v = indicator[i]
            if v is not None:
                is_high = True
                for j in range(max(0, i - 3), min(len(indicator), i + 4)):
                    if j != i and indicator[j] is not None and indicator[j] > v:
                        is_high = False
                        break
                if is_high:
                    ind_highs.append((i, v))

        for idx in range(1, min(len(price_highs), len(ind_highs))):
            p1_i, p1_v = price_highs[idx - 1]
            p2_i, p2_v = price_highs[idx]
            i1_i, i1_v = ind_highs[idx - 1]
            i2_i, i2_v = ind_highs[idx]

            if p2_v < p1_v and i2_v > i1_v:
                divergences.append(Divergence(
                    divergence_type=DivergenceType.HIDDEN_BEARISH,
                    indicator="divergence",
                    start_idx=p1_i,
                    end_idx=p2_i,
                    confidence=0.6,
                    description="Price making lower high while indicator makes higher high",
                ))
        return divergences
