import pytest
import asyncio

from modules.data_engine.providers.base.provider_manager import ProviderManager
from modules.data_engine.providers.base.provider_registry import ProviderRegistry
from modules.data_engine.providers.base.provider_factory import ProviderFactory
from modules.data_engine.providers.implementations.price.mock_price_provider import MockPriceProvider
from modules.data_engine.providers.implementations.financial.mock_financial_provider import MockFinancialProvider
from modules.data_engine.providers.implementations.news.mock_news_provider import MockNewsProvider
from modules.data_engine.providers.implementations.sector.mock_sector_provider import MockSectorProvider
from modules.data_engine.providers.implementations.technical.local_technical_provider import LocalTechnicalProvider
from modules.data_engine.providers.models.enums import ProviderType, ProviderStatus, ProviderPriority
from modules.data_engine.providers.models.schemas import ProviderHealth


class TestProviderManager:
    def setup_method(self):
        self.manager = ProviderManager(ProviderType.PRICE)

    def test_register_provider(self):
        provider = MockPriceProvider()
        self.manager.register(provider)
        assert len(self.manager.providers) == 1

    def test_register_multiple_providers_same_name_replaces(self):
        p1 = MockPriceProvider(priority=ProviderPriority.PRIMARY)
        p2 = MockPriceProvider(priority=ProviderPriority.FALLBACK)
        self.manager.register(p1)
        self.manager.register(p2)
        assert len(self.manager.providers) == 1
        assert self.manager.providers[0].priority == ProviderPriority.FALLBACK

    def test_register_different_type_manager_rejects(self):
        manager = ProviderManager(ProviderType.PRICE)
        financial = MockFinancialProvider()
        with pytest.raises(ValueError):
            manager.register(financial)

    def test_unregister_provider(self):
        provider = MockPriceProvider()
        self.manager.register(provider)
        assert self.manager.unregister(provider.name)
        assert len(self.manager.providers) == 0

    def test_unregister_nonexistent(self):
        assert not self.manager.unregister("nonexistent")

    def test_get_provider(self):
        provider = MockPriceProvider()
        self.manager.register(provider)
        found = self.manager.get_provider(provider.name)
        assert found is not None
        assert found.name == provider.name

    def test_type_mismatch_raises(self):
        provider = MockFinancialProvider()
        with pytest.raises(ValueError, match="Provider type mismatch"):
            self.manager.register(provider)

    @pytest.mark.asyncio
    async def test_execute_with_single_provider(self):
        provider = MockPriceProvider()
        self.manager.register(provider)
        result = await self.manager.execute(stock_code="GARAN")
        assert result["success"] is True
        assert len(result["data"]) > 0
        assert "attempts" in result

    @pytest.mark.asyncio
    async def test_execute_no_providers(self):
        result = await self.manager.execute(stock_code="GARAN")
        assert result["success"] is False
        assert "No available providers" in result["error"]

    @pytest.mark.asyncio
    async def test_active_provider(self):
        provider = MockPriceProvider()
        self.manager.register(provider)
        active = self.manager.active_provider
        assert active is not None

    @pytest.mark.asyncio
    async def test_health_check_all(self):
        provider = MockPriceProvider()
        self.manager.register(provider)
        result = await self.manager.health_check_all()
        assert provider.name in result

    def test_get_status(self):
        provider = MockPriceProvider()
        self.manager.register(provider)
        status = self.manager.get_status()
        assert status["provider_type"] == "price"
        assert status["total_providers"] == 1

    def test_reset_failures(self):
        self.manager.reset_failures()
        assert self.manager._state.failure_counts == {}


class TestProviderRegistry:
    def setup_method(self):
        ProviderRegistry.reset()

    def test_singleton(self):
        r1 = ProviderRegistry()
        r2 = ProviderRegistry()
        assert r1 is r2

    def test_get_manager_creates(self):
        reg = ProviderRegistry()
        manager = reg.get_manager(ProviderType.PRICE)
        assert manager is not None
        assert manager.provider_type == ProviderType.PRICE

    def test_get_same_manager(self):
        reg = ProviderRegistry()
        m1 = reg.get_manager(ProviderType.PRICE)
        m2 = reg.get_manager(ProviderType.PRICE)
        assert m1 is m2

    def test_register_provider(self):
        reg = ProviderRegistry()
        provider = MockPriceProvider()
        reg.register(provider)
        active = reg.get_active_provider(ProviderType.PRICE)
        assert active is not None

    def test_get_all_status(self):
        reg = ProviderRegistry()
        provider = MockPriceProvider()
        reg.register(provider)
        status = reg.get_all_status()
        assert "price" in status

    @pytest.mark.asyncio
    async def test_health_check_all(self):
        reg = ProviderRegistry()
        provider = MockPriceProvider()
        reg.register(provider)
        result = await reg.health_check_all()
        assert "price" in result


class TestProviderFactory:
    def setup_method(self):
        ProviderRegistry.reset()

    def test_create_price_providers(self):
        providers = ProviderFactory.create_price_providers(enable_mock=True, enable_kap=False, enable_yahoo=False)
        assert len(providers) == 1
        assert providers[0].provider_type == ProviderType.PRICE

    def test_create_financial_providers(self):
        providers = ProviderFactory.create_financial_providers(enable_mock=True, enable_kap=False)
        assert len(providers) == 1
        assert providers[0].provider_type == ProviderType.FINANCIAL

    def test_create_news_providers(self):
        providers = ProviderFactory.create_news_providers(enable_mock=True, enable_kap=False)
        assert len(providers) == 1
        assert providers[0].provider_type == ProviderType.NEWS

    def test_create_sector_providers(self):
        providers = ProviderFactory.create_sector_providers(enable_mock=True)
        assert len(providers) == 1

    def test_create_technical_providers(self):
        providers = ProviderFactory.create_technical_providers()
        assert len(providers) == 1
        assert providers[0].provider_type == ProviderType.TECHNICAL

    def test_create_default_providers_registers_all(self):
        result = ProviderFactory.create_default_providers(enable_kap=False, enable_yahoo=False)
        assert ProviderType.PRICE in result
        assert ProviderType.FINANCIAL in result
        assert ProviderType.NEWS in result
        assert ProviderType.SECTOR in result
        assert ProviderType.TECHNICAL in result
        total = sum(len(p) for p in result.values())
        assert total == 5

    def test_create_single_mock(self):
        ProviderRegistry.reset()
        provider = ProviderFactory.create_single(
            ProviderType.PRICE, "mock", ProviderPriority.FALLBACK
        )
        assert provider is not None
        assert provider.provider_type == ProviderType.PRICE

    def test_create_single_unknown(self):
        provider = ProviderFactory.create_single(
            ProviderType.PRICE, "unknown_source"
        )
        assert provider is None
