from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.multi_factor_engine.core.types import (
    FactorGroup,
    FactorName,
    FactorProfile,
    FactorRanking,
    FactorScore,
    GroupScore,
    ScoreStrength,
    _clamp,
    _mean,
    score_to_strength,
)


class FactorRanker:
    def rank(
        self,
        group_scores: List[GroupScore],
        factor_scores: List[FactorScore],
        symbol: str = "",
    ) -> FactorRanking:
        sorted_groups = sorted(group_scores, key=lambda g: g.score, reverse=True)
        for i, g in enumerate(sorted_groups, 1):
            g.rank = i

        sorted_factors = sorted(factor_scores, key=lambda f: f.score, reverse=True)
        factor_ranks: Dict[str, int] = {}
        for i, f in enumerate(sorted_factors, 1):
            factor_ranks[f.factor.value] = i

        group_ranks: Dict[str, int] = {}
        for g in sorted_groups:
            group_ranks[g.group.value] = g.rank

        n = len(factor_scores)
        strength_factors = [
            f.factor.value for f in sorted_factors[:max(1, n // 5)]
        ]
        weakness_factors = [
            f.factor.value for f in sorted_factors[-max(1, n // 5):]
        ]

        overall_scores = [g.score for g in group_scores]
        overall = _mean(overall_scores) if overall_scores else 0.0
        percentile = overall

        return FactorRanking(
            symbol=symbol,
            overall_rank=0,
            group_ranks=group_ranks,
            factor_ranks=factor_ranks,
            strength_factors=strength_factors,
            weakness_factors=weakness_factors,
            percentile=percentile,
        )

    def rank_batch(
        self,
        profiles: List[FactorProfile],
    ) -> List[FactorRanking]:
        rankings: List[FactorRanking] = []
        for p in profiles:
            r = FactorRanking(
                symbol=p.symbol,
                overall_rank=0,
                percentile=p.overall_score,
            )
            r.strength_factors = p.strengths[:5]
            r.weakness_factors = p.weaknesss[:5] if hasattr(p, "weaknesss") else p.weaknesses[:5]
            rankings.append(r)

        sorted_r = sorted(rankings, key=lambda x: x.percentile, reverse=True)
        for i, r in enumerate(sorted_r, 1):
            r.overall_rank = i
        return rankings
