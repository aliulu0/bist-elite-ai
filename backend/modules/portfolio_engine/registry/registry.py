from __future__ import annotations

import threading
from typing import Optional


class PortfolioRegistry:
    _instance: Optional["PortfolioRegistry"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "PortfolioRegistry":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True
        self._ranker = None
        self._selector = None
        self._diversifier = None
        self._validator = None
        self._report_generator = None
        self._cache = None

    def get_ranker(self):
        if self._ranker is None:
            from modules.portfolio_engine.ranking.ranker import StockRanker
            self._ranker = StockRanker()
        return self._ranker

    def get_selector(self):
        if self._selector is None:
            from modules.portfolio_engine.selection.selector import PortfolioSelector
            self._selector = PortfolioSelector()
        return self._selector

    def get_diversifier(self):
        if self._diversifier is None:
            from modules.portfolio_engine.diversification.diversifier import Diversifier
            self._diversifier = Diversifier()
        return self._diversifier

    def get_validator(self):
        if self._validator is None:
            from modules.portfolio_engine.validators.validator import RequestValidator, ResultValidator
            self._validator = (RequestValidator(), ResultValidator())
        return self._validator

    def get_report_generator(self):
        if self._report_generator is None:
            from modules.portfolio_engine.reports.generator import ReportGenerator
            self._report_generator = ReportGenerator()
        return self._report_generator

    def get_cache(self):
        if self._cache is None:
            from modules.portfolio_engine.cache.cache import PortfolioCache
            self._cache = PortfolioCache()
        return self._cache

    def clear(self) -> None:
        self._ranker = None
        self._selector = None
        self._diversifier = None
        self._validator = None
        self._report_generator = None
        self._cache = None


def get_registry() -> PortfolioRegistry:
    return PortfolioRegistry()


def reset_registry() -> None:
    PortfolioRegistry._instance = None
    PortfolioRegistry._lock = threading.Lock()
