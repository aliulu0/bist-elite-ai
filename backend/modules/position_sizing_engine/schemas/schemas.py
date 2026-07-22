from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PositionInputSchema(BaseModel):
    symbol: str
    sector: str = ""
    elite_score: float = Field(default=0.0, ge=0, le=100)
    confidence: float = Field(default=0.0, ge=0, le=100)
    risk: float = Field(default=50.0, ge=0, le=100)
    liquidity: float = Field(default=50.0, ge=0, le=100)
    avg_daily_volume: float = 0.0
    atr: float = 0.0
    volatility: float = 0.0
    beta: float = 1.0
    market_regime: str = "sideways"
    sector_exposure: float = 0.0
    correlation: float = 0.0
    agreement_score: float = 0.0
    price: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class StopLossSchema(BaseModel):
    symbol: str
    stop_loss_price: float = 0.0
    stop_loss_pct: float = 0.0
    stop_loss_type: str = "suggested"
    atr_multiplier: float = 2.0
    volatility_multiplier: float = 2.5
    explanation: str = ""


class TakeProfitSchema(BaseModel):
    symbol: str
    primary_target: float = 0.0
    secondary_target: float = 0.0
    risk_reward_ratio: float = 2.0
    explanation: str = ""


class PositionSizingSchema(BaseModel):
    symbol: str
    recommended_pct: float = 0.0
    min_pct: float = 1.0
    max_pct: float = 15.0
    portfolio_weight: float = 0.0
    cash_allocation_pct: float = 0.0
    position_grade: str = "C"
    stop_loss: Optional[StopLossSchema] = None
    take_profit: Optional[TakeProfitSchema] = None
    explanation: str = ""
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PortfolioExposureSchema(BaseModel):
    sector_exposure: Dict[str, float] = Field(default_factory=dict)
    market_exposure: float = 0.0
    total_risk_exposure: float = 0.0
    cash_ratio: float = 10.0
    concentration_risk: float = 0.0
    sector_count: int = 0


class PositionSizingRequestSchema(BaseModel):
    reference_date: str = ""
    horizon: str = "month_3"
    risk_profile: str = "balanced"
    total_capital: float = Field(default=100000.0, gt=0)
    positions: List[PositionInputSchema] = Field(default_factory=list)
    sector_limits: Dict[str, float] = Field(default_factory=dict)
    max_sector_exposure: float = Field(default=30.0, gt=0, le=100)
    max_correlation: float = Field(default=0.7, ge=0, le=1)
    custom_params: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PositionSizingResultSchema(BaseModel):
    request: Optional[PositionSizingRequestSchema] = None
    positions: List[PositionSizingSchema] = Field(default_factory=list)
    exposure: PortfolioExposureSchema = Field(default_factory=PortfolioExposureSchema)
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PositionCurrentResponse(BaseModel):
    result: Optional[PositionSizingResultSchema] = None
    execution_time_ms: float = 0.0


class PositionReportResponse(BaseModel):
    report_type: str
    data: Dict[str, Any]


class PositionExposureResponse(BaseModel):
    exposure: Optional[PortfolioExposureSchema] = None


class CacheStatsSchema(BaseModel):
    size: int
    max_size: int
    hits: int
    misses: int
    hit_rate: float
    ttl_seconds: int
