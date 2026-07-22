"""Backward-compatible provider imports.

New code should import from modules.data_engine.providers directly.
"""
from modules.data_engine.providers.implementations.price.mock_price_provider import MockPriceProvider
from modules.data_engine.providers.implementations.financial.mock_financial_provider import MockFinancialProvider
from modules.data_engine.providers.implementations.news.mock_news_provider import MockNewsProvider
from modules.data_engine.providers.implementations.technical.local_technical_provider import LocalTechnicalProvider

__all__ = ["MockPriceProvider", "MockFinancialProvider", "MockNewsProvider", "LocalTechnicalProvider"]
