from __future__ import annotations

from pydantic import BaseModel, Field
from modules.pattern_engine.core.types import (
    PatternCategory, PatternDirection, PatternStatus, SignalType,
)


class PriceBarSchema(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float = 0.0
    turnover: float = 0.0


class PatternDetectionRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    prices: list[PriceBarSchema]
    category: str | None = None
    patterns: list[str] | None = None
    params: dict = Field(default_factory=dict)


class PatternResultSchema(BaseModel):
    pattern_name: str
    category: str
    direction: str
    status: str
    confidence: float
    probability: float
    risk: float = 0.0
    expected_target: float = 0.0
    expected_duration: int = 0
    expected_pullback: float = 0.0
    pattern_quality: float = 0.0
    confirmation_score: float = 0.0
    entry_price: float = 0.0
    stop_loss: float = 0.0
    take_profit: float = 0.0
    start_index: int = 0
    end_index: int = 0
    key_levels: list[float] = Field(default_factory=list)
    description: str = ""
    warnings: list[str] = Field(default_factory=list)


class PatternAnalysisResponse(BaseModel):
    symbol: str
    total_patterns: int
    bullish_count: int
    bearish_count: int
    avg_confidence: float
    dominant_direction: str
    patterns: list[PatternResultSchema]


class ClassicalDetectionRequest(BaseModel):
    prices: list[PriceBarSchema]
    params: dict = Field(default_factory=dict)


class CandlestickDetectionRequest(BaseModel):
    prices: list[PriceBarSchema]
    params: dict = Field(default_factory=dict)


class SMCDetectionRequest(BaseModel):
    prices: list[PriceBarSchema]
    params: dict = Field(default_factory=dict)


class WyckoffDetectionRequest(BaseModel):
    prices: list[PriceBarSchema]
    params: dict = Field(default_factory=dict)


class PluginInfoSchema(BaseModel):
    name: str
    display_name: str
    category: str
    default_params: dict = Field(default_factory=dict)


class PluginListResponse(BaseModel):
    total: int
    plugins: list[PluginInfoSchema]


class PluginParametersResponse(BaseModel):
    name: str
    display_name: str
    parameters: dict


class ValidationRequest(BaseModel):
    prices: list[PriceBarSchema]


class ValidationResult(BaseModel):
    valid: bool
    errors: list[str] = Field(default_factory=list)
    bar_count: int


class SimilarPatternSchema(BaseModel):
    pattern_name: str
    similarity: float
    direction: str
    confidence: float
    status: str


class SimilarityResponse(BaseModel):
    similarity_score: float
    similar_patterns: list[SimilarPatternSchema]
    top_historical_match: str


class BacktestRequest(BaseModel):
    prices: list[PriceBarSchema]
    pattern_name: str | None = None
    lookback_days: int = Field(default=365, ge=30, le=1825)


class BacktestResultSchema(BaseModel):
    historical_success_rate: float
    six_month_success: float
    twelve_month_success: float
    average_return: float
    average_drawdown: float
    sample_size: int
