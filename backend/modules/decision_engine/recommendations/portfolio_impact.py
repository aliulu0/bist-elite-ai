from __future__ import annotations

from typing import Any, Dict, List

from modules.decision_engine.core.types import (
    DecisionDimension,
    DimensionScore,
    PortfolioImpact,
)


class PortfolioImpactAnalyzer:
    """Estimates portfolio impact of a decision."""

    DEFAULT_MAX_POSITION = 10.0
    MAX_SECTOR_CONCENTRATION = 25.0

    def analyze(
        self,
        symbol: str,
        decision_score: float,
        dimension_scores: Dict[DecisionDecisionDimension: DimensionScore],
        existing_positions: Dict[str, Dict[str, Any]] = None,
        sector: str = "",
    ) -> PortfolioImpact:
        if existing_positions is None:
            existing_positions = {}

        position_size = self._suggest_position_size(decision_score, dimension_scores)
        sector_conc = self._compute_sector_concentration(sector, existing_positions)
        risk_contrib = self._compute_risk_contribution(dimension_scores)
        diversification = self._compute_diversification_effect(symbol, existing_positions)
        overlap = self._find_overlapping_positions(symbol, dimension_scores, existing_positions)

        return PortfolioImpact(
            diversification_effect=diversification,
            sector_concentration=sector_conc,
            risk_contribution=risk_contrib,
            position_size_suggestion=position_size,
            existing_overlap=overlap,
        )

    def _suggest_position_size(
        self,
        decision_score: float,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
    ) -> float:
        base = self.DEFAULT_MAX_POSITION
        score_factor = decision_score / 100.0
        risk_dim = dimension_scores.get(DecisionDimension.RISK)
        risk_factor = 1.0
        if risk_dim:
            risk_factor = risk_dim.normalized_score / 100.0

        liquidity_dim = dimension_scores.get(DecisionDimension.LIQUIDITY)
        liquidity_factor = 1.0
        if liquidity_dim:
            liquidity_factor = min(1.0, liquidity_dim.normalized_score / 80.0)

        size = base * score_factor * risk_factor * liquidity_factor
        return round(min(self.DEFAULT_MAX_POSITION, max(0.0, size)), 2)

    def _compute_sector_concentration(
        self,
        sector: str,
        existing_positions: Dict[str, Dict[str, Any]],
    ) -> float:
        if not sector:
            return 0.0
        sector_total = sum(
            pos.get("weight", 0.0)
            for pos in existing_positions.values()
            if pos.get("sector") == sector
        )
        return round(min(self.MAX_SECTOR_CONCENTRATION, sector_total), 2)

    def _compute_risk_contribution(
        self,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
    ) -> float:
        risk_dim = dimension_scores.get(DecisionDimension.RISK)
        if not risk_dim:
            return 50.0
        return round(100.0 - risk_dim.normalized_score, 2)

    def _compute_diversification_effect(
        self,
        symbol: str,
        existing_positions: Dict[str, Dict[str, Any]],
    ) -> float:
        if not existing_positions:
            return 80.0
        n_positions = len(existing_positions)
        if n_positions == 0:
            return 80.0
        if symbol in existing_positions:
            return 20.0
        base = min(80.0, 40.0 + n_positions * 2.0)
        return round(base, 2)

    def _find_overlapping_positions(
        self,
        symbol: str,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
        existing_positions: Dict[str, Dict[str, Any]],
    ) -> List[str]:
        overlap: List[str] = []
        for pos_sym, pos_data in existing_positions.items():
            if pos_sym == symbol:
                continue
            pos_score = pos_data.get("decision_score", 50.0)
            own_score = sum(ds.normalized_score for ds in dimension_scores.values()) / max(len(dimension_scores), 1)
            if abs(pos_score - own_score) < 15.0:
                overlap.append(pos_sym)
        return overlap
