from __future__ import annotations

from typing import Dict, List, Tuple

from modules.portfolio_engine.core.types import (
    StockCandidate,
    SelectionResult,
    RejectionReason,
    _clamp,
)


class Diversifier:
    def diversify(
        self,
        selected: List[StockCandidate],
        rejected: List[SelectionResult],
        max_per_sector: int,
    ) -> Tuple[List[StockCandidate], List[SelectionResult]]:
        diversified: List[StockCandidate] = []
        overflow: List[SelectionResult] = list(rejected)

        for candidate in selected:
            if self._can_add(candidate.sector, diversified, max_per_sector):
                diversified.append(candidate)
            else:
                overflow.append(SelectionResult(
                    symbol=candidate.symbol,
                    selected=False,
                    reason=RejectionReason.SECTOR_CONCENTRATION.value,
                    rejection_reason=RejectionReason.SECTOR_CONCENTRATION,
                    rank=candidate.rank,
                    composite_score=candidate.composite_score,
                    metadata=candidate.metadata,
                ))

        return diversified, overflow

    def _count_sector(self, sector: str, selected: List[StockCandidate]) -> int:
        return sum(1 for c in selected if c.sector == sector)

    def _can_add(
        self,
        sector: str,
        selected: List[StockCandidate],
        max_per_sector: int,
    ) -> bool:
        return self._count_sector(sector, selected) < max_per_sector

    def compute_sector_distribution(self, selected: List[StockCandidate]) -> Dict[str, int]:
        distribution: Dict[str, int] = {}
        for c in selected:
            distribution[c.sector] = distribution.get(c.sector, 0) + 1
        return distribution

    def compute_diversification_score(self, selected: List[StockCandidate]) -> float:
        if not selected:
            return 0.0

        distribution = self.compute_sector_distribution(selected)
        n_sectors = len(distribution)
        n_stocks = len(selected)

        if n_stocks <= 1:
            return 0.0

        hhi = sum((count / n_stocks) ** 2 for count in distribution.values())
        max_hhi = 1.0
        min_hhi = 1.0 / n_sectors if n_sectors > 0 else 1.0

        if max_hhi == min_hhi:
            return 100.0

        normalized = (hhi - min_hhi) / (max_hhi - min_hhi)
        score = (1.0 - normalized) * 100.0
        return _clamp(score, 0.0, 100.0)

    def compute_concentration_risk(self, selected: List[StockCandidate]) -> float:
        if not selected:
            return 0.0

        distribution = self.compute_sector_distribution(selected)
        n_stocks = len(selected)

        if n_stocks <= 1:
            return 100.0

        max_fraction = max(count / n_stocks for count in distribution.values())
        return _clamp(max_fraction * 100.0, 0.0, 100.0)

    def compute_liquidity_distribution(self, selected: List[StockCandidate]) -> Dict[str, int]:
        buckets: Dict[str, int] = {
            "low": 0,
            "medium": 0,
            "high": 0,
        }
        for c in selected:
            if c.liquidity < 33.0:
                buckets["low"] += 1
            elif c.liquidity < 66.0:
                buckets["medium"] += 1
            else:
                buckets["high"] += 1
        return buckets

    def compute_risk_distribution(self, selected: List[StockCandidate]) -> Dict[str, int]:
        buckets: Dict[str, int] = {
            "very_low": 0,
            "low": 0,
            "moderate": 0,
            "high": 0,
            "very_high": 0,
        }
        for c in selected:
            if c.risk <= 20.0:
                buckets["very_low"] += 1
            elif c.risk <= 40.0:
                buckets["low"] += 1
            elif c.risk <= 60.0:
                buckets["moderate"] += 1
            elif c.risk <= 80.0:
                buckets["high"] += 1
            else:
                buckets["very_high"] += 1
        return buckets
