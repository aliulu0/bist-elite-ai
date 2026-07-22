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
from modules.data_engine.providers.models.schemas import FinancialData, ProviderHealth
from modules.data_engine.utils.logger import logger


class MockFinancialProvider(AbstractProvider):
    def __init__(
        self,
        priority: ProviderPriority = ProviderPriority.MOCK,
    ) -> None:
        config = ProviderConfig(
            source=ProviderSource.MOCK,
            provider_type=ProviderType.FINANCIAL,
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
        if not stock_code:
            return {"type": "financials", "data": []}
        return {"type": "financials", "data": self._generate_financials(stock_code)}

    async def validate(self, raw_data: Any) -> bool:
        if isinstance(raw_data, dict):
            return raw_data.get("type") == "financials"
        return False

    async def transform(self, raw_data: Any) -> list[FinancialData]:
        if isinstance(raw_data, dict) and raw_data.get("type") == "financials":
            return raw_data["data"]
        return []

    async def save(self, data: list[FinancialData]) -> dict[str, Any]:
        return {"saved": len(data), "provider": self.name}

    async def fetch_financial_reports(
        self, stock_code: str
    ) -> pd.DataFrame:
        result = await self.execute(stock_code=stock_code)
        if result["success"]:
            return pd.DataFrame([f.to_dict() for f in result["data"]])
        return pd.DataFrame()

    async def health_check(self) -> ProviderHealth:
        self._health.status = ProviderStatus.ACTIVE
        import datetime

        self._health.last_check = datetime.datetime.now(datetime.timezone.utc)
        return self._health

    def _generate_financials(self, stock_code: str) -> list[FinancialData]:
        data: list[FinancialData] = []
        base_revenue = random.uniform(1_000_000_000, 50_000_000_000)
        for year in [2022, 2023, 2024]:
            for quarter in [1, 2, 3, 4]:
                revenue = base_revenue * (1 + random.uniform(-0.1, 0.15))
                data.append(
                    FinancialData(
                        stock_code=stock_code,
                        period=f"{year}Q{quarter}",
                        year=year,
                        quarter=quarter,
                        revenue=round(revenue, 2),
                        gross_profit=round(revenue * random.uniform(0.2, 0.5), 2),
                        ebitda=round(revenue * random.uniform(0.1, 0.3), 2),
                        operating_profit=round(revenue * random.uniform(0.05, 0.25), 2),
                        net_profit=round(revenue * random.uniform(0.02, 0.2), 2),
                        equity=round(revenue * random.uniform(0.3, 0.8), 2),
                        assets=round(revenue * random.uniform(1.0, 3.0), 2),
                        liabilities=round(revenue * random.uniform(0.5, 2.0), 2),
                        cash=round(revenue * random.uniform(0.05, 0.3), 2),
                        net_debt=round(revenue * random.uniform(0.1, 0.5), 2),
                        shares=round(random.uniform(100_000_000, 5_000_000_000), 0),
                        eps=round(random.uniform(0.5, 15.0), 2),
                    )
                )
                base_revenue = revenue
        return data
