from __future__ import annotations

import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Any, Generic, Optional, TypeVar

from modules.data_engine.providers.models.enums import (
    DataType,
    ProviderPriority,
    ProviderSource,
    ProviderStatus,
    ProviderType,
)
from modules.data_engine.providers.models.schemas import (
    CompanyData,
    FinancialData,
    NewsData,
    PriceData,
    ProviderError,
    ProviderHealth,
    ProviderMetrics,
    SectorData,
)
from modules.data_engine.utils.logger import logger

T = TypeVar("T")
DataT = TypeVar("DataT", CompanyData, PriceData, FinancialData, NewsData, SectorData)


@dataclass
class ProviderConfig:
    source: ProviderSource
    provider_type: ProviderType
    priority: ProviderPriority = ProviderPriority.SECONDARY
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    base_url: Optional[str] = None
    rate_limit_per_minute: int = 60
    timeout_seconds: float = 30.0
    max_retries: int = 3
    enabled: bool = True
    metadata: dict[str, Any] = field(default_factory=dict)


class AbstractProvider(ABC):
    """Base class for all data providers.

    Every provider must implement the full lifecycle:
    connect -> download -> validate -> transform -> save
    plus health_check for monitoring.
    """

    def __init__(self, config: ProviderConfig) -> None:
        self._config = config
        self._connected = False
        self._health = ProviderHealth(
            status=ProviderStatus.INACTIVE,
            last_check=datetime.now(timezone.utc),
        )
        self._metrics = ProviderMetrics()
        self._error_log: list[ProviderError] = []

    @property
    def name(self) -> str:
        return f"{self._config.provider_type.value}_{self._config.source.value}"

    @property
    def source(self) -> ProviderSource:
        return self._config.source

    @property
    def provider_type(self) -> ProviderType:
        return self._config.provider_type

    @property
    def priority(self) -> ProviderPriority:
        return self._config.priority

    @property
    def is_enabled(self) -> bool:
        return self._config.enabled

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def health(self) -> ProviderHealth:
        return self._health

    @property
    def metrics(self) -> ProviderMetrics:
        return self._metrics

    @property
    def config(self) -> ProviderConfig:
        return self._config

    @abstractmethod
    async def connect(self) -> bool:
        """Establish connection to the data source.

        Returns True if connection is successful.
        """
        ...

    @abstractmethod
    async def download(self, **kwargs: Any) -> Any:
        """Download raw data from the external source.

        Returns raw data that needs validation and transformation.
        """
        ...

    @abstractmethod
    async def validate(self, raw_data: Any) -> bool:
        """Validate the downloaded data for correctness and completeness.

        Returns True if data passes all validation rules.
        """
        ...

    @abstractmethod
    async def transform(self, raw_data: Any) -> list[DataT]:
        """Transform raw data into standardized data models.

        Returns a list of standardized data objects.
        """
        ...

    @abstractmethod
    async def save(self, data: list[DataT]) -> dict[str, Any]:
        """Persist the transformed data.

        Returns a dict with save statistics.
        """
        ...

    @abstractmethod
    async def health_check(self) -> ProviderHealth:
        """Check provider health and return current status."""
        ...

    async def disconnect(self) -> None:
        """Gracefully disconnect from the data source."""
        self._connected = False
        self._health.status = ProviderStatus.INACTIVE
        logger.info(f"Provider {self.name} disconnected")

    def record_success(self, latency_ms: float, records: int = 0) -> None:
        self._metrics.record_success(latency_ms, records)
        self._health.consecutive_failures = 0
        self._health.status = ProviderStatus.ACTIVE
        self._health.last_check = datetime.now(timezone.utc)
        self._health.latency_ms = latency_ms

    def record_failure(self, error: str, latency_ms: float = 0.0) -> None:
        self._metrics.record_failure(latency_ms)
        self._health.consecutive_failures += 1
        self._health.last_error = error
        self._health.last_check = datetime.now(timezone.utc)
        self._error_log.append(
            ProviderError(
                provider_name=self.name,
                source=self._config.source,
                provider_type=self._config.provider_type,
                message=error,
            )
        )
        if self._health.consecutive_failures >= 3:
            self._health.status = ProviderStatus.ERROR
        else:
            self._health.status = ProviderStatus.UNAVAILABLE

    async def execute(
        self,
        stock_code: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Full pipeline: connect -> download -> validate -> transform.

        Does NOT save by default. Call save separately.
        Returns dict with data, metrics, and status.
        """
        start_time = time.time()
        try:
            if not self._connected:
                connected = await self.connect()
                if not connected:
                    return {
                        "success": False,
                        "data": [],
                        "error": "Connection failed",
                        "provider": self.name,
                    }

            raw = await self.download(
                stock_code=stock_code,
                start_date=start_date,
                end_date=end_date,
                **kwargs,
            )

            valid = await self.validate(raw)
            if not valid:
                return {
                    "success": False,
                    "data": [],
                    "error": "Validation failed",
                    "provider": self.name,
                }

            data = await self.transform(raw)
            elapsed_ms = (time.time() - start_time) * 1000
            self.record_success(elapsed_ms, len(data))

            return {
                "success": True,
                "data": data,
                "count": len(data),
                "provider": self.name,
                "latency_ms": round(elapsed_ms, 2),
            }
        except Exception as e:
            elapsed_ms = (time.time() - start_time) * 1000
            self.record_failure(str(e), elapsed_ms)
            logger.error(f"Provider {self.name} execute failed: {e}")
            return {
                "success": False,
                "data": [],
                "error": str(e),
                "provider": self.name,
                "latency_ms": round(elapsed_ms, 2),
            }

    def get_status_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "source": self._config.source.value,
            "type": self._config.provider_type.value,
            "priority": self._config.priority.value,
            "enabled": self._config.enabled,
            "connected": self._connected,
            "health": self._health.to_dict(),
            "metrics": self._metrics.to_dict(),
            "recent_errors": [e.to_dict() for e in self._error_log[-5:]],
        }

    def __repr__(self) -> str:
        return (
            f"<{self.__class__.__name__}"
            f" name={self.name}"
            f" source={self._config.source.value}"
            f" status={self._health.status.value}>"
        )
