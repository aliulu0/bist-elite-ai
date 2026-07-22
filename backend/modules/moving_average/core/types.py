from __future__ import annotations

import math
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class MAType(str, Enum):
    SMA = "sma"
    EMA = "ema"
    WMA = "wma"
    HMA = "hma"
    SMMA = "smma"
    VWMA = "vwma"


class TrendDirection(str, Enum):
    UPTREND = "uptrend"
    DOWNTREND = "downtrend"
    SIDEWAYS = "sideways"


class CrossType(str, Enum):
    GOLDEN = "golden_cross"
    DEATH = "death_cross"
    NONE = "none"


class CrossStrength(str, Enum):
    STRONG = "strong"
    MODERATE = "moderate"
    WEAK = "weak"
    FALSE = "false"


class Timeframe(str, Enum):
    M5 = "5m"
    M15 = "15m"
    H1 = "1H"
    H4 = "4H"
    D1 = "daily"
    W1 = "weekly"
    MO1 = "monthly"


TIMEFRAME_ORDER: dict[Timeframe, int] = {
    Timeframe.M5: 1,
    Timeframe.M15: 2,
    Timeframe.H1: 3,
    Timeframe.H4: 4,
    Timeframe.D1: 5,
    Timeframe.W1: 6,
    Timeframe.MO1: 7,
}


@dataclass
class PriceBar:
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    turnover: float = 0.0


@dataclass
class MAResult:
    indicator: str
    period: int
    values: list[float | None]
    dates: list[str]


@dataclass
class SlopeResult:
    slope: float | None
    angle_degrees: float | None
    acceleration: float | None
    is_accelerating: bool


@dataclass
class DistanceResult:
    distance_pct: float | None
    distance_abs: float | None
    bars_to_cross: int | None
    cross_probability: float | None


@dataclass
class CrossResult:
    cross_type: CrossType
    cross_strength: CrossStrength
    cross_date: str | None
    fast_period: int
    slow_period: int
    confirmed: bool
    false_cross: bool
    distance_at_cross: float | None


@dataclass
class TrendResult:
    direction: TrendDirection
    strength: float
    age: int
    stability: float
    ma_value: float | None
    price_position: str | None


@dataclass
class SmartSignal:
    signal_type: str
    direction: str
    confidence: float
    description: str


@dataclass
class MAScore:
    trend_score: float
    momentum_score: float
    cross_score: float
    acceleration_score: float
    ma_score: float
    components: dict[str, float] = field(default_factory=dict)


@dataclass
class FullResult:
    indicator: str
    period: int
    values: list[float | None]
    dates: list[str]
    current_value: float | None
    previous_value: float | None
    slope: SlopeResult | None = None
    distance_from_price: DistanceResult | None = None
    trend: TrendResult | None = None
    signals: list[CrossResult] = field(default_factory=list)
    smart_signals: list[SmartSignal] = field(default_factory=list)
    scores: MAScore | None = None
    calculation_time_ms: float = 0.0
