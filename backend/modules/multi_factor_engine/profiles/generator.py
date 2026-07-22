from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.multi_factor_engine.core.types import (
    FACTOR_GROUP_MAP,
    FactorGroup,
    FactorName,
    FactorProfile,
    FactorScore,
    GroupScore,
    InvestmentHorizon,
    MarketRegime,
    ScoreStrength,
    _clamp,
    _mean,
    compute_weighted_score,
    score_to_strength,
)


class FactorProfileGenerator:
    def generate(
        self,
        symbol: str,
        reference_date: str,
        group_scores: List[GroupScore],
        factor_scores: List[FactorScore],
        horizon: InvestmentHorizon = InvestmentHorizon.MONTH_3,
        regime: Optional[MarketRegime] = None,
        sector: Optional[str] = None,
    ) -> FactorProfile:
        radar_data: Dict[str, float] = {}
        for gs in group_scores:
            radar_data[gs.group.value] = gs.score

        overall = _mean([gs.score for gs in group_scores]) if group_scores else 0.0

        sorted_groups = sorted(group_scores, key=lambda g: g.score, reverse=True)
        strengths = [
            f"{gs.group.value} ({gs.score:.1f})"
            for gs in sorted_groups[:3]
            if gs.score >= 60
        ]
        weaknesses = [
            f"{gs.group.value} ({gs.score:.1f})"
            for gs in sorted_groups[-3:]
            if gs.score < 40
        ]

        sorted_factors = sorted(factor_scores, key=lambda f: f.score, reverse=True)
        top_factors = [
            f"{fs.factor.value} ({fs.score:.1f})"
            for fs in sorted_factors[:5]
            if fs.score >= 70
        ]
        bottom_factors = [
            f"{fs.factor.value} ({fs.score:.1f})"
            for fs in sorted_factors[-5:]
            if fs.score < 30
        ]

        return FactorProfile(
            symbol=symbol,
            reference_date=reference_date,
            overall_score=overall,
            overall_strength=score_to_strength(overall),
            group_scores=group_scores,
            factor_scores=factor_scores,
            radar_data=radar_data,
            strengths=strengths,
            weaknesses=weaknesses,
            top_factors=top_factors,
            bottom_factors=bottom_factors,
            horizon=horizon,
            regime=regime,
            sector=sector,
        )
