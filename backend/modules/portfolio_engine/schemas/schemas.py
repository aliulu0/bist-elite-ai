from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class StockCandidateSchema(BaseModel):
    symbol: str
    sector: str = ""
    elite_score: float = 0.0
    decision_score: float = 0.0
    confidence: float = 0.0
    risk: float = 50.0
    liquidity: float = 50.0
    composite_score: float = 0.0
    rank: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SelectionResultSchema(BaseModel):
    symbol: str
    selected: bool = True
    reason: str = ""
    rejection_reason: Optional[str] = None
    rank: int = 0
    composite_score: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PortfolioQualitySchema(BaseModel):
    avg_elite_score: float = 0.0
    avg_confidence: float = 0.0
    avg_risk: float = 0.0
    avg_liquidity: float = 0.0
    avg_composite_score: float = 0.0
    sector_distribution: Dict[str, int] = Field(default_factory=dict)
    liquidity_distribution: Dict[str, int] = Field(default_factory=dict)
    risk_distribution: Dict[str, int] = Field(default_factory=dict)
    diversification_score: float = 0.0
    concentration_risk: float = 0.0


class PortfolioProposalSchema(BaseModel):
    portfolio_id: str = ""
    reference_date: str = ""
    horizon: str = "month_3"
    size: int = 10
    selected: List[StockCandidateSchema] = Field(default_factory=list)
    rejected: List[SelectionResultSchema] = Field(default_factory=list)
    quality_metrics: Optional[PortfolioQualitySchema] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PortfolioRequestSchema(BaseModel):
    reference_date: str = ""
    horizon: str = "month_3"
    portfolio_size: int = Field(default=10, gt=0)
    max_per_sector: int = Field(default=2, gt=0)
    min_elite_score: float = Field(default=40.0, ge=0, le=100)
    min_confidence: float = Field(default=30.0, ge=0, le=100)
    min_liquidity: float = Field(default=20.0, ge=0, le=100)
    max_risk: float = Field(default=80.0, ge=0, le=100)
    min_decision_score: float = Field(default=35.0, ge=0, le=100)
    candidates: List[StockCandidateSchema] = Field(default_factory=list)
    sector_data: Dict[str, Any] = Field(default_factory=dict)
    sort_by: str = "composite"
    diversification_preset: Optional[str] = None
    seed: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PortfolioResultSchema(BaseModel):
    request: Optional[PortfolioRequestSchema] = None
    proposal: PortfolioProposalSchema
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PortfolioListResponse(BaseModel):
    portfolios: List[Dict[str, Any]]
    count: int


class PortfolioCurrentResponse(BaseModel):
    proposal: Optional[PortfolioProposalSchema] = None
    execution_time_ms: float = 0.0


class PortfolioReportResponse(BaseModel):
    report_type: str
    portfolio_id: str = ""
    data: Dict[str, Any]


class CacheStatsSchema(BaseModel):
    size: int
    max_size: int
    hits: int
    misses: int
    hit_rate: float
    ttl_seconds: int
