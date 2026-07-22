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


class DivergenceResponse(BaseModel):
    divergence_type: str
    indicator: str
    start_idx: int
    end_idx: int
    confidence: float
    description: str


class MomentumScoreResponse(BaseModel):
    momentum_score: float
    trend_score: float
    signal_score: float
    strength_score: float
    confidence_score: float
    composite_score: float
    components: dict = {}


class CalculateRequest(BaseModel):
    indicator: str = Field(..., description="Indicator name")
    prices: list[PriceBarSchema] = Field(..., min_length=1)
    include_signals: bool = True
    include_divergence: bool = False
    include_scoring: bool = False
    params: dict = Field(default_factory=dict, description="Indicator parameters")


class CalculateAllRequest(BaseModel):
    prices: list[PriceBarSchema] = Field(..., min_length=1)
    include_signals: bool = True
    params: dict = Field(default_factory=dict)


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


class SignalAggregateResponse(BaseModel):
    signal_type: str
    confidence: float
    strength: float
    description: str
    individual_signals: list[SignalResponse] = []


class CalculateWithScoreResponse(BaseModel):
    indicator: IndicatorResponse
    signals: list[SignalResponse] = []
    divergences: list[DivergenceResponse] = []
    score: MomentumScoreResponse | None = None
