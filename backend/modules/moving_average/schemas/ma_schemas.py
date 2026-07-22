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


class SlopeResponse(BaseModel):
    slope: float | None = None
    angle_degrees: float | None = None
    acceleration: float | None = None
    is_accelerating: bool = False


class DistanceResponse(BaseModel):
    distance_pct: float | None = None
    distance_abs: float | None = None
    bars_to_cross: int | None = None
    cross_probability: float | None = None


class CrossResponse(BaseModel):
    cross_type: str
    cross_strength: str
    cross_date: str | None = None
    fast_period: int
    slow_period: int
    confirmed: bool
    false_cross: bool
    distance_at_cross: float | None = None


class TrendResponse(BaseModel):
    direction: str
    strength: float
    age: int
    stability: float
    ma_value: float | None = None
    price_position: str | None = None


class SmartSignalResponse(BaseModel):
    signal_type: str
    direction: str
    confidence: float
    description: str


class ScoreResponse(BaseModel):
    trend_score: float
    momentum_score: float
    cross_score: float
    acceleration_score: float
    ma_score: float
    components: dict = {}


class MAResponse(BaseModel):
    indicator: str
    period: int
    values: list[float | None]
    dates: list[str]
    current_value: float | None = None
    previous_value: float | None = None
    slope: SlopeResponse | None = None
    distance_from_price: DistanceResponse | None = None
    trend: TrendResponse | None = None
    signals: list[CrossResponse] = []
    smart_signals: list[SmartSignalResponse] = []
    scores: ScoreResponse | None = None
    calculation_time_ms: float = 0.0


class CalculateRequest(BaseModel):
    ma_type: str = Field(..., description="MA type: sma, ema, wma, hma, smma, vwma")
    period: int = Field(..., ge=1, le=1000, description="MA period")
    prices: list[PriceBarSchema] = Field(..., min_length=1)
    include_slope: bool = True
    include_distance: bool = True
    include_trend: bool = True
    include_signals: bool = False
    include_smart_signals: bool = False
    include_scores: bool = False
    fast_period: int | None = Field(default=None, ge=1, le=1000)
    slow_period: int | None = Field(default=None, ge=1, le=1000)


class CalculateMultipleRequest(BaseModel):
    ma_type: str
    periods: list[int] = Field(..., min_length=1, max_length=20)
    prices: list[PriceBarSchema] = Field(..., min_length=1)
    include_slope: bool = True
    include_distance: bool = False
    include_trend: bool = False


class CrossoverRequest(BaseModel):
    ma_type: str
    fast_period: int = Field(..., ge=1, le=1000)
    slow_period: int = Field(..., ge=1, le=1000)
    prices: list[PriceBarSchema] = Field(..., min_length=1)


class CrossoverDistanceResponse(BaseModel):
    distance_pct: float | None = None
    distance_abs: float | None = None
    bars_to_cross: int | None = None
    cross_probability: float | None = None


class CrossoverResponse(BaseModel):
    fast_period: int
    slow_period: int
    crosses: list[CrossResponse]
    current_distance: CrossoverDistanceResponse | None = None
    estimated_bars: int | None = None
    probability: float | None = None


class AvailableTypesResponse(BaseModel):
    types: list[str]
    default_periods: dict[str, list[int]]


class TimeframeInfo(BaseModel):
    value: str
    order: int


class TimeframeListResponse(BaseModel):
    timeframes: list[TimeframeInfo]
    higher: list[str]
    lower: list[str]
    alignment_score: float | None = None


class ValidateRequest(BaseModel):
    ma_type: str
    period: int = Field(..., ge=0, le=1000)
    prices: list[PriceBarSchema] = Field(..., min_length=1)


class ValidateResponse(BaseModel):
    valid: bool
    errors: list[str]
    warnings: list[str] = []
    data_points: int
    sufficient_data: bool
