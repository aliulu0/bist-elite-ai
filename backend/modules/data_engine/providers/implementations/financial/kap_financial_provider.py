from __future__ import annotations

from typing import Any, Optional
from datetime import date

import httpx

from modules.data_engine.providers.base.abstract_provider import AbstractProvider, ProviderConfig
from modules.data_engine.providers.models.enums import (
    ProviderPriority,
    ProviderSource,
    ProviderStatus,
    ProviderType,
)
from modules.data_engine.providers.models.schemas import FinancialData, ProviderHealth
from modules.data_engine.utils.logger import logger


class KapFinancialProvider(AbstractProvider):
    BASE_URL = "https://www.kap.org.tr"

    def __init__(
        self,
        priority: ProviderPriority = ProviderPriority.PRIMARY,
    ) -> None:
        config = ProviderConfig(
            source=ProviderSource.KAP,
            provider_type=ProviderType.FINANCIAL,
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
            logger.error(f"KAP financial connection failed: {e}")
            self._health.status = ProviderStatus.ERROR
            return False

    async def download(
        self,
        stock_code: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        if not self._client:
            return {"type": "error", "data": "Not connected"}
        if not stock_code:
            return {"type": "financials", "data": []}
        return await self._fetch_financials(stock_code)

    async def _fetch_financials(self, stock_code: str) -> dict[str, Any]:
        try:
            response = await self._client.get(
                "/tr/api/hisse/get-financials",
                params={"stockCode": stock_code},
            )
            response.raise_for_status()
            data = response.json()

            financials: list[FinancialData] = []
            if isinstance(data, list):
                for item in data:
                    period = item.get("period", "")
                    year = item.get("year", 0)
                    quarter = item.get("quarter", 0)
                    if not period or not year or not quarter:
                        continue
                    financials.append(
                        FinancialData(
                            stock_code=stock_code,
                            period=str(period),
                            year=int(year),
                            quarter=int(quarter),
                            revenue=_safe_float(item.get("revenue")),
                            gross_profit=_safe_float(item.get("grossProfit")),
                            ebitda=_safe_float(item.get("ebitda")),
                            operating_profit=_safe_float(item.get("operatingProfit")),
                            net_profit=_safe_float(item.get("netProfit")),
                            equity=_safe_float(item.get("equity")),
                            assets=_safe_float(item.get("totalAssets")),
                            liabilities=_safe_float(item.get("totalLiabilities")),
                            cash=_safe_float(item.get("cashAndEquivalents")),
                            net_debt=_safe_float(item.get("netDebt")),
                            shares=_safe_float(item.get("sharesOutstanding")),
                            eps=_safe_float(item.get("eps")),
                        )
                    )
            return {"type": "financials", "data": financials}
        except Exception as e:
            logger.error(f"KAP financial fetch failed for {stock_code}: {e}")
            return {"type": "financials", "data": []}

    async def validate(self, raw_data: Any) -> bool:
        if isinstance(raw_data, dict):
            return raw_data.get("type") == "financials"
        return False

    async def transform(self, raw_data: Any) -> list[FinancialData]:
        if isinstance(raw_data, dict) and raw_data.get("type") == "financials":
            return raw_data.get("data", [])
        return []

    async def save(self, data: list[FinancialData]) -> dict[str, Any]:
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


def _safe_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None
