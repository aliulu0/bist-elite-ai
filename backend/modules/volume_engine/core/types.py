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


class SmartMoneyType(str, Enum):
    INSTITUTIONAL_ACCUMULATION = "institutional_accumulation"
    INSTITUTIONAL_DISTRIBUTION = "institutional_distribution"
    HIDDEN_BUYING = "hidden_buying"
    HIDDEN_SELLING = "hidden_selling"
    SILENT_ACCUMULATION = "silent_accumulation"
    VOLUME_SPIKE = "volume_spike"
    LIQUIDITY_SWEEP = "liquidity_sweep"
    ABSORPTION = "absorption"
    DEMAND_ZONE = "demand_zone"
    SUPPLY_ZONE = "supply_zone"
    HIGH_VOLUME_NODE = "high_volume_node"
    LOW_VOLUME_NODE = "low_volume_node"
    NONE = "none"


class VolumeNodeType(str, Enum):
    HIGH = "high_volume_node"
    LOW = "low_volume_node"
    BALANCED = "balanced"


class UnusualActivityType(str, Enum):
    EXTREME_VOLUME = "extreme_volume"
    UNUSUAL_VOLUME = "unusual_volume"
    BLOCK_ACTIVITY = "block_activity"
    SUDDEN_PARTICIPATION = "sudden_participation"
    LOW_FLOAT_ACTIVITY = "low_float_activity"
    HIGH_PARTICIPATION = "high_participation"
    NONE = "none"


class BreakoutConfirmation(str, Enum):
    CONFIRMED = "confirmed"
    UNCONFIRMED = "unconfirmed"
    FAKE = "fake"
    NONE = "none"


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
class SmartMoneyResult:
    detection_type: SmartMoneyType = SmartMoneyType.NONE
    confidence: float = 0.0
    strength: float = 0.0
    description: str = ""
    volume_ratio: float = 1.0
    price_impact: float = 0.0


@dataclass
class LiquidityResult:
    liquidity_score: float = 0.0
    turnover_score: float = 0.0
    spread_score: float = 0.0
    trade_activity: float = 0.0
    avg_daily_volume: float = 0.0
    market_participation: float = 0.0


@dataclass
class InstitutionalScore:
    smart_money_score: float = 0.0
    institutional_confidence: float = 0.0
    accumulation_score: float = 0.0
    distribution_score: float = 0.0
    liquidity_score: float = 0.0
    breakout_confirmation: float = 0.0
    components: dict = field(default_factory=dict)


@dataclass
class VolumeAnalysis:
    volume_sma: float = 0.0
    volume_ema: float = 0.0
    relative_volume: float = 1.0
    volume_growth: float = 0.0
    volume_decay: float = 0.0
    volume_momentum: float = 0.0
    volume_acceleration: float = 0.0
    volume_percentile: float = 50.0
    volume_z_score: float = 0.0
    volume_rank: float = 50.0


@dataclass
class UnusualActivityResult:
    activity_type: UnusualActivityType = UnusualActivityType.NONE
    confidence: float = 0.0
    volume_multiple: float = 1.0
    description: str = ""


@dataclass
class VolumeScore:
    volume_score: float = 0.0
    liquidity_score: float = 0.0
    participation_score: float = 0.0
    institutional_score: float = 0.0
    confidence: float = 0.0
    components: dict = field(default_factory=dict)


@dataclass
class BenchmarkResult:
    iterations: int
    total_seconds: float
    avg_ms: float
    ops_per_second: float
    memory_bytes: int = 0
