from datetime import date, datetime
from pydantic import BaseModel, Field


class PriceCreate(BaseModel):
    stock_code: str = Field(..., min_length=1, max_length=10)
    date: date
    open: float = Field(..., ge=0)
    high: float = Field(..., ge=0)
    low: float = Field(..., ge=0)
    close: float = Field(..., ge=0)
    adjusted_close: float | None = Field(default=None, ge=0)
    volume: float = Field(default=0, ge=0)
    turnover: float = Field(default=0, ge=0)
    vwap: float | None = Field(default=None, ge=0)
    trade_count: int | None = Field(default=None, ge=0)


class PriceResponse(BaseModel):
    id: str
    company_id: str
    stock_code: str
    date: date
    open: float
    high: float
    low: float
    close: float
    adjusted_close: float | None = None
    volume: float
    turnover: float
    vwap: float | None = None
    trade_count: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PriceStatisticsResponse(BaseModel):
    id: str
    company_id: str
    as_of_date: date

    avg_volume_5: float | None = None
    avg_volume_10: float | None = None
    avg_volume_20: float | None = None
    avg_volume_50: float | None = None
    avg_volume_100: float | None = None
    avg_volume_200: float | None = None

    gap_up: bool = False
    gap_down: bool = False

    week_52_high: float | None = None
    week_52_low: float | None = None
    all_time_high: float | None = None
    all_time_low: float | None = None

    daily_return: float | None = None
    weekly_return: float | None = None
    monthly_return: float | None = None
    yearly_return: float | None = None
    log_return: float | None = None

    historical_volatility: float | None = None
    atr_data: float | None = None
    avg_daily_range: float | None = None

    relative_volume: float | None = None
    volume_ratio: float | None = None
    turnover_ratio: float | None = None
    liquidity_score: float | None = None

    higher_high: bool | None = None
    lower_low: bool | None = None
    higher_low: bool | None = None
    lower_high: bool | None = None
    trend_direction: str | None = None

    model_config = {"from_attributes": True}


class PriceHistoryResponse(BaseModel):
    stock_code: str
    total_records: int
    prices: list[PriceResponse]
    statistics: PriceStatisticsResponse | None = None


class PriceLatestResponse(BaseModel):
    stock_code: str
    price: PriceResponse
    statistics: PriceStatisticsResponse | None = None
    daily_change: float | None = None
    daily_change_pct: float | None = None


class PriceWeeklyResponse(BaseModel):
    stock_code: str
    total_records: int
    prices: list[PriceResponse]


class PriceMonthlyResponse(BaseModel):
    stock_code: str
    total_records: int
    prices: list[PriceResponse]


class PriceDateRequest(BaseModel):
    target_date: date
    stock_codes: list[str] | None = None


class PriceUpdateRequest(BaseModel):
    stock_code: str = Field(..., min_length=1, max_length=10)
    start_date: date | None = None
    end_date: date | None = None


class PriceUpdateResponse(BaseModel):
    status: str
    stock_code: str
    records_added: int
    records_updated: int
    failed_records: int
    execution_time_ms: float
    message: str


class PriceBulkUpdateResponse(BaseModel):
    status: str
    total_companies: int
    successful: int
    failed: int
    total_records_added: int
    total_records_updated: int
    total_failed_records: int
    execution_time_ms: float
    errors: list[str] = []
