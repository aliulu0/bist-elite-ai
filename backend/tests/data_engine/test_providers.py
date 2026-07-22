import pytest
from datetime import date

from modules.data_engine.providers.implementations.price.mock_price_provider import MockPriceProvider
from modules.data_engine.providers.implementations.financial.mock_financial_provider import MockFinancialProvider
from modules.data_engine.providers.implementations.news.mock_news_provider import MockNewsProvider
from modules.data_engine.providers.implementations.sector.mock_sector_provider import MockSectorProvider
from modules.data_engine.providers.implementations.technical.local_technical_provider import LocalTechnicalProvider
from modules.data_engine.providers.models.enums import ProviderType, ProviderSource, ProviderStatus
from modules.data_engine.providers.models.schemas import CompanyData, PriceData, FinancialData, NewsData, SectorData
import pandas as pd


class TestMockPriceProvider:
    def setup_method(self):
        self.provider = MockPriceProvider()

    @pytest.mark.asyncio
    async def test_connect(self):
        result = await self.provider.connect()
        assert result is True
        assert self.provider.is_connected

    @pytest.mark.asyncio
    async def test_fetch_companies_via_execute(self):
        result = await self.provider.execute(mode="companies")
        assert result["success"] is True
        assert len(result["data"]) > 0
        assert isinstance(result["data"][0], CompanyData)

    @pytest.mark.asyncio
    async def test_fetch_companies_dataframe(self):
        df = await self.provider.fetch_companies()
        assert not df.empty
        assert "stock_code" in df.columns
        assert "company_name" in df.columns

    @pytest.mark.asyncio
    async def test_fetch_prices_via_execute(self):
        result = await self.provider.execute(stock_code="GARAN")
        assert result["success"] is True
        assert len(result["data"]) > 0
        assert isinstance(result["data"][0], PriceData)

    @pytest.mark.asyncio
    async def test_fetch_prices_dataframe(self):
        df = await self.provider.fetch_prices("GARAN")
        assert not df.empty
        assert "open" in df.columns
        assert "high" in df.columns
        assert "low" in df.columns
        assert "close" in df.columns
        assert "volume" in df.columns

    @pytest.mark.asyncio
    async def test_fetch_prices_with_date_range(self):
        start = date(2024, 1, 1)
        end = date(2024, 1, 31)
        df = await self.provider.fetch_prices("GARAN", start_date=start, end_date=end)
        assert not df.empty

    @pytest.mark.asyncio
    async def test_health_check(self):
        health = await self.provider.health_check()
        assert health.status == ProviderStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_full_execute_cycle(self):
        result = await self.provider.execute(
            stock_code="THYAO",
            start_date=date(2024, 6, 1),
            end_date=date(2024, 6, 30),
        )
        assert result["success"] is True
        assert result["count"] > 0
        assert result["provider"] == self.provider.name
        assert "latency_ms" in result

    @pytest.mark.asyncio
    async def test_disconnect(self):
        await self.provider.connect()
        await self.provider.disconnect()
        assert not self.provider.is_connected

    @pytest.mark.asyncio
    async def test_metrics_tracking(self):
        await self.provider.execute(stock_code="GARAN")
        assert self.provider.metrics.total_requests >= 1
        assert self.provider.metrics.successful_requests >= 1

    @pytest.mark.asyncio
    async def test_status_dict(self):
        await self.provider.connect()
        status = self.provider.get_status_dict()
        assert "name" in status
        assert "source" in status
        assert "health" in status
        assert "metrics" in status


class TestMockFinancialProvider:
    def setup_method(self):
        self.provider = MockFinancialProvider()

    @pytest.mark.asyncio
    async def test_connect(self):
        result = await self.provider.connect()
        assert result is True

    @pytest.mark.asyncio
    async def test_fetch_financial_reports_via_execute(self):
        result = await self.provider.execute(stock_code="GARAN")
        assert result["success"] is True
        assert len(result["data"]) > 0
        assert isinstance(result["data"][0], FinancialData)

    @pytest.mark.asyncio
    async def test_fetch_financial_reports_dataframe(self):
        df = await self.provider.fetch_financial_reports("GARAN")
        assert not df.empty
        assert "period" in df.columns
        assert "revenue" in df.columns

    @pytest.mark.asyncio
    async def test_health_check(self):
        health = await self.provider.health_check()
        assert health.status == ProviderStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_financial_data_fields(self):
        result = await self.provider.execute(stock_code="GARAN")
        data = result["data"][0]
        assert data.stock_code == "GARAN"
        assert data.period is not None
        assert data.year > 0
        assert data.quarter in [1, 2, 3, 4]


class TestMockNewsProvider:
    def setup_method(self):
        self.provider = MockNewsProvider()

    @pytest.mark.asyncio
    async def test_connect(self):
        result = await self.provider.connect()
        assert result is True

    @pytest.mark.asyncio
    async def test_fetch_news_via_execute(self):
        result = await self.provider.execute(limit=5)
        assert result["success"] is True
        assert len(result["data"]) > 0
        assert isinstance(result["data"][0], NewsData)

    @pytest.mark.asyncio
    async def test_fetch_news_dataframe(self):
        df = await self.provider.fetch_news(limit=10)
        assert not df.empty
        assert "title" in df.columns

    @pytest.mark.asyncio
    async def test_health_check(self):
        health = await self.provider.health_check()
        assert health.status == ProviderStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_news_data_fields(self):
        result = await self.provider.execute(limit=3)
        for news in result["data"]:
            assert news.title
            assert news.content
            assert news.source


class TestMockSectorProvider:
    def setup_method(self):
        self.provider = MockSectorProvider()

    @pytest.mark.asyncio
    async def test_connect(self):
        result = await self.provider.connect()
        assert result is True

    @pytest.mark.asyncio
    async def test_fetch_sectors_via_execute(self):
        result = await self.provider.execute()
        assert result["success"] is True
        assert len(result["data"]) > 0
        assert isinstance(result["data"][0], SectorData)

    @pytest.mark.asyncio
    async def test_fetch_sectors_dataframe(self):
        df = await self.provider.fetch_sectors()
        assert not df.empty
        assert "sector" in df.columns
        assert "strength_score" in df.columns

    @pytest.mark.asyncio
    async def test_health_check(self):
        health = await self.provider.health_check()
        assert health.status == ProviderStatus.ACTIVE


class TestLocalTechnicalProvider:
    def setup_method(self):
        self.provider = LocalTechnicalProvider()

    @pytest.mark.asyncio
    async def test_connect(self):
        result = await self.provider.connect()
        assert result is True

    @pytest.mark.asyncio
    async def test_calculate_indicators(self):
        import numpy as np

        dates = pd.date_range("2024-01-01", periods=100, freq="B")
        close = pd.Series(np.random.uniform(100, 200, 100).cumsum())
        price_df = pd.DataFrame({
            "date": dates,
            "open": close * 0.99,
            "high": close * 1.01,
            "low": close * 0.98,
            "close": close,
            "volume": np.random.uniform(1e6, 5e6, 100),
        })
        result_df = self.provider.calculate_indicators(price_df)
        assert not result_df.empty
        assert "rsi" in result_df.columns
        assert "macd" in result_df.columns
        assert "sma_20" in result_df.columns
        assert "ema_20" in result_df.columns
        assert "bollinger_upper" in result_df.columns
        assert "obv" in result_df.columns

    @pytest.mark.asyncio
    async def test_health_check(self):
        health = await self.provider.health_check()
        assert health.status == ProviderStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_execute_with_price_data(self):
        import numpy as np

        dates = pd.date_range("2024-01-01", periods=50, freq="B")
        close = pd.Series(np.random.uniform(100, 200, 50).cumsum())
        price_df = pd.DataFrame({
            "date": dates,
            "open": close * 0.99,
            "high": close * 1.01,
            "low": close * 0.98,
            "close": close,
            "volume": np.random.uniform(1e6, 5e6, 50),
        })
        result = await self.provider.execute(
            stock_code="GARAN", price_df=price_df
        )
        assert result["success"] is True
        assert len(result["data"]) > 0
