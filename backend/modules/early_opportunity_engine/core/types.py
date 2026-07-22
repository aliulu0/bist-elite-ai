from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class OpportunityStage(str, Enum):
    STAGE_0_IGNORE = "stage_0_ignore"
    STAGE_1_SILENT_ACCUMULATION = "stage_1_silent_accumulation"
    STAGE_2_EARLY_SMART_MONEY = "stage_2_early_smart_money"
    STAGE_3_INSTITUTIONAL_ACCUMULATION = "stage_3_institutional_accumulation"
    STAGE_4_BREAKOUT_PREPARATION = "stage_4_breakout_preparation"
    STAGE_5_BREAKOUT = "stage_5_breakout"
    STAGE_6_TREND_EXPANSION = "stage_6_trend_expansion"
    STAGE_7_LATE_OPPORTUNITY = "stage_7_late_opportunity"


class OpportunityRating(str, Enum):
    VERY_LOW = "Very Low"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    VERY_HIGH = "Very High"
    EXCEPTIONAL = "Exceptional"


class MarketRegimeType(str, Enum):
    BULL = "bull"
    BEAR = "bear"
    SIDEWAYS = "sideways"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"


class SignalType(str, Enum):
    STRONG_BUY = "STRONG_BUY"
    BUY = "BUY"
    NEUTRAL = "NEUTRAL"
    SELL = "SELL"
    STRONG_SELL = "STRONG_SELL"
    WAIT = "WAIT"


class AlertType(str, Enum):
    OPPORTUNITY = "opportunity"
    RISK = "risk"
    MOMENTUM = "momentum"
    VOLUME = "volume"
    SMART_MONEY = "smart_money"


class RedFlagType(str, Enum):
    WEAK_VOLUME = "weak_volume"
    WEAK_EARNINGS = "weak_earnings"
    HIGH_DEBT = "high_debt"
    OVERBOUGHT = "overbought"
    LIQUIDITY_RISK = "liquidity_risk"
    DISTRIBUTION = "distribution"
    LATE_TREND = "late_trend"


class ExpectedWindow(str, Enum):
    ONE_WEEK = "1 week"
    TWO_WEEKS = "2 weeks"
    ONE_MONTH = "1 month"
    THREE_MONTHS = "3 months"
    SIX_MONTHS = "6 months"
    TWELVE_MONTHS = "12 months"


class AnalysisCategory(str, Enum):
    FINANCIAL = "financial"
    TECHNICAL = "technical"
    VOLUME = "volume"
    SMART_MONEY = "smart_money"
    PATTERN = "pattern"
    RISK = "risk"
    SIMILARITY = "similarity"


@dataclass
class AnalysisSignal:
    category: AnalysisCategory
    name: str
    strength: float
    confidence: float
    description: str
    weight: float = 1.0
    metadata: dict = field(default_factory=dict)


@dataclass
class StageResult:
    category: AnalysisCategory
    score: float
    signals: list[AnalysisSignal] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    details: str = ""
    calculation_time_ms: float = 0.0


@dataclass
class RiskAssessment:
    score: float
    drawdown_probability: float
    liquidity_risk: float
    volatility_risk: float
    sector_risk: float
    details: list[str] = field(default_factory=list)


@dataclass
class SimilarityAnalysis:
    score: float
    similar_symbols: list[str] = field(default_factory=list)
    historical_success_rate: float = 0.0
    timeline_match: str = ""
    details: str = ""


@dataclass
class MarketRegime:
    regime: MarketRegimeType
    confidence: float
    volatility_level: float = 0.0
    trend_strength: float = 0.0
    details: str = ""


@dataclass
class EvidenceItem:
    category: str
    finding: str
    strength: float
    confidence: float
    source: str = ""


@dataclass
class EvidencePackage:
    items: list[EvidenceItem] = field(default_factory=list)
    score: float = 0.0
    summary: str = ""


@dataclass
class EarlyWarning:
    alert_type: AlertType
    message: str
    severity: float
    timestamp: str = ""


@dataclass
class RedFlag:
    flag_type: RedFlagType
    severity: float
    description: str
    metric: str = ""
    value: float = 0.0


@dataclass
class OpportunityScore:
    overall: float
    financial: float = 0.0
    technical: float = 0.0
    volume: float = 0.0
    smart_money: float = 0.0
    pattern: float = 0.0
    risk: float = 0.0
    similarity: float = 0.0
    regime_adjustment: float = 1.0


@dataclass
class ExpectedReturn:
    conservative: float = 0.0
    expected: float = 0.0
    optimistic: float = 0.0


@dataclass
class OpportunityResult:
    symbol: str
    opportunity_score: float
    rating: OpportunityRating
    stage: OpportunityStage
    confidence: float
    risk: RiskAssessment
    expected_window: ExpectedWindow
    expected_return: ExpectedReturn
    evidence: EvidencePackage
    similarity: SimilarityAnalysis
    market_regime: MarketRegimeType
    stage_results: list[StageResult] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    red_flags: list[RedFlag] = field(default_factory=list)
    early_warnings: list[EarlyWarning] = field(default_factory=list)
    explanations: list[str] = field(default_factory=list)
    timestamp: str = ""


@dataclass
class RankedOpportunity:
    symbol: str
    opportunity_score: float
    rating: str
    stage: str
    confidence: float
    risk_score: float
    expected_return: float


@dataclass
class OpportunityMetadata:
    symbol: str
    analyzed_at: str
    pipeline_version: str = "1.0.0"
    stages_completed: int = 0
    total_signals: int = 0
    calculation_time_ms: float = 0.0


@dataclass
class BenchmarkResult:
    iterations: int
    total_seconds: float
    avg_ms: float
    ops_per_second: float
    memory_bytes: int = 0
