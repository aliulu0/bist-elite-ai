from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.market_regime_engine.cache.cache import RegimeCache
from modules.market_regime_engine.classification.engine import RegimeClassifier
from modules.market_regime_engine.history.tracker import RegimeHistoryTracker
from modules.market_regime_engine.registry.registry import MarketRegimeEngineRegistry, reset_registry
from modules.market_regime_engine.reports.generator import ReportGenerator
from modules.market_regime_engine.validators.validator import RequestValidator, ResultValidator


@pytest.fixture(autouse=True)
def _clean_registry():
    reset_registry()
    yield
    reset_registry()


class TestSingleton:
    def test_same_instance(self):
        r1 = MarketRegimeEngineRegistry()
        r2 = MarketRegimeEngineRegistry()
        assert r1 is r2

    def test_reset_creates_new_instance(self):
        r1 = MarketRegimeEngineRegistry()
        reset_registry()
        r2 = MarketRegimeEngineRegistry()
        assert r1 is not r2


class TestGetComponent:
    def test_get_classifier(self):
        registry = MarketRegimeEngineRegistry()
        classifier = registry.get_classifier()
        assert classifier is not None
        assert isinstance(classifier, RegimeClassifier)

    def test_get_history_tracker(self):
        registry = MarketRegimeEngineRegistry()
        tracker = registry.get_history_tracker()
        assert tracker is not None
        assert isinstance(tracker, RegimeHistoryTracker)

    def test_get_report_generator(self):
        registry = MarketRegimeEngineRegistry()
        generator = registry.get_report_generator()
        assert generator is not None
        assert isinstance(generator, ReportGenerator)

    def test_get_request_validator(self):
        registry = MarketRegimeEngineRegistry()
        validator = registry.get_request_validator()
        assert validator is not None
        assert isinstance(validator, RequestValidator)

    def test_get_result_validator(self):
        registry = MarketRegimeEngineRegistry()
        validator = registry.get_result_validator()
        assert validator is not None
        assert isinstance(validator, ResultValidator)

    def test_get_cache(self):
        registry = MarketRegimeEngineRegistry()
        cache = registry.get_cache()
        assert cache is not None
        assert isinstance(cache, RegimeCache)


class TestSameInstanceReturned:
    def test_classifier_same_instance(self):
        registry = MarketRegimeEngineRegistry()
        c1 = registry.get_classifier()
        c2 = registry.get_classifier()
        assert c1 is c2

    def test_tracker_same_instance(self):
        registry = MarketRegimeEngineRegistry()
        t1 = registry.get_history_tracker()
        t2 = registry.get_history_tracker()
        assert t1 is t2

    def test_generator_same_instance(self):
        registry = MarketRegimeEngineRegistry()
        g1 = registry.get_report_generator()
        g2 = registry.get_report_generator()
        assert g1 is g2

    def test_request_validator_same_instance(self):
        registry = MarketRegimeEngineRegistry()
        v1 = registry.get_request_validator()
        v2 = registry.get_request_validator()
        assert v1 is v2

    def test_result_validator_same_instance(self):
        registry = MarketRegimeEngineRegistry()
        v1 = registry.get_result_validator()
        v2 = registry.get_result_validator()
        assert v1 is v2

    def test_cache_same_instance(self):
        registry = MarketRegimeEngineRegistry()
        c1 = registry.get_cache()
        c2 = registry.get_cache()
        assert c1 is c2


class TestResetRegistry:
    def test_reset_allows_fresh_singletons(self):
        registry1 = MarketRegimeEngineRegistry()
        classifier1 = registry1.get_classifier()
        reset_registry()
        registry2 = MarketRegimeEngineRegistry()
        classifier2 = registry2.get_classifier()
        assert classifier1 is not classifier2
