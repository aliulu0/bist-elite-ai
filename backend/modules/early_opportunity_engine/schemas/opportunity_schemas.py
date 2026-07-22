from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class AnalysisSignalSchema(BaseModel):
    name: str
    category: str
    strength: float = Field(ge=0, le=1)
    confidence: float = Field(ge=0, le=1)
    description: str = ""


class StageResultSchema(BaseModel):
    category: str
    score: float = Field(ge=0, le=1)
    signal_count: int = 0
    warning_count: int = 0
    signals: list[AnalysisSignalSchema] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class RiskAssessmentSchema(BaseModel):
    score: float = Field(ge=0, le=1)
    drawdown_probability: float = Field(ge=0, le=1)
    liquidity_risk: float = Field(ge=0, le=1)
    volatility_risk: float = Field(ge=0, le=1)
    sector_risk: float = Field(ge=0, le=1)
    details: list[str] = Field(default_factory=list)


class SimilarityAnalysisSchema(BaseModel):
    score: float = Field(ge=0, le=1)
    similar_symbols: list[str] = Field(default_factory=list)
    historical_success_rate: float = Field(ge=0, le=1)
    timeline_match: str = ""
    details: str = ""


class ExpectedReturnSchema(BaseModel):
    conservative: float = 0.0
    expected: float = 0.0
    optimistic: float = 0.0


class OpportunityResultSchema(BaseModel):
    symbol: str
    opportunity_score: float = Field(ge=0, le=100)
    rating: str
    stage: str
    confidence: float = Field(ge=0, le=100)
    risk: RiskAssessmentSchema
    expected_window: str
    expected_return: ExpectedReturnSchema
    market_regime: str
    warnings: list[str] = Field(default_factory=list)
    red_flags_count: int = 0
    early_warnings_count: int = 0
    explanations: list[str] = Field(default_factory=list)
    timestamp: str = ""


class RankedOpportunitySchema(BaseModel):
    symbol: str
    opportunity_score: float
    rating: str
    stage: str
    confidence: float
    risk_score: float
    expected_return: float
    rank: int = 0


class AnalyzeRequest(BaseModel):
    symbol: str
    metrics: dict
    market_regime: Optional[str] = None


class AnalyzeResponse(BaseModel):
    result: OpportunityResultSchema
    stage_results: list[StageResultSchema] = Field(default_factory=list)
    elapsed_ms: float = 0.0


class BatchAnalyzeRequest(BaseModel):
    symbols: list[str]
    metrics: dict[str, dict]
    market_regime: Optional[str] = None
    limit: int = 50


class BatchAnalyzeResponse(BaseModel):
    results: list[OpportunityResultSchema]
    count: int = 0
    elapsed_ms: float = 0.0


class OpportunityListResponse(BaseModel):
    results: list[RankedOpportunitySchema]
    total: int = 0


class OpportunityDetailResponse(BaseModel):
    symbol: str
    result: OpportunityResultSchema
    stage_results: list[StageResultSchema]


class OpportunityHistoryEntry(BaseModel):
    symbol: str
    score: float
    rating: str
    stage: str
    timestamp: str


class OpportunityHistoryResponse(BaseModel):
    history: list[OpportunityHistoryEntry]
    total: int = 0


class OpportunitySummaryResponse(BaseModel):
    total: int
    avg_score: float
    avg_confidence: float
    avg_risk: float
    exceptional: int
    very_high: int
    high: int
    medium: int
    low: int
    very_low: int


class ValidateRequest(BaseModel):
    metrics: dict
    symbol: str = "TEST"


class ValidateResponse(BaseModel):
    valid: bool
    errors: list[str] = Field(default_factory=list)
    analyzable: bool = False
    message: str = ""


class CacheStatsResponse(BaseModel):
    size: int
    hits: int
    misses: int
    hit_rate: float
    ttl: int
    max_size: int
