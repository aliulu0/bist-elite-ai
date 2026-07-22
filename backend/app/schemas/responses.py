from pydantic import BaseModel as PydanticBaseModel
from datetime import datetime
from typing import Optional


class ResponseBase(PydanticBaseModel):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class StockResponse(ResponseBase):
    symbol: str
    name: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = None
    is_active: bool = True


class StockCreate(PydanticBaseModel):
    symbol: str
    name: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = None


class StockUpdate(PydanticBaseModel):
    name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = None
    is_active: Optional[bool] = None


class PriceDataResponse(ResponseBase):
    stock_id: str
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float


class PaginationParams(BaseModel):
    skip: int = 0
    limit: int = 100


class PaginatedResponse(BaseModel):
    items: list
    total: int
    skip: int
    limit: int


class ApiResponse(BaseModel):
    success: bool = True
    message: str = "Success"
    data: Optional[dict] = None
