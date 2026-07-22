from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class FactorScoreSchema(BaseModel):
    factor: str
    score: float
    weight: float = 1.0
    contribution: float = 0.0
    strength: str = "neutral"
    raw_value: Optional[float] = None
    normalized_value: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GroupScoreSchema(BaseModel):
    group: str
    score: float
    weight: float = 1.0
    factors: List[FactorScoreSchema] = Field(default_factory=list)
    strength: str = "neutral"
    rank: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class FactorProfileSchema(BaseModel):
    symbol: str
    reference_date: str
    overall_score: float = 0.0
    overall_strength: str = "neutral"
    group_scores: List[GroupScoreSchema] = Field(default_factory=list)
    factor_scores: List[FactorScoreSchema] = Field(default_factory=list)
    radar_data: Dict[str, float] = Field(default_factory=dict)
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    top_factors: List[str] = Field(default_factory=list)
    bottom_factors: List[str] = Field(default_factory=list)
    horizon: str = "month_3"
    regime: Optional[str] = None
    sector: Optional[str] = None


class FactorRankingSchema(BaseModel):
    symbol: str
    overall_rank: int = 0
    group_ranks: Dict[str, int] = Field(default_factory=dict)
    factor_ranks: Dict[str, int] = Field(default_factory=dict)
    strength_factors: List[str] = Field(default_factory=list)
    weakness_factors: List[str] = Field(default_factory=list)
    percentile: float = 0.0


class FactorAnalysisRequestSchema(BaseModel):
    symbol: str
    reference_date: str = ""
    horizon: str = "month_3"
    regime: Optional[str] = None
    sector: Optional[str] = None
    factors: Optional[List[str]] = None
    market_data: Dict[str, Any] = Field(default_factory=dict)
    financial_data: Dict[str, Any] = Field(default_factory=dict)
    indicator_data: Dict[str, Any] = Field(default_factory=dict)
    sector_data: Dict[str, Any] = Field(default_factory=dict)
    include_history: bool = False
    include_ranking: bool = True
    include_profile: bool = True
    seed: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class FactorAnalysisResultSchema(BaseModel):
    symbol: str
    reference_date: str
    profile: Optional[FactorProfileSchema] = None
    ranking: Optional[FactorRankingSchema] = None
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class FactorListResponse(BaseModel):
    groups: List[str]
    total_groups: int
    factors: List[str]
    total_factors: int
    group_details: Dict[str, List[str]]


class FactorDetailsResponse(BaseModel):
    group: str
    factors: List[str]
    total_factors: int
    description: str


class FactorHistoryResponse(BaseModel):
    symbol: str
    entries: List[Dict[str, Any]] = Field(default_factory=list)
    total_entries: int = 0


class CacheStatsSchema(BaseModel):
    size: int
    max_size: int
    ttl_seconds: float
    hits: int
    misses: int
    hit_rate: float
