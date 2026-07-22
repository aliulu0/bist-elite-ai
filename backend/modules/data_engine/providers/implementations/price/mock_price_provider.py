from __future__ import annotations

import random
from datetime import date, timedelta
from typing import Any, Optional

import pandas as pd

from modules.data_engine.providers.base.abstract_provider import AbstractProvider, ProviderConfig
from modules.data_engine.providers.models.enums import (
    DataType,
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


class MockPriceProvider(AbstractProvider):
    def __init__(
        self,
        priority: ProviderPriority = ProviderPriority.MOCK,
    ) -> None:
        config = ProviderConfig(
            source=ProviderSource.MOCK,
            provider_type=ProviderType.PRICE,
            priority=priority,
            enabled=True,
        )
        super().__init__(config)
        self._companies = [
            CompanyData(
                stock_code="GARAN",
                company_name="Garanti Bankası",
                sector="Bankacılık",
                market="BIST-100",
            ),
            CompanyData(
                stock_code="AKBNK",
                company_name="Akbank",
                sector="Bankacılık",
                market="BIST-100",
            ),
            CompanyData(
                stock_code="THYAO",
                company_name="Türk Hava Yolları",
                sector="Ulaştırma",
                market="BIST-100",
            ),
            CompanyData(
                stock_code="SISE",
                company_name="Şişe Cam",
                sector="Cam, Seramik",
                market="BIST-100",
            ),
            CompanyData(
                stock_code="EREGL",
                company_name="Ereğli Demir Çelik",
                sector="Demir ve Demir Dışı Metaller",
                market="BIST-100",
            ),
            CompanyData(
                stock_code="BIMAS",
                company_name="BİM Mağazalar",
                sector="Perakende",
                market="BIST-100",
            ),
            CompanyData(
                stock_code="ASELS",
                company_name="ASELSAN",
                sector="Savunma",
                market="BIST-100",
            ),
            CompanyData(
                stock_code="KOZAL",
                company_name="Koza Altın",
                sector="Madencilik",
                market="BIST-100",
            ),
            CompanyData(
                stock_code="TOASO",
                company_name="Tofaş Oto. Fab.",
                sector="Otomotiv",
                market="BIST-100",
            ),
            CompanyData(
                stock_code="FROTO",
                company_name="Ford Otomotiv",
                sector="Otomotiv",
                market="BIST-100",
            ),
            CompanyData(
                stock_code="TUPRS",
                company_name="Tüpraş",
                sector="Enerji",
                market="BIST-100",
            ),
            CompanyData(
                stock_code="ARCLK",
                company_name="Arçelik",
                sector="Beyaz Eşya",
                market="BIST-100",
            ),
            CompanyData(
                stock_code="KCHOL",
                company_name="Koç Holding",
                sector="Holding",
                market="BIST-100",
            ),
            CompanyData(
                stock_code="SAHOL",
                company_name="Sabancı Holding",
                sector="Holding",
                market="BIST-100",
            ),
            CompanyData(
                stock_code="PETKM",
                company_name="Petkim",
                sector="Kimya",
                market="BIST-100",
            ),
        ]

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
        if stock_code and "companies" not in kwargs.get("mode", ""):
            return self._generate_prices(stock_code, start_date, end_date)
        return {"type": "companies", "data": self._companies}

    async def validate(self, raw_data: Any) -> bool:
        if isinstance(raw_data, dict) and raw_data.get("type") == "companies":
            return True
        if isinstance(raw_data, dict) and raw_data.get("type") == "prices":
            return len(raw_data.get("data", [])) > 0
        return False

    async def transform(self, raw_data: Any) -> list[CompanyData] | list[PriceData]:
        if isinstance(raw_data, dict):
            if raw_data.get("type") == "companies":
                return raw_data["data"]
            if raw_data.get("type") == "prices":
                return raw_data["data"]
        return []

    async def save(self, data: list[CompanyData] | list[PriceData]) -> dict[str, Any]:
        return {"saved": len(data), "provider": self.name}

    async def fetch_companies(self) -> pd.DataFrame:
        result = await self.execute(mode="companies")
        if result["success"]:
            return pd.DataFrame([c.to_dict() for c in result["data"]])
        return pd.DataFrame()

    async def fetch_prices(
        self,
        stock_code: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> pd.DataFrame:
        result = await self.execute(
            stock_code=stock_code, start_date=start_date, end_date=end_date
        )
        if result["success"]:
            return pd.DataFrame([p.to_dict() for p in result["data"]])
        return pd.DataFrame()

    async def health_check(self) -> ProviderHealth:
        self._health.status = ProviderStatus.ACTIVE
        self._health.last_check = __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        )
        return self._health

    def _generate_prices(
        self,
        stock_code: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> dict[str, Any]:
        if end_date is None:
            end_date = date.today()
        if start_date is None:
            start_date = end_date - timedelta(days=30)

        dates = pd.date_range(start=start_date, end=end_date, freq="B")
        base_price = random.uniform(20, 300)
        prices: list[PriceData] = []
        for d in dates:
            change = random.uniform(-0.05, 0.05)
            open_price = base_price * (1 + change)
            high = open_price * (1 + random.uniform(0, 0.03))
            low = open_price * (1 - random.uniform(0, 0.03))
            close = open_price * (1 + random.uniform(-0.02, 0.02))
            volume = random.uniform(500_000, 5_000_000)
            turnover = volume * close
            prices.append(
                PriceData(
                    stock_code=stock_code,
                    date=d.date(),
                    open=round(open_price, 2),
                    high=round(high, 2),
                    low=round(low, 2),
                    close=round(close, 2),
                    volume=round(volume, 0),
                    turnover=round(turnover, 2),
                )
            )
            base_price = close
        return {"type": "prices", "data": prices}
