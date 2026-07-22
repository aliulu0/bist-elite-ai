from __future__ import annotations

import random
from datetime import datetime, timezone
from typing import Any, Optional

import pandas as pd

from modules.data_engine.providers.base.abstract_provider import AbstractProvider, ProviderConfig
from modules.data_engine.providers.models.enums import (
    ProviderPriority,
    ProviderSource,
    ProviderStatus,
    ProviderType,
)
from modules.data_engine.providers.models.schemas import NewsData, ProviderHealth
from modules.data_engine.utils.logger import logger


class MockNewsProvider(AbstractProvider):
    def __init__(
        self,
        priority: ProviderPriority = ProviderPriority.MOCK,
    ) -> None:
        config = ProviderConfig(
            source=ProviderSource.MOCK,
            provider_type=ProviderType.NEWS,
            priority=priority,
            enabled=True,
        )
        super().__init__(config)
        self._mock_news = [
            NewsData(
                title="Garanti Bankası 4. Çeyrek Sonuçlarını Açıkladı",
                content="Garanti Bankası 4. çeyrekte beklentilerin üzerinde kâr açıkladı.",
                source="KAP",
                company="GARAN",
                category="Finansal Sonuç",
            ),
            NewsData(
                title="Türk Hava Yolları Yeni Rota Açıkladı",
                content="Türk Hava Yolları, yeni uçuş rotaları planladığını duyurdu.",
                source="KAP",
                company="THYAO",
                category="Operasyon",
            ),
            NewsData(
                title="Ereğli Demir Çelik Yatırım Planı",
                content="Ereğli Demir Çelik, yeni yatırım planı kapsamında açıklama yaptı.",
                source="KAP",
                company="EREGL",
                category="Yatırım",
            ),
            NewsData(
                title="ASELSAN Savunma Anlaşması İmzaladı",
                content="ASELSAN, yeni bir savunma anlaşması imzaladığını duyurdu.",
                source="KAP",
                company="ASELS",
                category="Anlaşma",
            ),
            NewsData(
                title="BİM Mağazaları 3. Çeyrek Sonuçları",
                content="BİM Mağazaları 3. çeyrekte büyüme kaydetti.",
                source="KAP",
                company="BIMAS",
                category="Finansal Sonuç",
            ),
        ]

    async def connect(self) -> bool:
        self._connected = True
        self._health.status = ProviderStatus.ACTIVE
        return True

    async def download(
        self,
        stock_code: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        limit = kwargs.get("limit", 50)
        news = self._mock_news[:limit]
        return {"type": "news", "data": news}

    async def validate(self, raw_data: Any) -> bool:
        if isinstance(raw_data, dict):
            return raw_data.get("type") == "news"
        return False

    async def transform(self, raw_data: Any) -> list[NewsData]:
        if isinstance(raw_data, dict) and raw_data.get("type") == "news":
            return raw_data["data"]
        return []

    async def save(self, data: list[NewsData]) -> dict[str, Any]:
        return {"saved": len(data), "provider": self.name}

    async def fetch_news(self, limit: int = 50) -> pd.DataFrame:
        result = await self.execute(limit=limit)
        if result["success"]:
            return pd.DataFrame([n.to_dict() for n in result["data"]])
        return pd.DataFrame()

    async def health_check(self) -> ProviderHealth:
        self._health.status = ProviderStatus.ACTIVE
        import datetime

        self._health.last_check = datetime.datetime.now(datetime.timezone.utc)
        return self._health
