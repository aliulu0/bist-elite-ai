from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.similarity_engine.schemas.schemas import (
    BenchmarkResultSchema,
    CacheStatsSchema,
    FeatureVectorSchema,
    HistoricalOutcomeSchema,
    MarketRegimeSchema,
    PatternMemorySchema,
    PatternOutcomeSchema,
    ReportTypeSchema,
    SimilarityAnalysisSchema,
    SimilarityLabelSchema,
    SimilarityListResponse,
    SimilarityMethodSchema,
    SimilarityReportResponse,
    SimilarityRequestSchema,
    SimilarityResultSchema,
    SimilarityTopResponse,
    ValidationPeriodSchema,
)


class TestSchemaEnums:
    def test_similarity_method_schema(self):
        for m in SimilarityMethodSchema:
            assert m.value in [
                "weighted_feature", "cosine", "euclidean",
                "manhattan", "dynamic_time_warping", "hybrid",
            ]

    def test_similarity_label_schema(self):
        for l in SimilarityLabelSchema:
            assert l.value in [
                "very_weak", "weak", "moderate",
                "strong", "very_strong", "exceptional",
            ]

    def test_market_regime_schema(self):
        for r in MarketRegimeSchema:
            assert r.value in ["bull", "bear", "sideways", "high_volatility", "low_volatility"]

    def test_pattern_outcome_schema(self):
        for p in PatternOutcomeSchema:
            assert p.value in ["successful", "failed", "neutral"]

    def test_report_type_schema(self):
        for rt in ReportTypeSchema:
            assert rt.value in [
                "executive_summary", "top_similar_stocks", "performance_comparison",
                "similarity_heatmap", "feature_comparison", "risk_comparison", "full",
            ]


class TestFeatureVectorSchema:
    def test_construction(self):
        fvs = FeatureVectorSchema(symbol="THYAO", date="2024-01-01", features={"rsi": 50.0})
        assert fvs.symbol == "THYAO"
        assert fvs.features["rsi"] == 50.0


class TestSimilarityResultSchema:
    def test_construction(self):
        srs = SimilarityResultSchema(
            source_symbol="THYAO",
            target_symbol="GARAN",
            similarity_score=0.85,
        )
        assert srs.similarity_score == 0.85


class TestSimilarityRequestSchema:
    def test_construction(self):
        srs = SimilarityRequestSchema(symbol="THYAO", reference_date="2024-01-01")
        assert srs.symbol == "THYAO"
        assert srs.top_n == 5

    def test_defaults(self):
        srs = SimilarityRequestSchema()
        assert srs.top_n == 5
        assert srs.min_similarity == 0.3
        assert srs.lookback_days == 252


class TestSimilarityAnalysisSchema:
    def test_construction(self):
        sas = SimilarityAnalysisSchema(
            symbol="THYAO",
            overall_similarity=0.75,
            confidence_score=0.8,
        )
        assert sas.overall_similarity == 0.75


class TestCacheStatsSchema:
    def test_construction(self):
        css = CacheStatsSchema(size=10, hits=8, misses=2, hit_rate=0.8)
        assert css.hit_rate == 0.8


class TestBenchmarkResultSchema:
    def test_construction(self):
        brs = BenchmarkResultSchema(operation="test", iterations=10, success=True)
        assert brs.success is True


class TestSimilarityListResponse:
    def test_construction(self):
        slr = SimilarityListResponse(total=5)
        assert slr.total == 5
        assert slr.results == []


class TestSimilarityTopResponse:
    def test_construction(self):
        str = SimilarityTopResponse(symbol="THYAO", total=3)
        assert str.symbol == "THYAO"


class TestSimilarityReportResponse:
    def test_construction(self):
        srr = SimilarityReportResponse(report_type="summary", symbol="THYAO")
        assert srr.report_type == "summary"
