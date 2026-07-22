from __future__ import annotations

from typing import List, Optional, Tuple

from modules.portfolio_engine.core.types import (
    StockCandidate,
    SelectionResult,
    PortfolioRequest,
    RejectionReason,
    MIN_ELITE_SCORE,
    MIN_CONFIDENCE,
    MIN_LIQUIDITY,
    MAX_RISK_FOR_INCLUSION,
    MIN_DECISION_SCORE,
)


class PortfolioSelector:
    def select(
        self,
        candidates: List[StockCandidate],
        request: PortfolioRequest,
    ) -> Tuple[List[StockCandidate], List[SelectionResult]]:
        selected: List[StockCandidate] = []
        rejected: List[SelectionResult] = []

        for candidate in candidates:
            passes, rejection_reason = self._passes_all_rules(candidate, request)
            if passes:
                selected.append(candidate)
            else:
                rejected.append(SelectionResult(
                    symbol=candidate.symbol,
                    selected=False,
                    reason=rejection_reason.value if rejection_reason else "",
                    rejection_reason=rejection_reason,
                    rank=candidate.rank,
                    composite_score=candidate.composite_score,
                    metadata=candidate.metadata,
                ))

        return selected, rejected

    def _passes_all_rules(
        self,
        candidate: StockCandidate,
        request: PortfolioRequest,
    ) -> Tuple[bool, Optional[RejectionReason]]:
        if not self._passes_elite_score(candidate, request):
            return False, RejectionReason.LOW_ELITE_SCORE
        if not self._passes_confidence(candidate, request):
            return False, RejectionReason.LOW_CONFIDENCE
        if not self._passes_liquidity(candidate, request):
            return False, RejectionReason.LOW_LIQUIDITY
        if not self._passes_risk(candidate, request):
            return False, RejectionReason.VERY_HIGH_RISK
        if not self._passes_decision_score(candidate, request):
            return False, RejectionReason.LOW_DECISION_SCORE
        return True, None

    def _passes_elite_score(
        self,
        candidate: StockCandidate,
        request: PortfolioRequest,
    ) -> bool:
        return candidate.elite_score >= request.min_elite_score

    def _passes_confidence(
        self,
        candidate: StockCandidate,
        request: PortfolioRequest,
    ) -> bool:
        return candidate.confidence >= request.min_confidence

    def _passes_liquidity(
        self,
        candidate: StockCandidate,
        request: PortfolioRequest,
    ) -> bool:
        return candidate.liquidity >= request.min_liquidity

    def _passes_risk(
        self,
        candidate: StockCandidate,
        request: PortfolioRequest,
    ) -> bool:
        return candidate.risk <= request.max_risk

    def _passes_decision_score(
        self,
        candidate: StockCandidate,
        request: PortfolioRequest,
    ) -> bool:
        return candidate.decision_score >= request.min_decision_score
