import pytest
from modules.volume_engine.core.types import (
    PriceBar, IndicatorResult, Signal, SmartMoneyResult, LiquidityResult,
    InstitutionalScore, SignalType, TrendDirection, SmartMoneyType,
    VolumeNodeType, UnusualActivityType, BreakoutConfirmation,
    VolumeAnalysis, UnusualActivityResult, VolumeScore, BenchmarkResult,
)


def _bar(close=100.0, **kw) -> PriceBar:
    defaults = dict(date="2024-01-01", open=100, high=105, low=95, close=100, volume=1000)
    defaults.update(kw)
    defaults["close"] = close
    return PriceBar(**defaults)


def _bars(n=100, start=100.0, step=0.5) -> list[PriceBar]:
    return [
        PriceBar(
            date=f"2024-01-{(i % 28) + 1:02d}",
            open=start + i * step,
            high=start + i * step + 3,
            low=start + i * step - 2,
            close=start + i * step,
            volume=1000 + i * 10,
        )
        for i in range(n)
    ]


def _trending_bars(n=100, direction="up") -> list[PriceBar]:
    bars = []
    price = 100.0
    for i in range(n):
        change = 0.5 if direction == "up" else -0.5
        price += change
        bars.append(PriceBar(
            date=f"2024-01-{(i % 28) + 1:02d}",
            open=price - 1,
            high=price + 3,
            low=price - 2,
            close=price,
            volume=1000 + i * 10,
        ))
    return bars


def _volatile_bars(n=100) -> list[PriceBar]:
    import random
    random.seed(42)
    bars = []
    price = 100.0
    for i in range(n):
        change = random.uniform(-3, 3)
        price += change
        bars.append(PriceBar(
            date=f"2024-01-{(i % 28) + 1:02d}",
            open=price - 1,
            high=price + abs(random.uniform(0, 5)),
            low=price - abs(random.uniform(0, 5)),
            close=price,
            volume=1000 + i * 10,
        ))
    return bars


def _volume_spike_bars(n=50) -> list[PriceBar]:
    import random
    random.seed(42)
    bars = []
    price = 100.0
    for i in range(n):
        change = random.uniform(-2, 2)
        price += change
        vol = 1000
        if i >= 45:
            vol = 10000
        bars.append(PriceBar(
            date=f"2024-01-{(i % 28) + 1:02d}",
            open=price - 1,
            high=price + 2,
            low=price - 2,
            close=price,
            volume=vol,
        ))
    return bars
