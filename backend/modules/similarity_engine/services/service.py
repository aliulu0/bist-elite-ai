from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from modules.similarity_engine.cache.cache import SimilarityCache
from modules.similarity_engine.core.types import (
    FeatureCategory,
    FeatureVector,
    MarketRegime,
    PatternMemory,
    ReportType,
    SimilarityAnalysis,
    SimilarityMethod,
    SimilarityRequest,
    SimilarityResult,
    ValidationPeriod,
    _mean,
)
from modules.similarity_engine.feature_store.store import FeatureStore
from modules.similarity_engine.ranking.engine import RankingEngine
from modules.similarity_engine.reports.generator import ReportGenerator
from modules.similarity_engine.similarity_models.models import SimilarityEngine
from modules.similarity_engine.timeline.analyzer import TimelineAnalyzer
from modules.similarity_engine.validators.validator import RequestValidator, ResultValidator


class SimilarityEngineService:
    """Orchestration layer for similarity analysis."""

    def __init__(
        self,
        feature_store: Optional[FeatureStore] = None,
        similarity_engine: Optional[SimilarityEngine] = None,
        ranking_engine: Optional[RankingEngine] = None,
        timeline_analyzer: Optional[TimelineAnalyzer] = None,
        report_generator: Optional[ReportGenerator] = None,
        request_validator: Optional[RequestValidator] = None,
        result_validator: Optional[ResultValidator] = None,
        cache: Optional[SimilarityCache] = None,
    ) -> None:
        self._feature_store = feature_store or FeatureStore()
        self._similarity_engine = similarity_engine or SimilarityEngine()
        self._ranking_engine = ranking_engine or RankingEngine()
        self._timeline_analyzer = timeline_analyzer or TimelineAnalyzer()
        self._report_generator = report_generator or ReportGenerator()
        self._request_validator = request_validator or RequestValidator()
        self._result_validator = result_validator or ResultValidator()
        self._cache = cache or SimilarityCache()
        self._analyses: List[SimilarityAnalysis] = []

    def analyze(self, request: SimilarityRequest) -> SimilarityAnalysis:
        start = time.time()
        errors = self._request_validator.validate(request)
        if errors:
            raise ValueError(f"Invalid request: {'; '.join(errors)}")

        cache_key = self._make_cache_key(request)
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        query = self._get_query_vector(request)
        candidates = self._get_candidates(request)

        results: List[SimilarityResult] = []
        for method in request.methods:
            method_results = self._similarity_engine.find_most_similar(
                query, candidates, method, request.top_n, request.min_similarity
            )
            results.extend(method_results)

        results = self._ranking_engine.deduplicate(results)
        results = self._ranking_engine.rank_by_score(results, request.top_n)
        results = [r for r in results if r.similarity_score >= request.min_similarity]

        outcomes = self._timeline_analyzer.compute_historical_outcomes(results)
        regime_dist = self._timeline_analyzer.compute_regime_distribution(results)
        pattern_memories = self._timeline_analyzer.build_pattern_memory(results, outcomes)
        confidence = self._timeline_analyzer.analyze_confidence(results, outcomes)

        overall = _mean([r.similarity_score for r in results]) if results else 0.0

        analysis = SimilarityAnalysis(
            request=request,
            results=results,
            top_similar_stocks=results[:request.top_n],
            historical_outcomes=outcomes,
            pattern_memories=pattern_memories,
            overall_similarity=round(overall, 6),
            confidence_score=round(confidence, 6),
            regime_distribution=regime_dist,
            execution_time_ms=(time.time() - start) * 1000,
        )

        self._analyses.append(analysis)
        self._cache.put(cache_key, analysis)
        return analysis

    def get_list(
        self,
        symbol: Optional[str] = None,
    ) -> List[SimilarityResult]:
        all_results: List[SimilarityResult] = []
        for a in self._analyses:
            if symbol is None or a.request.symbol == symbol:
                all_results.extend(a.results)
        return all_results

    def get_top(
        self,
        symbol: str,
        top_n: int = 5,
    ) -> List[SimilarityResult]:
        for a in reversed(self._analyses):
            if a.request.symbol == symbol:
                return a.top_similar_stocks[:top_n]
        return []

    def get_details(
        self,
        symbol: str,
    ) -> Optional[SimilarityAnalysis]:
        for a in reversed(self._analyses):
            if a.request.symbol == symbol:
                return a
        return None

    def get_history(self) -> List[Dict[str, Any]]:
        return [
            {
                "symbol": a.request.symbol,
                "reference_date": a.request.reference_date,
                "total_results": len(a.results),
                "overall_similarity": a.overall_similarity,
                "confidence_score": a.confidence_score,
                "execution_time_ms": a.execution_time_ms,
            }
            for a in self._analyses
        ]

    def generate_report(
        self,
        symbol: str,
        report_type: ReportType = ReportType.EXECUTIVE_SUMMARY,
    ) -> Dict[str, Any]:
        analysis = self.get_details(symbol)
        if analysis is None:
            return {"error": f"No analysis found for {symbol}"}
        return self._report_generator.generate(analysis, report_type)

    def store_feature_vector(self, vector: FeatureVector) -> str:
        return self._feature_store.store(vector)

    def get_feature_store_size(self) -> int:
        return self._feature_store.count()

    def clear_cache(self) -> None:
        self._cache.clear()

    def get_cache_stats(self) -> Dict[str, Any]:
        return {
            "size": self._cache.size,
            "hits": self._cache.hits,
            "misses": self._cache.misses,
            "hit_rate": self._cache.hit_rate,
            "max_size": 512,
            "ttl_seconds": 7200.0,
        }

    def _get_query_vector(self, request: SimilarityRequest) -> FeatureVector:
        stored = self._feature_store.get(request.symbol, request.reference_date)
        if stored:
            return stored
        import hashlib
        h = hashlib.md5(f"{request.symbol}_{request.reference_date}".encode()).digest()
        features = {}
        feature_names = [
            "rsi", "macd", "ma_short", "ma_long", "adx", "obv", "cmf",
            "volume_sma", "relative_volume", "pattern_confidence", "pe_ratio",
            "roe", "revenue_growth", "profit_margin",
        ]
        for i, name in enumerate(feature_names):
            features[name] = (h[i % len(h)] / 255.0) * 2.0 - 1.0
        return FeatureVector(
            symbol=request.symbol,
            date=request.reference_date,
            features=features,
        )

    def _get_candidates(
        self,
        request: SimilarityRequest,
    ) -> List[FeatureVector]:
        candidates = self._feature_store.search(
            date_from=None,
            date_to=None,
        )
        if candidates:
            return candidates
        return self._generate_synthetic_candidates(request)

    def _generate_synthetic_candidates(
        self,
        request: SimilarityRequest,
    ) -> List[FeatureVector]:
        import hashlib
        candidates: List[FeatureVector] = []
        symbols = [
            "GARAN", "AKBNK", "EREGL", "BIMAS", "KCHOL",
            "SAHOL", "TUPRS", "ASELS", "FROTO", "SISE",
            "TOASO", "TCELL", "HALKB", "VAKBN", "YKBNK",
        ]
        for sym in symbols:
            if sym == request.symbol:
                continue
            for day_offset in range(0, request.lookback_days, 21):
                h = hashlib.md5(f"{sym}_{day_offset}".encode()).digest()
                features = {}
                feature_names = [
                    "rsi", "macd", "ma_short", "ma_long", "adx", "obv", "cmf",
                    "volume_sma", "relative_volume", "pattern_confidence", "pe_ratio",
                    "roe", "revenue_growth", "profit_margin",
                ]
                for i, name in enumerate(feature_names):
                    features[name] = (h[i % len(h)] / 255.0) * 2.0 - 1.0
                candidates.append(FeatureVector(
                    symbol=sym,
                    date=f"2024-01-{1 + day_offset:02d}" if day_offset < 365 else f"2023-{(day_offset // 30):02d}-01",
                    features=features,
                ))
                if len(candidates) >= 50:
                    return candidates
        return candidates

    def _make_cache_key(self, request: SimilarityRequest) -> str:
        params = {
            "symbol": request.symbol,
            "reference_date": request.reference_date,
            "top_n": request.top_n,
            "methods": [m.value for m in request.methods],
            "min_similarity": request.min_similarity,
        }
        return self._cache.make_key(params)
