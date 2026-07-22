from __future__ import annotations

import math
from modules.pattern_engine.core.types import (
    PatternResult, PatternCategory, PatternDirection, SimilarityResult,
)


class PatternSimilarityEngine:

    @staticmethod
    def _result_features(r: PatternResult) -> list[float]:
        return [
            r.confidence,
            r.probability,
            r.risk,
            r.expected_pullback,
            r.pattern_quality,
            r.confirmation_score,
            1.0 if r.direction == PatternDirection.BULLISH else (-1.0 if r.direction == PatternDirection.BEARISH else 0.0),
        ]

    @staticmethod
    def cosine_similarity(a: list[float], b: list[float]) -> float:
        if len(a) != len(b) or len(a) == 0:
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(x * x for x in b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    @staticmethod
    def find_similar(
        target: PatternResult,
        historical: list[PatternResult],
        top_k: int = 5,
    ) -> SimilarityResult:
        if not historical:
            return SimilarityResult(similarity_score=0.0, similar_patterns=[], top_historical_match="")
        target_feat = PatternSimilarityEngine._result_features(target)
        scored: list[tuple[float, PatternResult]] = []
        for h in historical:
            h_feat = PatternSimilarityEngine._result_features(h)
            sim = PatternSimilarityEngine.cosine_similarity(target_feat, h_feat)
            scored.append((sim, h))
        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:top_k]
        matches = []
        for sim, h in top:
            matches.append({
                "pattern_name": h.pattern_name,
                "similarity": round(sim, 4),
                "direction": h.direction.value,
                "confidence": h.confidence,
                "status": h.status.value,
            })
        best_name = top[0][1].pattern_name if top else ""
        avg_sim = sum(s for s, _ in top) / len(top) if top else 0.0
        return SimilarityResult(
            similarity_score=round(avg_sim, 4),
            similar_patterns=matches,
            top_historical_match=best_name,
        )
