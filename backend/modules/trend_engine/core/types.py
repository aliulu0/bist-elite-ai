from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class TrendPhase(str, Enum):
    EMERGING = "emerging"
    STRENGTHENING = "strengthening"
    MATURE = "mature"
    EXHAUSTING = "exhausting"
    REVERSING = "reversing"
    SIDEWAYS = "sideways"


class BreakoutType(str, Enum):
    RESISTANCE_BREAKOUT = "resistance_breakout"
    SUPPORT_BREAKDOWN = "support_breakdown"
    FAKE_BREAKOUT = "fake_breakout"
    FALSE_BREAKDOWN = "false_breakdown"
    NONE = "none"


class PullbackType(str, Enum):
    HEALTHY = "healthy"
    WEAK = "weak"
    DEEP = "deep"
    NONE = "none"


class TrendDirection(str, Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"


class SignalType(str, Enum):
    STRONG_BUY = "STRONG_BUY"
    BUY = "BUY"
    NEUTRAL = "NEUTRAL"
    SELL = "SELL"
    STRONG_SELL = "STRONG_SELL"
    WAIT = "WAIT"


class TimeframeType(str, Enum):
    M5 = "5m"
    M15 = "15m"
    H1 = "1H"
    H4 = "4H"
    DAILY = "Daily"
    WEEKLY = "Weekly"
    MONTHLY = "Monthly"


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
class TrendResult:
    primary_trend: TrendDirection = TrendDirection.NEUTRAL
    secondary_trend: TrendDirection = TrendDirection.NEUTRAL
    micro_trend: TrendDirection = TrendDirection.NEUTRAL
    phase: TrendPhase = TrendPhase.SIDEWAYS
    strength: float = 0.0
    age: int = 0
    stability: float = 0.0
    exhaustion: float = 0.0
    continuation: float = 0.0
    reversal_probability: float = 0.0


@dataclass
class BreakoutResult:
    breakout_type: BreakoutType = BreakoutType.NONE
    level: float = 0.0
    confidence: float = 0.0
    confirmed: bool = False
    retest: bool = False
    description: str = ""


@dataclass
class PullbackResult:
    pullback_type: PullbackType = PullbackType.NONE
    depth: float = 0.0
    recovery: float = 0.0
    trend_resuming: bool = False
    description: str = ""


@dataclass
class TrendScore:
    trend_score: float = 0.0
    breakout_score: float = 0.0
    continuation_score: float = 0.0
    reversal_score: float = 0.0
    confidence: float = 0.0
    components: dict = field(default_factory=dict)


@dataclass
class BenchmarkResult:
    iterations: int
    total_seconds: float
    avg_ms: float
    ops_per_second: float
    memory_bytes: int = 0


@dataclass
class TrendTimeframeData:
    timeframe: str = ""
    trend: TrendDirection = TrendDirection.NEUTRAL
    strength: float = 0.0
    phase: TrendPhase = TrendPhase.SIDEWAYS
    indicator_results: dict = field(default_factory=dict)
