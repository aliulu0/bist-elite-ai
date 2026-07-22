from __future__ import annotations

import threading
from typing import Any, Optional

from modules.market_regime_engine.cache.cache import RegimeCache
from modules.market_regime_engine.classification.engine import RegimeClassifier
from modules.market_regime_engine.history.tracker import RegimeHistoryTracker
from modules.market_regime_engine.reports.generator import ReportGenerator
from modules.market_regime_engine.validators.validator import RequestValidator, ResultValidator


class MarketRegimeEngineRegistry:
    """Singleton registry for market regime engine components."""

    _instance: Optional["MarketRegimeEngineRegistry"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls, *args: Any, **kwargs: Any) -> "MarketRegimeEngineRegistry":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if not hasattr(self, "_initialized"):
            self._initialized = True
            self._classifier: Optional[RegimeClassifier] = None
            self._history_tracker: Optional[RegimeHistoryTracker] = None
            self._report_generator: Optional[ReportGenerator] = None
            self._request_validator: Optional[RequestValidator] = None
            self._result_validator: Optional[ResultValidator] = None
            self._cache: Optional[RegimeCache] = None

    def get_classifier(self) -> RegimeClassifier:
        if self._classifier is None:
            self._classifier = RegimeClassifier()
        return self._classifier

    def get_history_tracker(self) -> RegimeHistoryTracker:
        if self._history_tracker is None:
            self._history_tracker = RegimeHistoryTracker()
        return self._history_tracker

    def get_report_generator(self) -> ReportGenerator:
        if self._report_generator is None:
            self._report_generator = ReportGenerator()
        return self._report_generator

    def get_request_validator(self) -> RequestValidator:
        if self._request_validator is None:
            self._request_validator = RequestValidator()
        return self._request_validator

    def get_result_validator(self) -> ResultValidator:
        if self._result_validator is None:
            self._result_validator = ResultValidator()
        return self._result_validator

    def get_cache(self) -> RegimeCache:
        if self._cache is None:
            self._cache = RegimeCache()
        return self._cache


def reset_registry() -> None:
    with MarketRegimeEngineRegistry._lock:
        MarketRegimeEngineRegistry._instance = None
        MarketRegimeEngineRegistry._lock = threading.Lock()
