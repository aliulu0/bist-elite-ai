from __future__ import annotations

from typing import List

from modules.portfolio_engine.core.types import (
    StockCandidate,
    SortField,
    compute_composite_score,
)


class StockRanker:
    def rank(
        self,
        candidates: List[StockCandidate],
        sort_by: SortField = SortField.COMPOSITE,
    ) -> List[StockCandidate]:
        self.compute_composite_scores(candidates)
        method = self._get_sort_method(sort_by)
        sorted_candidates = method(candidates)
        for i, c in enumerate(sorted_candidates, start=1):
            c.rank = i
        return sorted_candidates

    def rank_by_composite(self, candidates: List[StockCandidate]) -> List[StockCandidate]:
        self.compute_composite_scores(candidates)
        return sorted(candidates, key=lambda c: c.composite_score, reverse=True)

    def rank_by_elite(self, candidates: List[StockCandidate]) -> List[StockCandidate]:
        return sorted(candidates, key=lambda c: c.elite_score, reverse=True)

    def rank_by_decision(self, candidates: List[StockCandidate]) -> List[StockCandidate]:
        return sorted(candidates, key=lambda c: c.decision_score, reverse=True)

    def rank_by_confidence(self, candidates: List[StockCandidate]) -> List[StockCandidate]:
        return sorted(candidates, key=lambda c: c.confidence, reverse=True)

    def rank_by_risk(self, candidates: List[StockCandidate]) -> List[StockCandidate]:
        return sorted(candidates, key=lambda c: c.risk, reverse=False)

    def rank_by_liquidity(self, candidates: List[StockCandidate]) -> List[StockCandidate]:
        return sorted(candidates, key=lambda c: c.liquidity, reverse=True)

    def compute_composite_scores(self, candidates: List[StockCandidate]) -> None:
        for c in candidates:
            c.composite_score = compute_composite_score(
                elite_score=c.elite_score,
                decision_score=c.decision_score,
                confidence=c.confidence,
                risk=c.risk,
                liquidity=c.liquidity,
            )

    def _get_sort_method(self, sort_by: SortField):
        mapping = {
            SortField.COMPOSITE: self.rank_by_composite,
            SortField.ELITE_SCORE: self.rank_by_elite,
            SortField.DECISION_SCORE: self.rank_by_decision,
            SortField.CONFIDENCE: self.rank_by_confidence,
            SortField.RISK: self.rank_by_risk,
            SortField.LIQUIDITY: self.rank_by_liquidity,
        }
        return mapping[sort_by]
