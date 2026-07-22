from __future__ import annotations

import random
from datetime import date
from typing import Any, Optional

import pandas as pd

from modules.data_engine.providers.base.abstract_provider import AbstractProvider, ProviderConfig
from modules.data_engine.providers.models.enums import (
    ProviderPriority,
    ProviderSource,
    ProviderStatus,
    ProviderType,
)
from modules.data_engine.providers.models.schemas import ProviderHealth, SectorData
from modules.data_engine.utils.logger import logger


class MockSectorProvider(AbstractProvider):
    SECTORS = [
        "Bankacılık",
        "Ulaştırma",
        "Cam, Seramik",
        "Demir ve Demir Dışı Metaller",
        "Perakende",
        "Savunma",
        "Madencilik",
        "Otomotiv",
        "Kimya",
        "Enerji",
        "Holding",
    ]

    def __init__(
        self,
        priority: ProviderPriority = ProviderPriority.MOCK,
    ) -> None:
        config = ProviderConfig(
            source=ProviderSource.MOCK,
            provider_type=ProviderType.SECTOR,
            priority=priority,
            enabled=True,
        )
        super().__init__(config)

    async def connect(self) -> bool:
        self._connected = True
        self._health.status = ProviderStatus.ACTIVE
        return True

    async def download(
        self,
        stock_code: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        today = date.today()
        sectors: list[SectorData] = []
        for sector_name in self.SECTORS:
            sectors.append(
                SectorData(
                    sector=sector_name,
                    date=today,
                    strength_score=round(random.uniform(30, 90), 1),
                    momentum=round(random.uniform(-5, 10), 2),
                    relative_strength=round(random.uniform(0.5, 2.0), 2),
                    breadth=round(random.uniform(0.3, 0.9), 2),
                )
            )
        return {"type": "sectors", "data": sectors}

    async def validate(self, raw_data: Any) -> bool:
        if isinstance(raw_data, dict):
            return raw_data.get("type") == "sectors"
        return False

    async def transform(self, raw_data: Any) -> list[SectorData]:
        if isinstance(raw_data, dict) and raw_data.get("type") == "sectors":
            return raw_data["data"]
        return []

    async def save(self, data: list[SectorData]) -> dict[str, Any]:
        return {"saved": len(data), "provider": self.name}

    async def fetch_sectors(self) -> pd.DataFrame:
        result = await self.execute()
        if result["success"]:
            return pd.DataFrame([s.to_dict() for s in result["data"]])
        return pd.DataFrame()

    async def health_check(self) -> ProviderHealth:
        self._health.status = ProviderStatus.ACTIVE
        import datetime

        self._health.last_check = datetime.datetime.now(datetime.timezone.utc)
        return self._health
