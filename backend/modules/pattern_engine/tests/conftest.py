from __future__ import annotations

import pytest
from modules.pattern_engine.core.types import PriceBar, PatternCategory, PatternDirection, PatternStatus


def make_ascending_bars(n: int = 50, start: float = 100.0, step: float = 0.5) -> list[PriceBar]:
    bars = []
    for i in range(n):
        o = start + i * step
        h = o + abs(step) * 0.8
        l = o - abs(step) * 0.3
        c = o + abs(step) * 0.4
        bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=o, high=h, low=l, close=c, volume=1000 + i * 10))
    return bars


def make_descending_bars(n: int = 50, start: float = 200.0, step: float = -0.5) -> list[PriceBar]:
    bars = []
    for i in range(n):
        o = start + i * step
        h = o + abs(step) * 0.3
        l = o - abs(step) * 0.8
        c = o - abs(step) * 0.4
        bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=o, high=h, low=l, close=c, volume=1000 + i * 10))
    return bars


def make_ranging_bars(n: int = 40, base: float = 100.0, amplitude: float = 2.0) -> list[PriceBar]:
    import math
    bars = []
    for i in range(n):
        phase = (i / n) * 2 * math.pi
        o = base + amplitude * math.sin(phase)
        h = o + amplitude * 0.3
        l = o - amplitude * 0.3
        c = o + amplitude * 0.1 * math.cos(phase)
        bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=round(o, 2), high=round(h, 2), low=round(l, 2), close=round(c, 2), volume=1000))
    return bars


def make_swing_high_data() -> list[PriceBar]:
    bars = []
    prices = [10, 11, 12, 13, 12, 11, 10, 9, 8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
    for i, p in enumerate(prices):
        bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=p - 0.2, high=p + 0.5, low=p - 0.5, close=p, volume=1000))
    return bars


def make_volume_bars(n: int = 30, base: float = 100.0) -> list[PriceBar]:
    bars = []
    for i in range(n):
        vol = 1000 + (i % 5) * 200
        bars.append(PriceBar(date=f"2024-01-{i+1:02d}", open=base + i * 0.1, high=base + i * 0.1 + 0.5, low=base + i * 0.1 - 0.5, close=base + i * 0.1 + 0.2, volume=vol))
    return bars
