from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from modules.decision_engine.core.types import (
    ConflictSeverity,
    DecisionType,
    DecisionUrgency,
    EntryTiming,
    ExitAction,
    InvestmentHorizon,
    ReportType,
)


class EngineDataSchema(BaseModel):
    score: float = Field(0.0, ge=0.0, le=100.0)
    confidence: float = Field(0.0, ge=0.0, le=100.0)
    signals: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: Optional[str] = None


class DecisionGenerateRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    engine_data: Dict[str, EngineDataSchema] = Field(default_factory=dict)
    sector: str = Field(default="")
    profile: str = Field(default="balanced")
    existing_positions: Optional[Dict[str, Dict[str, Any]]] = None


class EntryGuidanceSchema(BaseModel):
    timing: str = Field(default="no_entry")
    suggested_entry_price: Optional[float] = None
    scale_in_levels: List[float] = Field(default_factory=list)
    max_position_pct: float = Field(default=0.0)
    rationale: str = Field(default="")


class ExitGuidanceSchema(BaseModel):
    action: str = Field(default="hold")
    initial_target: Optional[float] = None
    secondary_target: Optional[float] = None
    risk_stop: Optional[float] = None
    trailing_stop_pct: Optional[float] = None
    review_days: int = Field(default=30)
    rationale: str = Field(default="")


class PortfolioImpactSchema(BaseModel):
    diversification_effect: float = Field(default=0.0)
    sector_concentration: float = Field(default=0.0)
    risk_contribution: float = Field(default=0.0)
    position_size_suggestion: float = Field(default=0.0)
    existing_overlap: List[str] = Field(default_factory=list)


class HorizonRecommendationSchema(BaseModel):
    horizon: str
    decision: str
    score: float
    confidence: float
    entry: EntryGuidanceSchema
    exit: ExitGuidanceSchema
    summary: str = ""


class DimensionScoreSchema(BaseModel):
    dimension: str
    raw_score: float
    normalized_score: float
    weight: float
    contribution: float
    confidence: float
    evidence: List[str] = Field(default_factory=list)


class ConflictSchema(BaseModel):
    dimension_a: str
    dimension_b: str
    severity: str
    description: str
    explanation: str


class BonusPenaltySchema(BaseModel):
    factor: str
    value: float
    description: str


class RecommendationResponse(BaseModel):
    symbol: str
    decision: str
    decision_score: float
    decision_confidence: float
    decision_risk: float
    decision_urgency: str
    decision_stability: float
    summary: str
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    evidence: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    risk_factors: List[str] = Field(default_factory=list)
    holding_period: str = ""
    entry: EntryGuidanceSchema
    exit: ExitGuidanceSchema
    portfolio_impact: PortfolioImpactSchema
    horizon_recommendations: List[HorizonRecommendationSchema] = Field(default_factory=list)
    dimension_scores: Dict[str, DimensionScoreSchema] = Field(default_factory=dict)
    conflicts: List[ConflictSchema] = Field(default_factory=list)
    bonuses: List[BonusPenaltySchema] = Field(default_factory=list)
    penalties: List[BonusPenaltySchema] = Field(default_factory=list)
    generated_at: str = ""
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DecisionListItem(BaseModel):
    symbol: str
    decision: str
    decision_score: float
    decision_confidence: float
    decision_urgency: str
    summary: str


class DecisionListResponse(BaseModel):
    items: List[DecisionListItem] = Field(default_factory=list)
    total: int = 0
    generated_at: str = ""


class DecisionTopResponse(BaseModel):
    items: List[DecisionListItem] = Field(default_factory=list)
    count: int = 0
    generated_at: str = ""


class DecisionHistoryItem(BaseModel):
    symbol: str
    decision: str
    score: float
    confidence: float
    generated_at: str


class DecisionHistoryResponse(BaseModel):
    symbol: str
    history: List[DecisionHistoryItem] = Field(default_factory=list)
    total: int = 0


class BenchmarkResponse(BaseModel):
    operation: str
    iterations: int
    avg_time_ms: float
    min_time_ms: float
    max_time_ms: float
    success: bool


class CacheStatsResponse(BaseModel):
    size: int
    max_size: int
    hits: int
    misses: int
    hit_rate: float
    ttl_seconds: int


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    engines_available: int = 0
    cache_stats: Optional[CacheStatsResponse] = None


class ReportRequest(BaseModel):
    symbol: str = Field(..., min_length=1)
    report_type: str = Field(default="executive")
    decision_data: Optional[Dict[str, Any]] = None


class ReportResponse(BaseModel):
    symbol: str
    report_type: str
    content: str
    generated_at: str
    sections: Dict[str, str] = Field(default_factory=dict)
