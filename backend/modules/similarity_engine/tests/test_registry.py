from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.similarity_engine.registry.registry import SimilarityEngineRegistry, reset_registry


@pytest.fixture(autouse=True)
def _clean_registry():
    reset_registry()
    yield
    reset_registry()


class TestSingletonPattern:
    def test_same_instance(self):
        a = SimilarityEngineRegistry()
        b = SimilarityEngineRegistry()
        assert a is b


class TestResetRegistry:
    def test_reset_creates_new_instance(self):
        a = SimilarityEngineRegistry()
        reset_registry()
        b = SimilarityEngineRegistry()
        assert a is not b


class TestGetComponentGetters:
    def test_get_feature_store(self):
        reg = SimilarityEngineRegistry()
        fs = reg.get_feature_store()
        assert fs is not None

    def test_get_similarity_engine(self):
        reg = SimilarityEngineRegistry()
        se = reg.get_similarity_engine()
        assert se is not None

    def test_get_ranking_engine(self):
        reg = SimilarityEngineRegistry()
        re = reg.get_ranking_engine()
        assert re is not None

    def test_get_timeline_analyzer(self):
        reg = SimilarityEngineRegistry()
        ta = reg.get_timeline_analyzer()
        assert ta is not None

    def test_get_report_generator(self):
        reg = SimilarityEngineRegistry()
        rg = reg.get_report_generator()
        assert rg is not None

    def test_get_request_validator(self):
        reg = SimilarityEngineRegistry()
        rv = reg.get_request_validator()
        assert rv is not None

    def test_get_result_validator(self):
        reg = SimilarityEngineRegistry()
        rv = reg.get_result_validator()
        assert rv is not None

    def test_getters_return_same_instances(self):
        reg = SimilarityEngineRegistry()
        assert reg.get_feature_store() is reg.get_feature_store()
        assert reg.get_similarity_engine() is reg.get_similarity_engine()
        assert reg.get_ranking_engine() is reg.get_ranking_engine()
        assert reg.get_timeline_analyzer() is reg.get_timeline_analyzer()
        assert reg.get_report_generator() is reg.get_report_generator()
        assert reg.get_request_validator() is reg.get_request_validator()
        assert reg.get_result_validator() is reg.get_result_validator()
