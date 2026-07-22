from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SimilarityMethodSchema(str, Enum):
    WEIGHTED_FEATURE = "weighted_feature"
    COSINE = "cosine"
    EUCLIDEAN = "euclidean"
    MANHATTAN = "manhattan"
    DYNAMIC_TIME_WARPING = "dynamic_time_warping"
    HYBRID = "hybrid"


class SimilarityLabelSchema(str, Enum):
    VERY_WEAK = "very_weak"
    WEAK = "weak"
    MODERATE = "moderate"
    STRONG = "strong"
    VERY_STRONG = "very_strong"
    EXCEPTIONAL = "exceptional"


class MarketRegimeSchema(str, Enum):
    BULL = "bull"
    BEAR = "bear"
    SIDEWAYS = "sideways"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"


class PatternOutcomeSchema(str, Enum):
    SUCCESSFUL = "successful"
    FAILED = "failed"
    NEUTRAL = "neutral"


class FeatureCategorySchema(str, Enum):
    FINANCIAL = "financial"
    GROWTH = "growth"
    PROFITABILITY = "profitability"
    VALUATION = "valuation"
    MOMENTUM = "momentum"
    TREND = "trend"
    VOLUME = "volume"
    PATTERN = "pattern"
    SECTOR = "sector"
    MARKET_REGIME = "market_regime"


class ReportTypeSchema(str, Enum):
    EXECUTIVE_SUMMARY = "executive_summary"
    TOP_SIMILAR_STOCKS = "top_similar_stocks"
    PERFORMANCE_COMPARISON = "performance_comparison"
    SIMILARITY_HEATMAP = "similarity_heatmap"
    FEATURE_COMPARISON = "feature_comparison"
    RISK_COMPARISON = "risk_comparison"
    FULL = "full"


class ValidationPeriodSchema(str, Enum):
    ONE_WEEK = "1w"
    ONE_MONTH = "1m"
    THREE_MONTHS = "3m"
    SIX_MONTHS = "6m"
    TWELVE_MONTHS = "12m"


class FeatureVectorSchema(BaseModel):
    symbol: str = ""
    date: str = ""
    features: Dict[str, float] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SimilarityResultSchema(BaseModel):
    source_symbol: str = ""
    target_symbol: str = ""
    target_date: str = ""
    similarity_score: float = 0.0
    similarity_label: str = "moderate"
    method: str = "weighted_feature"
    feature_distances: Dict[str, float] = Field(default_factory=dict)
    contributing_features: Dict[str, float] = Field(default_factory=dict)
    historical_outcome: Dict[str, float] = Field(default_factory=dict)
    pattern_outcome: str = "neutral"
    market_regime: str = "sideways"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class HistoricalOutcomeSchema(BaseModel):
    period_return: Dict[str, float] = Field(default_factory=dict)
    max_drawdown: float = 0.0
    win_rate: float = 0.0
    holding_period_days: int = 0
    avg_return: float = 0.0
    total_cases: int = 0
    successful_cases: int = 0
    failed_cases: int = 0
    neutral_cases: int = 0


class PatternMemorySchema(BaseModel):
    symbol: str = ""
    date: str = ""
    outcome: str = "neutral"
    return_pct: float = 0.0
    holding_period_days: int = 0
    market_regime: str = "sideways"
    similarity_score: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SimilarityRequestSchema(BaseModel):
    symbol: str = ""
    reference_date: str = ""
    top_n: int = 5
    methods: List[str] = Field(default_factory=lambda: ["weighted_feature"])
    feature_categories: List[str] = Field(default_factory=list)
    market_regime: Optional[str] = None
    min_similarity: float = 0.3
    lookback_days: int = 252
    validation_periods: List[str] = Field(default_factory=lambda: ["1w", "1m", "3m"])
    weights: Dict[str, float] = Field(default_factory=dict)
    seed: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SimilarityAnalysisSchema(BaseModel):
    symbol: str = ""
    reference_date: str = ""
    results: List[SimilarityResultSchema] = Field(default_factory=list)
    top_similar_stocks: List[SimilarityResultSchema] = Field(default_factory=list)
    historical_outcomes: Dict[str, HistoricalOutcomeSchema] = Field(default_factory=dict)
    pattern_memories: List[PatternMemorySchema] = Field(default_factory=list)
    overall_similarity: float = 0.0
    confidence_score: float = 0.0
    regime_distribution: Dict[str, int] = Field(default_factory=dict)
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)


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


class SimilarityListResponse(BaseModel):
    results: List[SimilarityResultSchema] = Field(default_factory=list)
    total: int = 0


class SimilarityTopResponse(BaseModel):
    symbol: str = ""
    top_stocks: List[SimilarityResultSchema] = Field(default_factory=list)
    total: int = 0


class SimilarityReportResponse(BaseModel):
    report_type: str = "executive_summary"
    symbol: str = ""
    summary: Dict[str, Any] = Field(default_factory=dict)
    details: Dict[str, Any] = Field(default_factory=dict)
