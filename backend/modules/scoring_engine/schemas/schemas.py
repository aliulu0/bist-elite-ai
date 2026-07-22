from __future__ import annotations

from pydantic import BaseModel, Field


class CalculateScoreRequest(BaseModel):
    symbol: str
    metrics: dict
    profile: str = "balanced"
    horizon: str = "one_month"
    regime: str = "sideways"
    score_types: list[str] = Field(default_factory=list)


class ScoreBreakdownSchema(BaseModel):
    score_type: str
    raw_score: float
    normalized_score: float
    weight: float
    contribution: float
    penalty: float
    bonus: float
    final_contribution: float
    confidence: float = 1.0
    direction: str = "higher_is_better"
    evidence_count: int = 0
    calculation_time_ms: float = 0.0


class ScoreResultResponse(BaseModel):
    symbol: str
    scores: dict[str, float]
    breakdowns: dict[str, ScoreBreakdownSchema]
    profile: str
    horizon: str
    regime: str
    composite_score: float
    confidence: float
    method: str
    timestamp: str
    calculation_time_ms: float


class ScoreDetailResponse(BaseModel):
    symbol: str
    score_type: str
    score: float
    breakdown: ScoreBreakdownSchema | None = None
    trend: dict | None = None
    history: list[dict] = Field(default_factory=list)


class ScoreListResponse(BaseModel):
    symbol: str
    scores: dict[str, float]
    composite_score: float
    profile: str
    horizon: str
    regime: str
    timestamp: str


class ScoreHistoryEntry(BaseModel):
    score_type: str
    score: float
    timestamp: str
    profile: str = "balanced"
    horizon: str = "one_month"
    regime: str = "sideways"


class ScoreHistoryResponse(BaseModel):
    symbol: str
    history: list[ScoreHistoryEntry]
    total: int = 0


class WeightInfo(BaseModel):
    score_type: str
    weight: float
    min_threshold: float = 0.0
    max_threshold: float = 100.0


class WeightsResponse(BaseModel):
    profile: str
    horizon: str
    regime: str
    weights: list[WeightInfo]
    total_weight: float


class ProfileInfo(BaseModel):
    name: str
    profile: str
    description: str
    is_active: bool


class ProfilesResponse(BaseModel):
    profiles: list[ProfileInfo]
    total: int = 0


class ProfileCreateRequest(BaseModel):
    name: str
    profile: str = "balanced"
    description: str = ""
    weights: dict[str, float] = Field(default_factory=dict)


class CacheStatsResponse(BaseModel):
    size: int
    hits: int
    misses: int
    hit_rate: float
    ttl: int
    max_size: int


class BenchmarkResponse(BaseModel):
    iterations: int
    avg_ms: float
    ops_per_second: float
    total_seconds: float
    memory_bytes: int
    summary: dict = Field(default_factory=dict)


class OptimizationRequest(BaseModel):
    profile: str = "balanced"
    horizon: str = "one_month"
    regime: str = "sideways"
    iterations: int = 50
    historical_data: dict | None = None


class OptimizationResponse(BaseModel):
    original_weights: dict[str, float]
    optimized_weights: dict[str, float]
    improvement_pct: float
    iterations: int
    method: str
    timestamp: str


class ValidateRequest(BaseModel):
    symbol: str
    metrics: dict


class ValidateResponse(BaseModel):
    valid: bool
    errors: list[str] = Field(default_factory=list)
    message: str = ""
