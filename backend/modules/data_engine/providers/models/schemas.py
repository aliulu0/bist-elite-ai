from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Any, Optional

from modules.data_engine.providers.models.enums import ProviderSource, ProviderStatus, ProviderType


@dataclass(frozen=True)
class CompanyData:
    stock_code: str
    company_name: str
    sector: str
    market: str
    sub_sector: str = ""
    market_value: Optional[float] = None
    free_float: Optional[float] = None
    website: Optional[str] = None
    kap_url: Optional[str] = None
    active: bool = True

    def to_dict(self) -> dict[str, Any]:
        return {
            "stock_code": self.stock_code,
            "company_name": self.company_name,
            "sector": self.sector,
            "sub_sector": self.sub_sector,
            "market": self.market,
            "market_value": self.market_value,
            "free_float": self.free_float,
            "website": self.website,
            "kap_url": self.kap_url,
            "active": self.active,
        }


@dataclass(frozen=True)
class PriceData:
    stock_code: str
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: float
    turnover: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "stock_code": self.stock_code,
            "date": self.date.isoformat(),
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "close": self.close,
            "volume": self.volume,
            "turnover": self.turnover,
        }


@dataclass(frozen=True)
class FinancialData:
    stock_code: str
    period: str
    year: int
    quarter: int
    revenue: Optional[float] = None
    gross_profit: Optional[float] = None
    ebitda: Optional[float] = None
    operating_profit: Optional[float] = None
    net_profit: Optional[float] = None
    equity: Optional[float] = None
    assets: Optional[float] = None
    liabilities: Optional[float] = None
    cash: Optional[float] = None
    net_debt: Optional[float] = None
    shares: Optional[float] = None
    eps: Optional[float] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "stock_code": self.stock_code,
            "period": self.period,
            "year": self.year,
            "quarter": self.quarter,
            "revenue": self.revenue,
            "gross_profit": self.gross_profit,
            "ebitda": self.ebitda,
            "operating_profit": self.operating_profit,
            "net_profit": self.net_profit,
            "equity": self.equity,
            "assets": self.assets,
            "liabilities": self.liabilities,
            "cash": self.cash,
            "net_debt": self.net_debt,
            "shares": self.shares,
            "eps": self.eps,
        }


@dataclass(frozen=True)
class NewsData:
    title: str
    content: str
    source: str
    published_at: Optional[datetime] = None
    company: Optional[str] = None
    category: str = "general"
    url: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "content": self.content,
            "source": self.source,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "company": self.company,
            "category": self.category,
            "url": self.url,
        }


@dataclass(frozen=True)
class SectorData:
    sector: str
    date: date
    strength_score: float
    momentum: Optional[float] = None
    relative_strength: Optional[float] = None
    breadth: Optional[float] = None
    leading_stock: Optional[str] = None
    lagging_stock: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "sector": self.sector,
            "date": self.date.isoformat(),
            "strength_score": self.strength_score,
            "momentum": self.momentum,
            "relative_strength": self.relative_strength,
            "breadth": self.breadth,
            "leading_stock": self.leading_stock,
            "lagging_stock": self.lagging_stock,
        }


@dataclass
class ProviderHealth:
    status: ProviderStatus
    latency_ms: Optional[float] = None
    last_check: Optional[datetime] = None
    last_error: Optional[str] = None
    consecutive_failures: int = 0
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status.value,
            "latency_ms": self.latency_ms,
            "last_check": self.last_check.isoformat() if self.last_check else None,
            "last_error": self.last_error,
            "consecutive_failures": self.consecutive_failures,
            "metadata": self.metadata,
        }


@dataclass
class ProviderMetrics:
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_records_fetched: int = 0
    avg_latency_ms: float = 0.0
    last_used: Optional[datetime] = None

    @property
    def success_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.successful_requests / self.total_requests

    def record_success(self, latency_ms: float, records: int = 0) -> None:
        self.total_requests += 1
        self.successful_requests += 1
        self.total_records_fetched += records
        self.last_used = datetime.now(timezone.utc)
        if self.total_requests == 1:
            self.avg_latency_ms = latency_ms
        else:
            self.avg_latency_ms = (
                (self.avg_latency_ms * (self.total_requests - 1) + latency_ms)
                / self.total_requests
            )

    def record_failure(self, latency_ms: float = 0.0) -> None:
        self.total_requests += 1
        self.failed_requests += 1
        self.last_used = datetime.now(timezone.utc)

    def to_dict(self) -> dict[str, Any]:
        return {
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "total_records_fetched": self.total_records_fetched,
            "success_rate": round(self.success_rate, 4),
            "avg_latency_ms": round(self.avg_latency_ms, 2),
            "last_used": self.last_used.isoformat() if self.last_used else None,
        }


@dataclass
class ProviderError:
    provider_name: str
    source: ProviderSource
    provider_type: ProviderType
    message: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    retryable: bool = True
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "provider_name": self.provider_name,
            "source": self.source.value,
            "provider_type": self.provider_type.value,
            "message": self.message,
            "timestamp": self.timestamp.isoformat(),
            "retryable": self.retryable,
            "metadata": self.metadata,
        }
