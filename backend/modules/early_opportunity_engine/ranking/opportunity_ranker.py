from __future__ import annotations

from modules.early_opportunity_engine.core.types import (
    RankedOpportunity,
    OpportunityResult,
)


class OpportunityRanker:

    def rank(
        self,
        results: list[OpportunityResult],
        sort_by: str = "opportunity_score",
        limit: int = 50,
    ) -> list[RankedOpportunity]:
        ranked = []
        for r in results:
            ranked.append(RankedOpportunity(
                symbol=r.symbol,
                opportunity_score=r.opportunity_score,
                rating=r.rating.value,
                stage=r.stage.value,
                confidence=r.confidence,
                risk_score=r.risk.score,
                expected_return=r.expected_return.expected,
            ))

        reverse = sort_by != "risk_score"
        ranked.sort(
            key=lambda x: getattr(x, sort_by, 0),
            reverse=reverse,
        )
        return ranked[:limit]

    def filter_by_min_score(
        self,
        results: list[OpportunityResult],
        min_score: float = 50.0,
    ) -> list[OpportunityResult]:
        return [r for r in results if r.opportunity_score >= min_score]

    def filter_by_stage(
        self,
        results: list[OpportunityResult],
        min_stage: int = 3,
    ) -> list[OpportunityResult]:
        def _stage_num(stage_val: str) -> int:
            try:
                return int(stage_val.split("_")[1])
            except (IndexError, ValueError):
                return 0
        return [
            r for r in results
            if _stage_num(r.stage.value) >= min_stage
        ]

    def filter_by_confidence(
        self,
        results: list[OpportunityResult],
        min_confidence: float = 50.0,
    ) -> list[OpportunityResult]:
        return [r for r in results if r.confidence >= min_confidence]

    def get_top_opportunities(
        self,
        results: list[OpportunityResult],
        limit: int = 10,
    ) -> list[OpportunityResult]:
        sorted_results = sorted(
            results,
            key=lambda x: x.opportunity_score,
            reverse=True,
        )
        return sorted_results[:limit]

    def aggregate(self, results: list[OpportunityResult]) -> dict:
        if not results:
            return {
                "total": 0,
                "avg_score": 0.0,
                "avg_confidence": 0.0,
                "avg_risk": 0.0,
                "exceptional": 0,
                "very_high": 0,
                "high": 0,
                "medium": 0,
                "low": 0,
                "very_low": 0,
            }

        from modules.early_opportunity_engine.core.types import OpportunityRating
        rating_counts = {r.value: 0 for r in OpportunityRating}
        for r in results:
            rating_counts[r.rating.value] = rating_counts.get(r.rating.value, 0) + 1

        return {
            "total": len(results),
            "avg_score": sum(r.opportunity_score for r in results) / len(results),
            "avg_confidence": sum(r.confidence for r in results) / len(results),
            "avg_risk": sum(r.risk.score for r in results) / len(results),
            "exceptional": rating_counts.get(OpportunityRating.EXCEPTIONAL.value, 0),
            "very_high": rating_counts.get(OpportunityRating.VERY_HIGH.value, 0),
            "high": rating_counts.get(OpportunityRating.HIGH.value, 0),
            "medium": rating_counts.get(OpportunityRating.MEDIUM.value, 0),
            "low": rating_counts.get(OpportunityRating.LOW.value, 0),
            "very_low": rating_counts.get(OpportunityRating.VERY_LOW.value, 0),
        }
