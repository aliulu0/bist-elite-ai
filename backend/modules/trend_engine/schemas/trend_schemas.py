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


class TrendResultResponse(BaseModel):
    primary_trend: str = "neutral"
    secondary_trend: str = "neutral"
    micro_trend: str = "neutral"
    phase: str = "sideways"
    strength: float = 0.0
    age: int = 0
    stability: float = 0.0
    exhaustion: float = 0.0
    continuation: float = 0.0
    reversal_probability: float = 0.0


class BreakoutResultResponse(BaseModel):
    breakout_type: str = "none"
    level: float = 0.0
    confidence: float = 0.0
    confirmed: bool = False
    retest: bool = False
    description: str = ""


class PullbackResultResponse(BaseModel):
    pullback_type: str = "none"
    depth: float = 0.0
    recovery: float = 0.0
    trend_resuming: bool = False
    description: str = ""


class TrendScoreResponse(BaseModel):
    trend_score: float = 0.0
    breakout_score: float = 0.0
    continuation_score: float = 0.0
    reversal_score: float = 0.0
    confidence: float = 0.0
    components: dict = {}


class CalculateRequest(BaseModel):
    indicator: str = Field(..., description="Indicator name")
    prices: list[PriceBarSchema] = Field(..., min_length=1)
    include_signals: bool = True
    include_trend_analysis: bool = False
    include_breakout: bool = False
    include_pullback: bool = False
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


class SignalAggregateResponse(BaseModel):
    signal_type: str
    confidence: float
    strength: float
    description: str
    individual_signals: list[SignalResponse] = []


class CalculateWithAnalysisResponse(BaseModel):
    indicator: IndicatorResponse
    signals: list[SignalResponse] = []
    trend_analysis: TrendResultResponse | None = None
    breakout: BreakoutResultResponse | None = None
    pullback: PullbackResultResponse | None = None
    score: TrendScoreResponse | None = None
