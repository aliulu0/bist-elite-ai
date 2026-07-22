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


class YahooFinancePriceProvider(AbstractProvider):
    BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart"
    BIST_SUFFIX = ".IS"

    def __init__(
        self,
        priority: ProviderPriority = ProviderPriority.SECONDARY,
        api_key: Optional[str] = None,
    ) -> None:
        config = ProviderConfig(
            source=ProviderSource.YAHOO_FINANCE,
            provider_type=ProviderType.PRICE,
            priority=priority,
            api_key=api_key,
            rate_limit_per_minute=120,
            timeout_seconds=30.0,
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
                },
            )
            response = await self._client.get(
                f"/{self.BIST_SUFFIX.replace('.IS', '')}{self.BIST_SUFFIX}",
                params={"range": "1d", "interval": "1d"},
            )
            if response.status_code == 200:
                self._connected = True
                self._health.status = ProviderStatus.ACTIVE
                return True
            self._health.status = ProviderStatus.UNAVAILABLE
            return False
        except Exception as e:
            logger.error(f"Yahoo Finance connection failed: {e}")
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

        if stock_code:
            return await self._fetch_stock_data(stock_code, start_date, end_date)
        return {"type": "error", "data": "stock_code required for Yahoo Finance"}

    async def _fetch_stock_data(
        self,
        stock_code: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> dict[str, Any]:
        try:
            symbol = f"{stock_code}{self.BIST_SUFFIX}"
            params: dict[str, Any] = {"range": "3mo", "interval": "1d"}
            if start_date and end_date:
                from datetime import datetime

                start_ts = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp())
                end_ts = int(datetime.strptime(end_date, "%Y-%m-%d").timestamp())
                params["period1"] = start_ts
                params["period2"] = end_ts
                params.pop("range", None)

            response = await self._client.get(f"/{symbol}", params=params)
            response.raise_for_status()
            data = response.json()

            result = data.get("chart", {}).get("result", [])
            if not result:
                return {"type": "prices", "data": []}

            timestamps = result[0].get("timestamp", [])
            indicators = result[0].get("indicators", {}).get("quote", [{}])[0]
            prices: list[PriceData] = []
            for i, ts in enumerate(timestamps):
                from datetime import datetime, timezone

                dt = datetime.fromtimestamp(ts, tz=timezone.utc).date()
                o = indicators.get("open", [None])[i]
                h = indicators.get("high", [None])[i]
                l = indicators.get("low", [None])[i]
                c = indicators.get("close", [None])[i]
                v = indicators.get("volume", [None])[i]
                if all(x is not None for x in [o, h, l, c, v]):
                    prices.append(
                        PriceData(
                            stock_code=stock_code,
                            date=dt,
                            open=round(float(o), 2),
                            high=round(float(h), 2),
                            low=round(float(l), 2),
                            close=round(float(c), 2),
                            volume=float(v),
                            turnover=round(float(c) * float(v), 2),
                        )
                    )
            return {"type": "prices", "data": prices}
        except httpx.HTTPStatusError as e:
            logger.error(f"Yahoo Finance HTTP error for {stock_code}: {e}")
            return {"type": "prices", "data": []}
        except Exception as e:
            logger.error(f"Yahoo Finance error for {stock_code}: {e}")
            return {"type": "prices", "data": []}

    async def validate(self, raw_data: Any) -> bool:
        if isinstance(raw_data, dict):
            return raw_data.get("type") == "prices" and len(raw_data.get("data", [])) > 0
        return False

    async def transform(self, raw_data: Any) -> list[PriceData]:
        if isinstance(raw_data, dict) and raw_data.get("type") == "prices":
            return raw_data["data"]
        return []

    async def save(self, data: list[PriceData]) -> dict[str, Any]:
        return {"saved": len(data), "provider": self.name}

    async def health_check(self) -> ProviderHealth:
        try:
            if self._client is None:
                await self.connect()
            start = __import__("time").time()
            response = await self._client.get(
                f"/{self.BIST_SUFFIX.replace('.IS', '')}{self.BIST_SUFFIX}",
                params={"range": "1d", "interval": "1d"},
            )
            elapsed = (__import__("time").time() - start) * 1000
            if response.status_code == 200:
                self._health.status = ProviderStatus.ACTIVE
                self._health.latency_ms = round(elapsed, 2)
            else:
                self._health.status = ProviderStatus.UNAVAILABLE
        except Exception as e:
            self._health.status = ProviderStatus.ERROR
            self._health.last_error = str(e)
        self._health.last_check = __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        )
        return self._health

    async def disconnect(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()
        await super().disconnect()
