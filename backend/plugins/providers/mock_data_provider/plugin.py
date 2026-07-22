from __future__ import annotations

import random
from datetime import date, timedelta
from typing import Any

from modules.plugin_system.interfaces import (
    PluginConfigField,
    PluginConfigSchema,
    PluginMeta,
    DataProviderPlugin,
)


class MockDataProviderPlugin(DataProviderPlugin):
    def __init__(self) -> None:
        meta = PluginMeta(
            name="mock_data_provider",
            version="1.0.0",
            author="BIST Elite AI",
            description="Mock data provider plugin for testing",
            category="provider",
        )
        config_schema = PluginConfigSchema(
            fields={
                "base_url": PluginConfigField(
                    field_type="str",
                    default="https://mock.api.example.com",
                    description="Base URL for the API",
                ),
                "api_key": PluginConfigField(
                    field_type="str",
                    default="",
                    description="API key (if required)",
                ),
            }
        )
        super().__init__(meta, config_schema)

    async def initialize(self, config: dict[str, Any]) -> bool:
        self.set_config(config)
        return True

    async def validate(self) -> bool:
        return True

    async def fetch(
        self,
        endpoint: str,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        params = params or {}
        if endpoint == "prices":
            return await self._mock_prices(params)
        elif endpoint == "companies":
            return self._mock_companies()
        return {"error": f"Unknown endpoint: {endpoint}"}

    async def _mock_prices(self, params: dict[str, Any]) -> dict[str, Any]:
        stock_code = params.get("stock_code", "GARAN")
        days = params.get("days", 30)
        end = date.today()
        start = end - timedelta(days=days)

        dates = []
        current = start
        while current <= end:
            if current.weekday() < 5:
                dates.append(current)
            current += timedelta(days=1)

        base = random.uniform(50, 300)
        records = []
        for d in dates:
            change = random.uniform(-0.05, 0.05)
            close = base * (1 + change)
            records.append({
                "date": d.isoformat(),
                "open": round(base, 2),
                "high": round(close * 1.02, 2),
                "low": round(close * 0.98, 2),
                "close": round(close, 2),
                "volume": round(random.uniform(500000, 5000000), 0),
            })
            base = close

        return {"stock_code": stock_code, "data": records, "count": len(records)}

    def _mock_companies(self) -> dict[str, Any]:
        companies = [
            {"stock_code": "GARAN", "company_name": "Garanti Bankası", "sector": "Bankacılık"},
            {"stock_code": "THYAO", "company_name": "Türk Hava Yolları", "sector": "Ulaştırma"},
            {"stock_code": "ASELS", "company_name": "ASELSAN", "sector": "Savunma"},
            {"stock_code": "BIMAS", "company_name": "BİM Mağazalar", "sector": "Perakende"},
            {"stock_code": "EREGL", "company_name": "Ereğli Demir Çelik", "sector": "Demir-Çelik"},
        ]
        return {"companies": companies, "count": len(companies)}

    async def shutdown(self) -> None:
        pass
