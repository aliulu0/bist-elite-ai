from __future__ import annotations

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class CalculateConfidenceRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    scores: Dict[str, float] = Field(default_factory=dict)
    dimension_scores: Optional[Dict[str, float]] = None
    breakdowns: Optional[Dict[str, Any]] = None
    profile_name: str = Field(default="standard")
    source_data: Optional[Dict[str, Any]] = None


class DimensionContributionResponse(BaseModel):
    dimension: str
    raw_score: float
    normalized_score: float
    weighted_score: float
    contribution: float
    weight: float
    confidence: float
    evidence_count: int
    details: Dict[str, Any]


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


class WarningResponse(BaseModel):
    dimension: str
    message: str
    severity: str


class ConfidenceScoreResponse(BaseModel):
    symbol: str
    confidence_score: float
    confidence_label: str
    dimension_contributions: Dict[str, DimensionContributionResponse]
    bonuses: List[BonusResponse]
    penalties: List[PenaltyResponse]
    warnings: List[WarningResponse]
    raw_score: float
    total_weight: float
    calculated_at: str
    calculation_id: str


class ConfidenceListRequest(BaseModel):
    symbols: List[str] = Field(..., min_length=1, max_length=700)
    scores: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    profile_name: str = Field(default="standard")


class ConfidenceListResponse(BaseModel):
    results: List[ConfidenceScoreResponse]
    count: int
    total_requested: int


class ConfidenceDetailsResponse(BaseModel):
    symbol: str
    confidence_score: float
    confidence_label: str
    dimension_contributions: Dict[str, DimensionContributionResponse]
    bonuses: List[BonusResponse]
    penalties: List[PenaltyResponse]
    warnings: List[WarningResponse]
    trend: Optional[str]
    history_count: int


class ConfidenceHistoryEntryResponse(BaseModel):
    symbol: str
    confidence_score: float
    confidence_label: str
    calculated_at: str
    delta: float
    trend: str


class ConfidenceHistoryResponse(BaseModel):
    symbol: str
    history: List[ConfidenceHistoryEntryResponse]
    count: int


class ConfidenceBreakdownResponse(BaseModel):
    symbol: str
    confidence_score: float
    confidence_label: str
    dimension_scores: Dict[str, float]
    dimension_details: Dict[str, Dict[str, Any]]
    bonus_total: float
    penalty_total: float
    warning_count: int


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
    profile_name: str = Field(default="standard")


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
    data: Optional[Dict[str, Any]] = None
    profile_name: Optional[str] = None


class ValidateResponse(BaseModel):
    is_valid: bool
    errors: List[str]


class ReportRequest(BaseModel):
    symbol: str
    report_type: str = Field(default="executive")
    source_data: Optional[Dict[str, Any]] = None


class ReportResponse(BaseModel):
    symbol: str
    report_type: str
    title: str
    summary: str
    sections: List[Dict[str, Any]]
    generated_at: str


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
