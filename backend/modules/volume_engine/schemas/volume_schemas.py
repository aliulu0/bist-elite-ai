from __future__ import annotations

from pydantic import BaseModel, Field


class PriceBarSchema(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    turnover: float = 0.0


class IndicatorResponse(BaseModel):
    indicator: str
    parameters: dict
    values: list[float | None]
    dates: list[str]
    current_value: float | None = None
    previous_value: float | None = None
    slope: float | None = None
    acceleration: float | None = None
    trend: str = "neutral"
    warnings: list[str] = []
    calculation_time_ms: float = 0.0


class SignalResponse(BaseModel):
    signal_type: str
    indicator: str
    confidence: float
    strength: float
    description: str
    parameters: dict = {}


class SmartMoneyResponse(BaseModel):
    detection_type: str = "none"
    confidence: float = 0.0
    strength: float = 0.0
    description: str = ""
    volume_ratio: float = 1.0
    price_impact: float = 0.0


class LiquidityResponse(BaseModel):
    liquidity_score: float = 0.0
    turnover_score: float = 0.0
    spread_score: float = 0.0
    trade_activity: float = 0.0
    avg_daily_volume: float = 0.0
    market_participation: float = 0.0


class InstitutionalScoreResponse(BaseModel):
    smart_money_score: float = 0.0
    institutional_confidence: float = 0.0
    accumulation_score: float = 0.0
    distribution_score: float = 0.0
    liquidity_score: float = 0.0
    breakout_confirmation: float = 0.0
    components: dict = {}


class VolumeScoreResponse(BaseModel):
    volume_score: float = 0.0
    liquidity_score: float = 0.0
    participation_score: float = 0.0
    institutional_score: float = 0.0
    confidence: float = 0.0
    components: dict = {}


class CalculateRequest(BaseModel):
    indicator: str = Field(..., description="Indicator name")
    prices: list[PriceBarSchema] = Field(..., min_length=1)
    include_signals: bool = True
    include_smart_money: bool = False
    include_liquidity: bool = False
    include_scoring: bool = False
    params: dict = Field(default_factory=dict, description="Indicator parameters")


class AvailableIndicatorsResponse(BaseModel):
    indicators: list[str]
    details: dict


class CacheStatsResponse(BaseModel):
    size: int
    max_size: int
    hits: int
    misses: int
    hit_ratio: float


class BenchmarkResponse(BaseModel):
    indicator: str
    iterations: int
    total_seconds: float
    avg_ms: float
    ops_per_second: float
    memory_bytes: int
