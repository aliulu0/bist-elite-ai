from __future__ import annotations

from typing import Any, Optional
from datetime import datetime, timezone

import httpx

from modules.data_engine.providers.base.abstract_provider import AbstractProvider, ProviderConfig
from modules.data_engine.providers.models.enums import (
    ProviderPriority,
    ProviderSource,
    ProviderStatus,
    ProviderType,
)
from modules.data_engine.providers.models.schemas import NewsData, ProviderHealth
from modules.data_engine.utils.logger import logger


class KapNewsProvider(AbstractProvider):
    BASE_URL = "https://www.kap.org.tr"

    def __init__(
        self,
        priority: ProviderPriority = ProviderPriority.PRIMARY,
    ) -> None:
        config = ProviderConfig(
            source=ProviderSource.KAP,
            provider_type=ProviderType.NEWS,
            priority=priority,
            rate_limit_per_minute=30,
            timeout_seconds=60.0,
            enabled=True,
        )
        super().__init__(config)
        self._client: Optional[httpx.AsyncClient] = None

    async def connect(self) -> bool:
        try:
            self._client = httpx.AsyncClient(
                base_url=self.BASE_URL,
                timeout=self._config.timeout_seconds,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    "Accept": "application/json",
                    "Accept-Language": "tr-TR,tr;q=0.9",
                },
                follow_redirects=True,
            )
            response = await self._client.get("/tr/api/market/get-stop-login")
            if response.status_code in (200, 404):
                self._connected = True
                self._health.status = ProviderStatus.ACTIVE
                return True
            self._health.status = ProviderStatus.UNAVAILABLE
            return False
        except Exception as e:
            logger.error(f"KAP news connection failed: {e}")
            self._health.status = ProviderStatus.ERROR
            return False

    async def download(
        self,
        stock_code: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        if not self._client:
            return {"type": "error", "data": "Not connected"}
        limit = kwargs.get("limit", 50)
        return await self._fetch_news(stock_code, limit)

    async def _fetch_news(
        self, stock_code: Optional[str], limit: int
    ) -> dict[str, Any]:
        try:
            params: dict[str, Any] = {"size": limit}
            if stock_code:
                params["stockCode"] = stock_code

            response = await self._client.get(
                "/tr/api/disclosure/get-latest-disclosures", params=params
            )
            response.raise_for_status()
            data = response.json()

            news_list: list[NewsData] = []
            if isinstance(data, list):
                for item in data:
                    try:
                        pub_str = item.get("publishDate", "")
                        pub_dt = None
                        if pub_str:
                            pub_dt = datetime.strptime(pub_str, "%Y-%m-%dT%H:%M:%S").replace(
                                tzinfo=timezone.utc
                            )
                        news_list.append(
                            NewsData(
                                title=item.get("title", ""),
                                content=item.get("summary", item.get("subject", "")),
                                source="KAP",
                                published_at=pub_dt,
                                company=item.get("stockCode"),
                                category=item.get("category", "Genel"),
                                url=f"https://www.kap.org.tr/tr/sirket-kutuphane/{item.get('digestId', '')}",
                            )
                        )
                    except (ValueError, TypeError):
                        continue
            return {"type": "news", "data": news_list}
        except Exception as e:
            logger.error(f"KAP news fetch failed: {e}")
            return {"type": "news", "data": []}

    async def validate(self, raw_data: Any) -> bool:
        if isinstance(raw_data, dict):
            return raw_data.get("type") == "news"
        return False

    async def transform(self, raw_data: Any) -> list[NewsData]:
        if isinstance(raw_data, dict) and raw_data.get("type") == "news":
            return raw_data.get("data", [])
        return []

    async def save(self, data: list[NewsData]) -> dict[str, Any]:
        return {"saved": len(data), "provider": self.name}

    async def health_check(self) -> ProviderHealth:
        try:
            if self._client is None:
                await self.connect()
            import time

            start = time.time()
            response = await self._client.get("/tr/api/market/get-stop-login")
            elapsed = (time.time() - start) * 1000
            if response.status_code in (200, 404):
                self._health.status = ProviderStatus.ACTIVE
                self._health.latency_ms = round(elapsed, 2)
            else:
                self._health.status = ProviderStatus.UNAVAILABLE
        except Exception as e:
            self._health.status = ProviderStatus.ERROR
            self._health.last_error = str(e)
        self._health.last_check = datetime.now(timezone.utc)
        return self._health

    async def disconnect(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
        await super().disconnect()
