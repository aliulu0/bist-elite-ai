from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple

from modules.similarity_engine.core.types import (
    FeatureVector,
    MarketRegime,
    PatternOutcome,
    SimilarityLabel,
    SimilarityMethod,
    SimilarityResult,
    classify_similarity_label,
    cosine_similarity,
    dynamic_time_warping_distance,
    hybrid_similarity_score,
    manhattan_distance,
    weighted_euclidean_distance,
)


class SimilarityEngine:
    """Computes similarity between feature vectors using multiple methods."""

    DEFAULT_WEIGHTS: Dict[str, float] = {
        "rsi": 1.5,
        "macd": 1.2,
        "ma_short": 1.0,
        "ma_long": 1.0,
        "adx": 1.3,
        "obv": 0.8,
        "cmf": 0.8,
        "volume_sma": 0.7,
        "relative_volume": 0.9,
        "pattern_confidence": 1.4,
        "pe_ratio": 1.0,
        "roe": 1.0,
        "revenue_growth": 0.8,
        "profit_margin": 0.8,
    }

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        default_method: SimilarityMethod = SimilarityMethod.WEIGHTED_FEATURE,
    ) -> None:
        self._weights = weights or dict(self.DEFAULT_WEIGHTS)
        self._default_method = default_method

    def compute_similarity(
        self,
        vec_a: FeatureVector,
        vec_b: FeatureVector,
        method: Optional[SimilarityMethod] = None,
    ) -> SimilarityResult:
        method = method or self._default_method
        common = set(vec_a.features.keys()) & set(vec_b.features.keys())
        if not common:
            return SimilarityResult(
                source_symbol=vec_a.symbol,
                target_symbol=vec_b.symbol,
                target_date=vec_b.date,
                similarity_score=0.0,
                similarity_label=SimilarityLabel.VERY_WEAK,
                method=method,
            )

        a_sub = {k: vec_a.features[k] for k in common}
        b_sub = {k: vec_b.features[k] for k in common}
        w_sub = {k: self._weights.get(k, 1.0) for k in common}

        if method == SimilarityMethod.WEIGHTED_FEATURE:
            score = self._weighted_feature_score(a_sub, b_sub, w_sub)
        elif method == SimilarityMethod.COSINE:
            score = cosine_similarity(a_sub, b_sub)
        elif method == SimilarityMethod.EUCLIDEAN:
            dist = weighted_euclidean_distance(a_sub, b_sub, w_sub)
            max_possible = (sum(w_sub.values())) ** 0.5 if w_sub else 1.0
            score = 1.0 - min(dist / max_possible, 1.0) if max_possible > 0 else 0.0
        elif method == SimilarityMethod.MANHATTAN:
            dist = manhattan_distance(a_sub, b_sub, w_sub)
            max_possible = sum(w_sub.values()) if w_sub else 1.0
            score = 1.0 - min(dist / max_possible, 1.0) if max_possible > 0 else 0.0
        elif method == SimilarityMethod.DYNAMIC_TIME_WARPING:
            a_series = [a_sub.get(k, 0.0) for k in sorted(common)]
            b_series = [b_sub.get(k, 0.0) for k in sorted(common)]
            dist = dynamic_time_warping_distance(a_series, b_series)
            score = 1.0 / (1.0 + dist)
        elif method == SimilarityMethod.HYBRID:
            score = hybrid_similarity_score(a_sub, b_sub, w_sub)
        else:
            score = self._weighted_feature_score(a_sub, b_sub, w_sub)

        score = max(0.0, min(1.0, score))
        label = classify_similarity_label(score)
        distances = {k: abs(a_sub[k] - b_sub[k]) for k in common}
        contributions = {k: w_sub[k] * (1.0 - abs(a_sub[k] - b_sub[k])) for k in common}

        return SimilarityResult(
            source_symbol=vec_a.symbol,
            target_symbol=vec_b.symbol,
            target_date=vec_b.date,
            similarity_score=round(score, 6),
            similarity_label=label,
            method=method,
            feature_distances=distances,
            contributing_features=contributions,
        )

    def find_most_similar(
        self,
        query: FeatureVector,
        candidates: List[FeatureVector],
        method: Optional[SimilarityMethod] = None,
        top_n: int = 5,
        min_score: float = 0.0,
    ) -> List[SimilarityResult]:
        results: List[SimilarityResult] = []
        for cand in candidates:
            if cand.symbol == query.symbol and cand.date == query.date:
                continue
            result = self.compute_similarity(query, cand, method)
            if result.similarity_score >= min_score:
                results.append(result)
        results.sort(key=lambda r: r.similarity_score, reverse=True)
        return results[:top_n]

    def batch_similarity(
        self,
        query: FeatureVector,
        candidates: List[FeatureVector],
        methods: List[SimilarityMethod],
        top_n: int = 5,
    ) -> Dict[SimilarityMethod, List[SimilarityResult]]:
        results: Dict[SimilarityMethod, List[SimilarityResult]] = {}
        for method in methods:
            results[method] = self.find_most_similar(query, candidates, method, top_n)
        return results

    def ensemble_similarity(
        self,
        query: FeatureVector,
        candidates: List[FeatureVector],
        methods: Optional[List[SimilarityMethod]] = None,
        method_weights: Optional[Dict[SimilarityMethod, float]] = None,
        top_n: int = 5,
    ) -> List[SimilarityResult]:
        methods = methods or list(SimilarityMethod)
        method_weights = method_weights or {m: 1.0 for m in methods}
        total_weight = sum(method_weights.values())
        if total_weight == 0:
            return []

        all_scores: Dict[str, Dict[SimilarityMethod, float]] = {}
        for method in methods:
            results = self.find_most_similar(query, candidates, method, top_n=len(candidates))
            for r in results:
                key = f"{r.target_symbol}_{r.target_date}"
                if key not in all_scores:
                    all_scores[key] = {}
                all_scores[key][method] = r.similarity_score

        combined: List[SimilarityResult] = []
        for key, method_scores in all_scores.items():
            weighted_sum = sum(
                method_scores.get(m, 0.0) * method_weights.get(m, 1.0)
                for m in methods
            )
            avg_score = weighted_sum / total_weight
            parts = key.split("_", 1)
            target_symbol = parts[0] if parts else ""
            target_date = parts[1] if len(parts) > 1 else ""
            combined.append(SimilarityResult(
                source_symbol=query.symbol,
                target_symbol=target_symbol,
                target_date=target_date,
                similarity_score=round(avg_score, 6),
                similarity_label=classify_similarity_label(avg_score),
                method=SimilarityMethod.HYBRID,
                metadata={"method_scores": {m.value: s for m, s in method_scores.items()}},
            ))

        combined.sort(key=lambda r: r.similarity_score, reverse=True)
        return combined[:top_n]

    def _weighted_feature_score(
        self,
        vec_a: Dict[str, float],
        vec_b: Dict[str, float],
        weights: Dict[str, float],
    ) -> float:
        total_score = 0.0
        total_weight = 0.0
        all_keys = set(vec_a.keys()) | set(vec_b.keys())
        for k in all_keys:
            w = weights.get(k, 1.0)
            a = vec_a.get(k, 0.0)
            b = vec_b.get(k, 0.0)
            max_val = max(abs(a), abs(b), 1.0)
            similarity = 1.0 - abs(a - b) / max_val
            total_score += w * similarity
            total_weight += w
        return total_score / total_weight if total_weight > 0 else 0.0

    def set_weights(self, weights: Dict[str, float]) -> None:
        self._weights.update(weights)

    def get_weights(self) -> Dict[str, float]:
        return dict(self._weights)
