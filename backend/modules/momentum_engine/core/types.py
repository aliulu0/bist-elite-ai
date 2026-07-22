from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class SignalType(str, Enum):
    STRONG_BUY = "STRONG_BUY"
    BUY = "BUY"
    NEUTRAL = "NEUTRAL"
    SELL = "SELL"
    STRONG_SELL = "STRONG_SELL"
    WAIT = "WAIT"


class TrendDirection(str, Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"


class DivergenceType(str, Enum):
    REGULAR_BULLISH = "regular_bullish"
    REGULAR_BEARISH = "regular_bearish"
    HIDDEN_BULLISH = "hidden_bullish"
    HIDDEN_BEARISH = "hidden_bearish"
    NONE = "none"


class OverboughtState(str, Enum):
    OVERBOUGHT = "overbought"
    OVERSOLD = "oversold"
    NEUTRAL = "neutral"


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
class IndicatorResult:
    indicator: str
    parameters: dict
    values: list[float | None]
    dates: list[str]
    current_value: float | None = None
    previous_value: float | None = None
    slope: float | None = None
    acceleration: float | None = None
    trend: TrendDirection = TrendDirection.NEUTRAL
    warnings: list[str] = field(default_factory=list)
    calculation_time_ms: float = 0.0


@dataclass
class Signal:
    signal_type: SignalType
    indicator: str
    confidence: float
    strength: float
    description: str
    parameters: dict = field(default_factory=dict)


@dataclass
class Divergence:
    divergence_type: DivergenceType
    indicator: str
    start_idx: int
    end_idx: int
    confidence: float
    description: str


@dataclass
class MomentumScore:
    momentum_score: float
    trend_score: float
    signal_score: float
    strength_score: float
    confidence_score: float
    composite_score: float
    components: dict = field(default_factory=dict)


@dataclass
class BenchmarkResult:
    iterations: int
    total_seconds: float
    avg_ms: float
    ops_per_second: float
    memory_bytes: int = 0
