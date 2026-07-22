from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from modules.decision_engine.core.types import (
    Conflict,
    ConflictSeverity,
    DecisionBonus,
    DecisionDimension,
    DecisionPenalty,
    DimensionScore,
    EngineOutput,
    DataSource,
)


@dataclass
class RuleResult:
    bonuses: List[DecisionBonus] = field(default_factory=list)
    penalties: List[DecisionPenalty] = field(default_factory=list)
    adjustment: float = 0.0


BONUS_RULES: List[str] = [
    "strong_across_dimensions",
    "high_confidence_alignment",
    "smart_money_confirmation",
    "pattern_volume_alignment",
    "sector_strength_alignment",
    "low_risk_high_reward",
    "market_regime_alignment",
    "early_opportunity_detected",
]

PENALTY_RULES: List[str] = [
    "critical_conflict",
    "high_conflict",
    "low_confidence_mismatch",
    "weak_volume_confirmation",
    "adverse_market_regime",
    "high_risk_low_reward",
    "poor_liquidity",
    "low_historical_similarity",
]


class DecisionRuleEngine:
    """Applies bonus and penalty rules to dimension scores."""

    BONUS_THRESHOLD = 70.0
    PENALTY_THRESHOLD = 35.0
    STRONG_THRESHOLD = 80.0
    WEAK_THRESHOLD = 30.0

    def evaluate(
        self,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
        engine_outputs: Dict[DataSource, EngineOutput],
        conflicts: List[Conflict],
    ) -> RuleResult:
        result = RuleResult()
        self._evaluate_bonuses(dimension_scores, engine_outputs, conflicts, result)
        self._evaluate_penalties(dimension_scores, engine_outputs, conflicts, result)
        result.adjustment = sum(b.value for b in result.bonuses) - sum(p.value for p in result.penalties)
        return result

    def _evaluate_bonuses(
        self,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
        engine_outputs: Dict[DataSource, EngineOutput],
        conflicts: List[Conflict],
        result: RuleResult,
    ) -> None:
        strong_dims = [
            ds for ds in dimension_scores.values()
            if ds.normalized_score >= self.STRONG_THRESHOLD
        ]
        if len(strong_dims) >= 4:
            result.bonuses.append(DecisionBonus(
                factor="strong_across_dimensions",
                value=5.0,
                description=f"{len(strong_dims)} dimensions above {self.STRONG_THRESHOLD}",
            ))

        high_conf_dims = [
            ds for ds in dimension_scores.values()
            if ds.confidence >= self.BONUS_THRESHOLD
        ]
        if len(high_conf_dims) >= 5:
            result.bonuses.append(DecisionBonus(
                factor="high_confidence_alignment",
                value=4.0,
                description=f"{len(high_conf_dims)} dimensions with high confidence",
            ))

        smart_money = dimension_scores.get(DecisionDimension.SMART_MONEY)
        if smart_money and smart_money.normalized_score >= self.BONUS_THRESHOLD:
            result.bonuses.append(DecisionBonus(
                factor="smart_money_confirmation",
                value=3.0,
                description="Smart money flow confirms direction",
            ))

        pattern = dimension_scores.get(DecisionDimension.PATTERN_QUALITY)
        momentum = dimension_scores.get(DecisionDimension.MOMENTUM)
        if (pattern and momentum and
                pattern.normalized_score >= self.BONUS_THRESHOLD and
                momentum.normalized_score >= self.BONUS_THRESHOLD):
            result.bonuses.append(DecisionBonus(
                factor="pattern_volume_alignment",
                value=3.0,
                description="Pattern and momentum are aligned",
            ))

        sector = dimension_scores.get(DecisionDimension.SECTOR_STRENGTH)
        if sector and sector.normalized_score >= self.BONUS_THRESHOLD:
            result.bonuses.append(DecisionBonus(
                factor="sector_strength_alignment",
                value=2.0,
                description="Sector shows relative strength",
            ))

        risk = dimension_scores.get(DecisionDimension.RISK)
        if risk and risk.normalized_score >= self.BONUS_THRESHOLD:
            result.bonuses.append(DecisionBonus(
                factor="low_risk_high_reward",
                value=3.0,
                description="Risk/reward profile is favorable",
            ))

        market = dimension_scores.get(DecisionDimension.MARKET_REGIME)
        if market and market.normalized_score >= self.BONUS_THRESHOLD:
            result.bonuses.append(DecisionBonus(
                factor="market_regime_alignment",
                value=2.0,
                description="Market regime supports the decision",
            ))

        early = engine_outputs.get(DataSource.EARLY_OPPORTUNITY)
        if early and early.score >= self.BONUS_THRESHOLD:
            result.bonuses.append(DecisionBonus(
                factor="early_opportunity_detected",
                value=4.0,
                description="Early opportunity engine detected setup",
            ))

    def _evaluate_penalties(
        self,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
        engine_outputs: Dict[DataSource, EngineOutput],
        conflicts: List[Conflict],
        result: RuleResult,
    ) -> None:
        critical = [c for c in conflicts if c.severity == ConflictSeverity.CRITICAL]
        if critical:
            result.penalties.append(DecisionPenalty(
                factor="critical_conflict",
                value=10.0,
                description=f"{len(critical)} critical conflict(s) detected",
            ))

        high = [c for c in conflicts if c.severity == ConflictSeverity.HIGH]
        if high:
            result.penalties.append(DecisionPenalty(
                factor="high_conflict",
                value=5.0,
                description=f"{len(high)} high-severity conflict(s) detected",
            ))

        confidence_dim = dimension_scores.get(DecisionDimension.CONFIDENCE)
        overall = sum(ds.normalized_score for ds in dimension_scores.values()) / max(len(dimension_scores), 1)
        if confidence_dim and confidence_dim.normalized_score < self.PENALTY_THRESHOLD and overall >= self.BONUS_THRESHOLD:
            result.penalties.append(DecisionPenalty(
                factor="low_confidence_mismatch",
                value=5.0,
                description="Overall score is high but confidence is low",
            ))

        smart_money = dimension_scores.get(DecisionDimension.SMART_MONEY)
        if smart_money and smart_money.normalized_score < self.PENALTY_THRESHOLD:
            result.penalties.append(DecisionPenalty(
                factor="weak_volume_confirmation",
                value=3.0,
                description="Smart money does not confirm direction",
            ))

        market = dimension_scores.get(DecisionDimension.MARKET_REGIME)
        if market and market.normalized_score < self.PENALTY_THRESHOLD:
            result.penalties.append(DecisionPenalty(
                factor="adverse_market_regime",
                value=4.0,
                description="Market regime is adverse",
            ))

        risk = dimension_scores.get(DecisionDimension.RISK)
        if risk and risk.normalized_score < self.PENALTY_THRESHOLD:
            result.penalties.append(DecisionPenalty(
                factor="high_risk_low_reward",
                value=3.0,
                description="Risk/reward profile is unfavorable",
            ))

        liquidity = dimension_scores.get(DecisionDimension.LIQUIDITY)
        if liquidity and liquidity.normalized_score < self.PENALTY_THRESHOLD:
            result.penalties.append(DecisionPenalty(
                factor="poor_liquidity",
                value=3.0,
                description="Liquidity is insufficient",
            ))

        similarity = dimension_scores.get(DecisionDimension.HISTORICAL_SIMILARITY)
        if similarity and similarity.normalized_score < self.PENALTY_THRESHOLD:
            result.penalties.append(DecisionPenalty(
                factor="low_historical_similarity",
                value=2.0,
                description="Low historical pattern similarity",
            ))

    def net_adjustment(self, result: RuleResult) -> float:
        return result.adjustment
