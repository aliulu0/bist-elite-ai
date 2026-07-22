from __future__ import annotations

import threading
from typing import Any, Optional

from modules.similarity_engine.feature_store.store import FeatureStore
from modules.similarity_engine.ranking.engine import RankingEngine
from modules.similarity_engine.reports.generator import ReportGenerator
from modules.similarity_engine.similarity_models.models import SimilarityEngine
from modules.similarity_engine.timeline.analyzer import TimelineAnalyzer
from modules.similarity_engine.validators.validator import RequestValidator, ResultValidator


class SimilarityEngineRegistry:
    """Singleton registry for similarity engine components."""

    _instance: Optional["SimilarityEngineRegistry"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls, *args: Any, **kwargs: Any) -> "SimilarityEngineRegistry":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if not hasattr(self, "_initialized"):
            self._initialized = True
            self._feature_store: Optional[FeatureStore] = None
            self._similarity_engine: Optional[SimilarityEngine] = None
            self._ranking_engine: Optional[RankingEngine] = None
            self._timeline_analyzer: Optional[TimelineAnalyzer] = None
            self._report_generator: Optional[ReportGenerator] = None
            self._request_validator: Optional[RequestValidator] = None
            self._result_validator: Optional[ResultValidator] = None

    def get_feature_store(self) -> FeatureStore:
        if self._feature_store is None:
            self._feature_store = FeatureStore()
        return self._feature_store

    def get_similarity_engine(self) -> SimilarityEngine:
        if self._similarity_engine is None:
            self._similarity_engine = SimilarityEngine()
        return self._similarity_engine

    def get_ranking_engine(self) -> RankingEngine:
        if self._ranking_engine is None:
            self._ranking_engine = RankingEngine()
        return self._ranking_engine

    def get_timeline_analyzer(self) -> TimelineAnalyzer:
        if self._timeline_analyzer is None:
            self._timeline_analyzer = TimelineAnalyzer()
        return self._timeline_analyzer

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


def reset_registry() -> None:
    with SimilarityEngineRegistry._lock:
        SimilarityEngineRegistry._instance = None
        SimilarityEngineRegistry._lock = threading.Lock()
