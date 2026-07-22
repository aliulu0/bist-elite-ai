from __future__ import annotations

from typing import Optional

from modules.data_engine.providers.base.abstract_provider import AbstractProvider
from modules.data_engine.providers.base.provider_registry import registry
from modules.data_engine.providers.implementations.price.mock_price_provider import MockPriceProvider
from modules.data_engine.providers.implementations.price.yahoo_price_provider import YahooFinancePriceProvider
from modules.data_engine.providers.implementations.price.kap_price_provider import KapPriceProvider
from modules.data_engine.providers.implementations.financial.mock_financial_provider import MockFinancialProvider
from modules.data_engine.providers.implementations.financial.kap_financial_provider import KapFinancialProvider
from modules.data_engine.providers.implementations.news.mock_news_provider import MockNewsProvider
from modules.data_engine.providers.implementations.news.kap_news_provider import KapNewsProvider
from modules.data_engine.providers.implementations.sector.mock_sector_provider import MockSectorProvider
from modules.data_engine.providers.implementations.technical.local_technical_provider import LocalTechnicalProvider
from modules.data_engine.providers.models.enums import ProviderPriority, ProviderType
from modules.data_engine.utils.logger import logger


class ProviderFactory:
    """Factory for creating and auto-registering providers.

    Call create_default_providers() at application startup to
    register all built-in providers with the global registry.
    """

    @staticmethod
    def create_price_providers(
        enable_yahoo: bool = True,
        enable_kap: bool = True,
        enable_mock: bool = True,
    ) -> list[AbstractProvider]:
        providers: list[AbstractProvider] = []
        if enable_kap:
            providers.append(KapPriceProvider(priority=ProviderPriority.PRIMARY))
        if enable_yahoo:
            providers.append(YahooFinancePriceProvider(priority=ProviderPriority.SECONDARY))
        if enable_mock:
            providers.append(MockPriceProvider(priority=ProviderPriority.FALLBACK))
        return providers

    @staticmethod
    def create_financial_providers(
        enable_kap: bool = True,
        enable_mock: bool = True,
    ) -> list[AbstractProvider]:
        providers: list[AbstractProvider] = []
        if enable_kap:
            providers.append(KapFinancialProvider(priority=ProviderPriority.PRIMARY))
        if enable_mock:
            providers.append(MockFinancialProvider(priority=ProviderPriority.FALLBACK))
        return providers

    @staticmethod
    def create_news_providers(
        enable_kap: bool = True,
        enable_mock: bool = True,
    ) -> list[AbstractProvider]:
        providers: list[AbstractProvider] = []
        if enable_kap:
            providers.append(KapNewsProvider(priority=ProviderPriority.PRIMARY))
        if enable_mock:
            providers.append(MockNewsProvider(priority=ProviderPriority.FALLBACK))
        return providers

    @staticmethod
    def create_sector_providers(
        enable_mock: bool = True,
    ) -> list[AbstractProvider]:
        providers: list[AbstractProvider] = []
        if enable_mock:
            providers.append(MockSectorProvider(priority=ProviderPriority.PRIMARY))
        return providers

    @staticmethod
    def create_technical_providers() -> list[AbstractProvider]:
        return [LocalTechnicalProvider(priority=ProviderPriority.PRIMARY)]

    @classmethod
    def create_default_providers(
        cls,
        enable_yahoo: bool = True,
        enable_kap: bool = True,
        enable_mock: bool = True,
    ) -> dict[ProviderType, list[AbstractProvider]]:
        """Create and register all default providers.

        Returns dict of ProviderType -> list of registered providers.
        """
        all_providers = {
            ProviderType.PRICE: cls.create_price_providers(
                enable_yahoo=enable_yahoo,
                enable_kap=enable_kap,
                enable_mock=enable_mock,
            ),
            ProviderType.FINANCIAL: cls.create_financial_providers(
                enable_kap=enable_kap,
                enable_mock=enable_mock,
            ),
            ProviderType.NEWS: cls.create_news_providers(
                enable_kap=enable_kap,
                enable_mock=enable_mock,
            ),
            ProviderType.SECTOR: cls.create_sector_providers(
                enable_mock=enable_mock,
            ),
            ProviderType.TECHNICAL: cls.create_technical_providers(),
        }

        for ptype, providers in all_providers.items():
            for provider in providers:
                registry.register(provider)

        logger.info(
            f"ProviderFactory: registered "
            f"{sum(len(p) for p in all_providers.values())} "
            f"providers across {len(all_providers)} types"
        )
        return all_providers

    @staticmethod
    def create_single(
        provider_type: ProviderType,
        source: str,
        priority: ProviderPriority = ProviderPriority.SECONDARY,
        **kwargs,
    ) -> Optional[AbstractProvider]:
        """Create a single provider by type and source name."""
        source_map = {
            "mock": {
                ProviderType.PRICE: lambda: MockPriceProvider(priority=priority),
                ProviderType.FINANCIAL: lambda: MockFinancialProvider(priority=priority),
                ProviderType.NEWS: lambda: MockNewsProvider(priority=priority),
                ProviderType.SECTOR: lambda: MockSectorProvider(priority=priority),
            },
            "yahoo_finance": {
                ProviderType.PRICE: lambda: YahooFinancePriceProvider(priority=priority),
            },
            "kap": {
                ProviderType.PRICE: lambda: KapPriceProvider(priority=priority),
                ProviderType.FINANCIAL: lambda: KapFinancialProvider(priority=priority),
                ProviderType.NEWS: lambda: KapNewsProvider(priority=priority),
            },
            "local": {
                ProviderType.TECHNICAL: lambda: LocalTechnicalProvider(priority=priority),
            },
        }

        creators = source_map.get(source, {})
        creator = creators.get(provider_type)
        if creator:
            provider = creator()
            registry.register(provider)
            return provider
        logger.warning(
            f"ProviderFactory: unknown source '{source}' for type '{provider_type.value}'"
        )
        return None
