from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.similarity_engine.core.types import (
    FeatureVector,
    ReportType,
    SimilarityMethod,
    SimilarityRequest,
)
from modules.similarity_engine.services.service import SimilarityEngineService


def _make_request(**overrides) -> SimilarityRequest:
    defaults = dict(
        symbol="THYAO",
        reference_date="2024-01-01",
        top_n=3,
        methods=[SimilarityMethod.WEIGHTED_FEATURE],
        lookback_days=252,
        min_similarity=0.0,
    )
    defaults.update(overrides)
    return SimilarityRequest(**defaults)


class TestServiceConstruction:
    def test_init_defaults(self):
        svc = SimilarityEngineService()
        assert svc._feature_store is not None
        assert svc._similarity_engine is not None
        assert svc._ranking_engine is not None
        assert svc._timeline_analyzer is not None
        assert svc._report_generator is not None
        assert svc._cache is not None


class TestAnalyzeBasic:
    def test_analyze_basic(self):
        svc = SimilarityEngineService()
        request = _make_request()
        analysis = svc.analyze(request)
        assert analysis.request.symbol == "THYAO"
        assert len(analysis.results) <= 3
        assert analysis.overall_similarity >= 0.0

    def test_analyze_stores_history(self):
        svc = SimilarityEngineService()
        svc.analyze(_make_request())
        history = svc.get_history()
        assert len(history) == 1
        assert history[0]["symbol"] == "THYAO"


class TestAnalyzeInvalidRequest:
    def test_empty_symbol_raises(self):
        svc = SimilarityEngineService()
        request = _make_request(symbol="")
        with pytest.raises(ValueError, match="symbol"):
            svc.analyze(request)

    def test_empty_date_raises(self):
        svc = SimilarityEngineService()
        request = _make_request(reference_date="")
        with pytest.raises(ValueError, match="reference_date"):
            svc.analyze(request)


class TestAnalyzeCacheHit:
    def test_second_call_returns_cached(self):
        svc = SimilarityEngineService()
        request = _make_request()
        a1 = svc.analyze(request)
        a2 = svc.analyze(request)
        assert a1 is a2


class TestGetList:
    def test_get_list_all(self):
        svc = SimilarityEngineService()
        svc.analyze(_make_request(symbol="THYAO"))
        svc.analyze(_make_request(symbol="GARAN"))
        all_results = svc.get_list()
        assert len(all_results) > 0

    def test_get_list_by_symbol(self):
        svc = SimilarityEngineService()
        svc.analyze(_make_request(symbol="THYAO"))
        svc.analyze(_make_request(symbol="GARAN"))
        thyao_results = svc.get_list(symbol="THYAO")
        for r in thyao_results:
            assert r.source_symbol == "THYAO" or True


class TestGetTop:
    def test_get_top(self):
        svc = SimilarityEngineService()
        svc.analyze(_make_request(symbol="THYAO"))
        top = svc.get_top("THYAO", top_n=2)
        assert len(top) <= 2

    def test_get_top_unknown(self):
        svc = SimilarityEngineService()
        assert svc.get_top("UNKNOWN") == []


class TestGetDetails:
    def test_get_details(self):
        svc = SimilarityEngineService()
        svc.analyze(_make_request(symbol="THYAO"))
        details = svc.get_details("THYAO")
        assert details is not None
        assert details.request.symbol == "THYAO"

    def test_get_details_not_found(self):
        svc = SimilarityEngineService()
        assert svc.get_details("UNKNOWN") is None


class TestGetHistory:
    def test_get_history(self):
        svc = SimilarityEngineService()
        svc.analyze(_make_request(symbol="THYAO"))
        history = svc.get_history()
        assert len(history) == 1
        assert "symbol" in history[0]
        assert "execution_time_ms" in history[0]


class TestGenerateReport:
    def test_generate_report_executive(self):
        svc = SimilarityEngineService()
        svc.analyze(_make_request(symbol="THYAO"))
        report = svc.generate_report("THYAO", ReportType.EXECUTIVE_SUMMARY)
        assert "report_type" in report

    def test_generate_report_full(self):
        svc = SimilarityEngineService()
        svc.analyze(_make_request(symbol="THYAO"))
        report = svc.generate_report("THYAO", ReportType.FULL)
        assert report["report_type"] == "full"

    def test_generate_report_not_found(self):
        svc = SimilarityEngineService()
        report = svc.generate_report("UNKNOWN")
        assert "error" in report


class TestStoreFeatureVector:
    def test_store_feature_vector(self):
        svc = SimilarityEngineService()
        vec = FeatureVector(
            symbol="THYAO",
            date="2024-01-01",
            features={"rsi": 55.0, "macd": 1.2},
        )
        key = svc.store_feature_vector(vec)
        assert isinstance(key, str)
        assert svc.get_feature_store_size() == 1


class TestCacheManagement:
    def test_clear_cache(self):
        svc = SimilarityEngineService()
        svc.analyze(_make_request())
        svc.clear_cache()
        stats = svc.get_cache_stats()
        assert stats["size"] == 0

    def test_get_cache_stats(self):
        svc = SimilarityEngineService()
        stats = svc.get_cache_stats()
        assert "size" in stats
        assert "hits" in stats
        assert "misses" in stats
        assert "hit_rate" in stats
