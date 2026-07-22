from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class MarketRegimeSchema(str, Enum):
    STRONG_BULL = "strong_bull"
    BULL = "bull"
    WEAK_BULL = "weak_bull"
    SIDEWAYS = "sideways"
    WEAK_BEAR = "weak_bear"
    BEAR = "bear"
    STRONG_BEAR = "strong_bear"
    RECOVERY = "recovery"
    DISTRIBUTION = "distribution"
    ACCUMULATION = "accumulation"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"


class DetectionSignalSchema(str, Enum):
    MOVING_AVERAGE_STRUCTURE = "moving_average_structure"
    BREADTH_INDICATORS = "breadth_indicators"
    VOLATILITY = "volatility"
    MOMENTUM = "momentum"
    TREND_STRENGTH = "trend_strength"
    VOLUME_EXPANSION = "volume_expansion"
    SECTOR_ROTATION = "sector_rotation"
    LIQUIDITY = "liquidity"
    MARKET_PARTICIPATION = "market_participation"


class InvestmentHorizonSchema(str, Enum):
    WEEKLY = "weekly"
    MONTH_1 = "1_month"
    MONTH_3 = "3_months"
    MONTH_6 = "6_months"
    MONTH_12 = "12_months"


class ReportTypeSchema(str, Enum):
    CURRENT_REGIME = "current_regime"
    REGIME_HISTORY = "regime_history"
    REGIME_CHANGES = "regime_changes"
    SECTOR_ROTATION = "sector_rotation"
    EXPECTED_NEXT_REGIME = "expected_next_regime"
    RISK_IMPLICATIONS = "risk_implications"
    FULL = "full"


class SectorStrengthSchema(str, Enum):
    LEADING = "leading"
    WEAK = "weak"
    NEUTRAL = "neutral"
    ROTATING = "rotating"


class StrategyProfileSchema(str, Enum):
    AGGRESSIVE_GROWTH = "aggressive_growth"
    MODERATE_GROWTH = "moderate_growth"
    BALANCED = "balanced"
    DEFENSIVE = "defensive"
    VERY_DEFENSIVE = "very_defensive"
    MARKET_NEUTRAL = "market_neutral"
    MOMENTUM = "momentum"
    MEAN_REVERSION = "mean_reversion"


class RegimeSignalSchema(BaseModel):
    signal_type: str = "moving_average_structure"
    value: float = 0.0
    normalized_value: float = 0.0
    confidence: float = 0.0
    weight: float = 1.0
    description: str = ""


class RegimeClassificationSchema(BaseModel):
    regime: str = "sideways"
    confidence: float = 0.0
    score: float = 0.0
    stability: float = 0.0
    transition_probabilities: Dict[str, float] = Field(default_factory=dict)
    contributing_signals: Dict[str, float] = Field(default_factory=dict)


class SectorAnalysisSchema(BaseModel):
    sector_name: str = ""
    strength: str = "neutral"
    score: float = 0.0
    relative_performance: float = 0.0
    momentum: float = 0.0
    volume_trend: float = 0.0


class RegimeTransitionSchema(BaseModel):
    from_regime: str = "sideways"
    to_regime: str = "sideways"
    transition_type: str = "continuation"
    probability: float = 0.0
    historical_frequency: float = 0.0
    avg_duration_days: int = 0


class RegimeHistoryEntrySchema(BaseModel):
    date: str = ""
    regime: str = "sideways"
    confidence: float = 0.0
    score: float = 0.0
    stability: float = 0.0
    duration_days: int = 0


class RegimeAnalysisRequestSchema(BaseModel):
    reference_date: str = ""
    horizon: str = "3_months"
    signals: List[str] = Field(default_factory=list)
    market_data: Dict[str, float] = Field(default_factory=dict)
    sector_data: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    lookback_days: int = 252
    min_confidence: float = 0.3
    include_transitions: bool = True
    include_sectors: bool = True
    seed: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RegimeAnalysisResultSchema(BaseModel):
    reference_date: str = ""
    classification: RegimeClassificationSchema = Field(default_factory=RegimeClassificationSchema)
    sectors: List[SectorAnalysisSchema] = Field(default_factory=list)
    transitions: List[RegimeTransitionSchema] = Field(default_factory=list)
    history: List[RegimeHistoryEntrySchema] = Field(default_factory=list)
    strategy_profile: str = "balanced"
    risk_implications: Dict[str, Any] = Field(default_factory=dict)
    next_regime_prediction: Optional[RegimeClassificationSchema] = None
    execution_time_ms: float = 0.0


class CacheStatsSchema(BaseModel):
    size: int = 0
    hits: int = 0
    misses: int = 0
    hit_rate: float = 0.0
    max_size: int = 0
    ttl_seconds: float = 0.0


class BenchmarkResultSchema(BaseModel):
    operation: str = ""
    iterations: int = 0
    avg_time_ms: float = 0.0
    min_time_ms: float = 0.0
    max_time_ms: float = 0.0
    std_dev_ms: float = 0.0
    total_time_ms: float = 0.0
    memory_mb: float = 0.0
    success: bool = True
    error_message: str = ""


class RegimeCurrentResponse(BaseModel):
    regime: str = ""
    confidence: float = 0.0
    score: float = 0.0
    stability: float = 0.0
    strategy_profile: str = ""
    risk_level: float = 0.0
    contributing_signals: Dict[str, float] = Field(default_factory=dict)
    reference_date: str = ""


class RegimeHistoryResponse(BaseModel):
    history: List[RegimeHistoryEntrySchema] = Field(default_factory=list)
    total_entries: int = 0


class RegimeSectorsResponse(BaseModel):
    sectors: List[SectorAnalysisSchema] = Field(default_factory=list)
    leading_sectors: List[str] = Field(default_factory=list)
    weak_sectors: List[str] = Field(default_factory=list)


class RegimeTransitionsResponse(BaseModel):
    transitions: List[RegimeTransitionSchema] = Field(default_factory=list)
    current_regime: str = ""
    predicted_next: Optional[str] = None


class RegimeReportResponse(BaseModel):
    report_type: str = "current_regime"
    summary: Dict[str, Any] = Field(default_factory=dict)
    details: Dict[str, Any] = Field(default_factory=dict)
