from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class PatternCategory(str, Enum):
    CLASSICAL = "classical"
    CANDLESTICK = "candlestick"
    SMC = "smc"
    WYCKOFF = "wyckoff"
    ELLIOTT = "elliott"


class PatternDirection(str, Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"


class PatternStatus(str, Enum):
    FORMING = "forming"
    CONFIRMED = "confirmed"
    BROKEN = "broken"
    FAILED = "failed"


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


class SwingType(str, Enum):
    HIGH = "high"
    LOW = "low"


@dataclass
class PriceBar:
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float = 0.0
    turnover: float = 0.0


@dataclass
class SwingPoint:
    index: int
    price: float
    swing_type: SwingType
    date: str = ""


@dataclass
class PatternResult:
    pattern_name: str
    category: PatternCategory
    direction: PatternDirection = PatternDirection.NEUTRAL
    status: PatternStatus = PatternStatus.FORMING
    confidence: float = 0.0
    probability: float = 0.0
    risk: float = 0.0
    expected_target: float = 0.0
    expected_duration: int = 0
    expected_pullback: float = 0.0
    pattern_quality: float = 0.0
    confirmation_score: float = 0.0
    entry_price: float = 0.0
    stop_loss: float = 0.0
    take_profit: float = 0.0
    start_index: int = 0
    end_index: int = 0
    key_levels: list[float] = field(default_factory=list)
    description: str = ""
    warnings: list[str] = field(default_factory=list)
    calculation_time_ms: float = 0.0


@dataclass
class DetectedPattern:
    pattern_name: str
    category: PatternCategory
    direction: PatternDirection
    status: PatternStatus
    confidence: float
    probability: float
    risk: float
    expected_target: float
    expected_duration: int
    expected_pullback: float
    pattern_quality: float
    confirmation_score: float
    entry_price: float
    stop_loss: float
    take_profit: float
    start_date: str = ""
    end_date: str = ""
    start_index: int = 0
    end_index: int = 0
    key_levels: list[float] = field(default_factory=list)
    description: str = ""


@dataclass
class BacktestResult:
    historical_success_rate: float = 0.0
    six_month_success: float = 0.0
    twelve_month_success: float = 0.0
    average_return: float = 0.0
    average_drawdown: float = 0.0
    sample_size: int = 0


@dataclass
class SimilarityResult:
    similarity_score: float = 0.0
    similar_patterns: list[dict] = field(default_factory=list)
    top_historical_match: str = ""


@dataclass
class ExplanationResult:
    why_detected: str = ""
    why_important: str = ""
    confirmation_status: str = ""
    missing_confirmations: list[str] = field(default_factory=list)
    elite_score_contribution: float = 0.0


@dataclass
class PatternAnalysis:
    detected_patterns: list[DetectedPattern] = field(default_factory=list)
    total_patterns: int = 0
    bullish_count: int = 0
    bearish_count: int = 0
    avg_confidence: float = 0.0
    dominant_direction: PatternDirection = PatternDirection.NEUTRAL
    backtest: BacktestResult = field(default_factory=BacktestResult)
    similarity: SimilarityResult = field(default_factory=SimilarityResult)
    explanation: ExplanationResult = field(default_factory=ExplanationResult)


@dataclass
class BenchmarkResult:
    iterations: int
    total_seconds: float
    avg_ms: float
    ops_per_second: float
    memory_bytes: int = 0
