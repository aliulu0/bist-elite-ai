from __future__ import annotations

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class CalculateEliteRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    scores: Dict[str, float] = Field(..., description="Source engine scores")
    dimension_scores: Dict[str, float] = Field(default_factory=dict, description="17 dimension scores")
    breakdowns: Optional[Dict[str, Any]] = None
    profile_name: str = Field(default="balanced")
    horizon: str = Field(default="one_month")
    regime: str = Field(default="sideways")
    sector: str = Field(default="other")


class DimensionContributionResponse(BaseModel):
    dimension: str
    raw_score: float
    normalized_score: float
    weighted_score: float
    contribution: float
    direction: str
    weight: float
    confidence: float
    evidence_count: int


class BonusResponse(BaseModel):
    factor: str
    points: float
    condition: str
    applied_count: int


class PenaltyResponse(BaseModel):
    factor: str
    points: float
    condition: str
    applied_count: int


class EliteScoreResponse(BaseModel):
    symbol: str
    elite_score: float
    elite_category: str
    label: str
    dimension_contributions: Dict[str, DimensionContributionResponse]
    bonuses: List[BonusResponse]
    penalties: List[PenaltyResponse]
    raw_score: float
    total_weight: float
    confidence: float
    evidence_count: int
    horizon: str
    regime: str
    sector: str
    calculated_at: str
    calculation_id: str


class EliteListRequest(BaseModel):
    symbols: List[str] = Field(..., min_length=1, max_length=700)
    scores: Dict[str, Dict[str, float]] = Field(
        default_factory=dict, description="symbol -> source scores"
    )
    profile_name: str = Field(default="balanced")
    horizon: str = Field(default="one_month")
    regime: str = Field(default="sideways")
    sector: str = Field(default="other")


class EliteListResponse(BaseModel):
    results: List[EliteScoreResponse]
    count: int
    total_requested: int


class EliteTopRequest(BaseModel):
    n: int = Field(default=10, ge=1, le=700)
    horizon: str = Field(default="one_month")
    regime: str = Field(default="sideways")
    sector: Optional[str] = None


class EliteRankingEntryResponse(BaseModel):
    symbol: str
    elite_score: float
    elite_category: str
    label: str
    rank: int
    previous_rank: Optional[int]
    rank_change: int
    trend: str
    sector: str
    horizon: str
    period: str
    calculated_at: str


class EliteRankingResponse(BaseModel):
    entries: List[EliteRankingEntryResponse]
    count: int
    period: str
    horizon: str


class EliteHistoryResponse(BaseModel):
    symbol: str
    history: List[Dict[str, Any]]
    count: int


class EliteDetailsResponse(BaseModel):
    symbol: str
    elite_score: float
    elite_category: str
    label: str
    dimension_contributions: Dict[str, DimensionContributionResponse]
    bonuses: List[BonusResponse]
    penalties: List[PenaltyResponse]
    trend: Optional[str]
    ranking: Optional[EliteRankingEntryResponse]
    history_count: int


class ProfileResponse(BaseModel):
    name: str
    description: str
    dimensions: Dict[str, float]
    bonus_count: int
    penalty_count: int
    is_active: bool


class ProfileListResponse(BaseModel):
    profiles: List[ProfileResponse]
    count: int


class CacheStatsResponse(BaseModel):
    size: int
    max_size: int
    hits: int
    misses: int
    hit_rate: float
    ttl_seconds: int


class BenchmarkRequest(BaseModel):
    iterations: int = Field(default=10, ge=1, le=1000)
    warmup: int = Field(default=3, ge=0, le=100)
    symbol: str = Field(default="TUPRS")
    profile_name: str = Field(default="balanced")
    horizon: str = Field(default="one_month")
    regime: str = Field(default="sideways")
    sector: str = Field(default="other")


class BenchmarkResponse(BaseModel):
    operation: str
    execution_time_ms: float
    memory_mb: float
    iterations: int
    avg_time_ms: float
    min_time_ms: float
    max_time_ms: float
    p95_time_ms: float
    success: bool
    error_message: Optional[str] = None


class ValidateRequest(BaseModel):
    scores: Optional[Dict[str, float]] = None
    dimension_scores: Optional[Dict[str, float]] = None
    profile_name: Optional[str] = None


class ValidateResponse(BaseModel):
    is_valid: bool
    errors: List[str]


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
