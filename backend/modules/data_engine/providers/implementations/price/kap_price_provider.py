from __future__ import annotations

from typing import Any, Optional

import httpx

from modules.data_engine.providers.base.abstract_provider import AbstractProvider, ProviderConfig
from modules.data_engine.providers.models.enums import (
    ProviderPriority,
    ProviderSource,
    ProviderStatus,
    ProviderType,
)
from modules.data_engine.providers.models.schemas import (
    CompanyData,
    PriceData,
    ProviderHealth,
)
from modules.data_engine.utils.logger import logger


class KapPriceProvider(AbstractProvider):
    BASE_URL = "https://www.kap.org.tr"

    def __init__(
        self,
        priority: ProviderPriority = ProviderPriority.PRIMARY,
    ) -> None:
        config = ProviderConfig(
            source=ProviderSource.KAP,
            provider_type=ProviderType.PRICE,
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
                    "Accept": "application/json, text/html",
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
            logger.error(f"KAP connection failed: {e}")
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

        try:
            if stock_code:
                return await self._fetch_stock_prices(stock_code, start_date, end_date)
            return await self._fetch_company_list()
        except Exception as e:
            logger.error(f"KAP download failed: {e}")
            return {"type": "error", "data": str(e)}

    async def _fetch_company_list(self) -> dict[str, Any]:
        try:
            response = await self._client.get("/tr/api/equity/get-all-equities")
            response.raise_for_status()
            data = response.json()

            companies: list[CompanyData] = []
            if isinstance(data, list):
                for item in data:
                    companies.append(
                        CompanyData(
                            stock_code=item.get("stockCode", ""),
                            company_name=item.get("companyName", ""),
                            sector=item.get("sector", ""),
                            market=item.get("market", "BIST"),
                            sub_sector=item.get("subSector", ""),
                            kap_url=f"https://www.kap.org.tr/tr/sirket-bilgileri/genel/{item.get('stockCode', '')}",
                        )
                    )
            return {"type": "companies", "data": companies}
        except Exception as e:
            logger.error(f"KAP company list fetch failed: {e}")
            return {"type": "companies", "data": []}

    async def _fetch_stock_prices(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> dict[str, Any]:
        try:
            from datetime import datetime

            params: dict[str, Any] = {"stockCode": stock_code}
            if start_date:
                params["startDate"] = start_date
            if end_date:
                params["endDate"] = end_date

            response = await self._client.get(
                "/tr/api/hisse/sayfasal-fiyat-getir", params=params
            )
            response.raise_for_status()
            data = response.json()

            prices: list[PriceData] = []
            if isinstance(data, list):
                for item in data:
                    try:
                        trade_date = datetime.strptime(
                            item.get("tradeDate", ""), "%Y-%m-%d"
                        ).date()
                        prices.append(
                            PriceData(
                                stock_code=stock_code,
                                date=trade_date,
                                open=float(item.get("openPrice", 0)),
                                high=float(item.get("maxPrice", 0)),
                                low=float(item.get("minPrice", 0)),
                                close=float(item.get("lastPrice", 0)),
                                volume=float(item.get("volume", 0)),
                                turnover=float(item.get("turnOver", 0)),
                            )
                        )
                    except (ValueError, TypeError):
                        continue
            return {"type": "prices", "data": prices}
        except Exception as e:
            logger.error(f"KAP price fetch failed for {stock_code}: {e}")
            return {"type": "prices", "data": []}

    async def validate(self, raw_data: Any) -> bool:
        if isinstance(raw_data, dict):
            data_type = raw_data.get("type", "")
            if data_type in ("companies", "prices"):
                return True
        return False

    async def transform(self, raw_data: Any) -> list[CompanyData] | list[PriceData]:
        if isinstance(raw_data, dict):
            return raw_data.get("data", [])
        return []

    async def save(self, data: list[CompanyData] | list[PriceData]) -> dict[str, Any]:
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
        import datetime

        self._health.last_check = datetime.datetime.now(datetime.timezone.utc)
        return self._health

    async def disconnect(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
        await super().disconnect()
