from __future__ import annotations

from typing import Dict, List, Optional
import datetime

from modules.elite_score_engine.core.types import (
    ScoringDimension,
    DimensionWeight,
    DimensionContribution,
    BonusFactor,
    BonusRule,
    BonusApplied,
    PenaltyFactor,
    PenaltyRule,
    PenaltyApplied,
    EliteWeightConfig,
    ScoreDirection,
    EliteTrend,
    EliteScoreHistoryEntry,
    EliteCategory,
    EliteLabel,
)


def normalize_score(value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    if max_val == min_val:
        return 0.0
    return max(min_val, min(max_val, value))


def compute_dimension_contributions(
    dimension_scores: Dict[ScoringDimension, float],
    config: EliteWeightConfig,
) -> Dict[ScoringDimension, DimensionContribution]:
    contributions: Dict[ScoringDimension, DimensionContribution] = {}
    for dim, dw in config.dimensions.items():
        raw = dimension_scores.get(dim, 0.0)
        if dw.direction == ScoreDirection.LOWER_IS_BETTER:
            normalized = normalize_score(100.0 - raw)
        else:
            normalized = normalize_score(raw)
        weighted = normalized * dw.weight
        contributions[dim] = DimensionContribution(
            dimension=dim,
            raw_score=raw,
            normalized_score=normalized,
            weighted_score=weighted,
            contribution=weighted,
            direction=dw.direction,
            weight=dw.weight,
            confidence=1.0,
            evidence_count=1,
        )
    return contributions


def compute_raw_score(
    contributions: Dict[ScoringDimension, DimensionContribution],
) -> float:
    total = sum(c.contribution for c in contributions.values())
    total_weight = sum(c.weight for c in contributions.values())
    if total_weight == 0:
        return 0.0
    return total / total_weight


def evaluate_bonuses(
    scores: Dict[str, float],
    dimension_scores: Dict[ScoringDimension, float],
    bonus_rules: List[BonusRule],
) -> List[BonusApplied]:
    applied: List[BonusApplied] = []
    for rule in bonus_rules:
        if _check_bonus_condition(rule, scores, dimension_scores):
            applied.append(BonusApplied(
                factor=rule.factor,
                points=rule.points,
                condition=rule.condition or rule.factor.value,
                applied_count=1,
            ))
    return applied


def evaluate_penalties(
    scores: Dict[str, float],
    dimension_scores: Dict[ScoringDimension, float],
    penalty_rules: List[PenaltyRule],
) -> List[PenaltyApplied]:
    applied: List[PenaltyApplied] = []
    for rule in penalty_rules:
        if _check_penalty_condition(rule, scores, dimension_scores):
            applied.append(PenaltyApplied(
                factor=rule.factor,
                points=rule.points,
                condition=rule.condition or rule.factor.value,
                applied_count=1,
            ))
    return applied


def apply_bonuses_penalties(
    raw_score: float,
    bonuses: List[BonusApplied],
    penalties: List[PenaltyApplied],
) -> float:
    total = raw_score
    for b in bonuses:
        total += b.points * b.applied_count
    for p in penalties:
        total += p.points * p.applied_count
    return max(0.0, min(100.0, total))


def _check_bonus_condition(
    rule: BonusRule,
    scores: Dict[str, float],
    dimension_scores: Dict[ScoringDimension, float],
) -> bool:
    momentum = dimension_scores.get(ScoringDimension.MOMENTUM, 0.0)
    trend = dimension_scores.get(ScoringDimension.TREND_QUALITY, 0.0)
    volume = dimension_scores.get(ScoringDimension.VOLUME, 0.0)
    smart_money = dimension_scores.get(ScoringDimension.SMART_MONEY, 0.0)
    valuation = dimension_scores.get(ScoringDimension.VALUATION, 0.0)
    technical = dimension_scores.get(ScoringDimension.TECHNICAL_STRUCTURE, 0.0)
    sector = dimension_scores.get(ScoringDimension.SECTOR_STRENGTH, 0.0)
    growth = dimension_scores.get(ScoringDimension.GROWTH, 0.0)

    if rule.factor == BonusFactor.GOLDEN_CROSS:
        return trend >= 70.0 and momentum >= 60.0
    if rule.factor == BonusFactor.EARLY_BREAKOUT:
        return technical >= 65.0 and volume >= 60.0 and momentum >= 55.0
    if rule.factor == BonusFactor.STRONG_EARNINGS:
        return growth >= 70.0
    if rule.factor == BonusFactor.VOLUME_EXPLOSION:
        return volume >= 80.0
    if rule.factor == BonusFactor.INSTITUTIONAL_ACCUMULATION:
        return smart_money >= 70.0
    if rule.factor == BonusFactor.SMART_MONEY_CONFIRMATION:
        return smart_money >= 60.0
    if rule.factor == BonusFactor.POSITIVE_SECTOR_ROTATION:
        return sector >= 70.0
    if rule.factor == BonusFactor.LOW_VALUATION:
        return valuation >= 70.0
    return False


def _check_penalty_condition(
    rule: PenaltyRule,
    scores: Dict[str, float],
    dimension_scores: Dict[ScoringDimension, float],
) -> bool:
    liquidity = dimension_scores.get(ScoringDimension.LIQUIDITY, 0.0)
    financial = dimension_scores.get(ScoringDimension.FINANCIAL_QUALITY, 0.0)
    risk = dimension_scores.get(ScoringDimension.RISK, 0.0)
    trend = dimension_scores.get(ScoringDimension.TREND_QUALITY, 0.0)
    technical = dimension_scores.get(ScoringDimension.TECHNICAL_STRUCTURE, 0.0)
    growth = dimension_scores.get(ScoringDimension.GROWTH, 0.0)
    momentum = dimension_scores.get(ScoringDimension.MOMENTUM, 0.0)

    if rule.factor == PenaltyFactor.WEAK_LIQUIDITY:
        return liquidity < 30.0
    if rule.factor == PenaltyFactor.HIGH_DEBT:
        return financial < 30.0
    if rule.factor == PenaltyFactor.DISTRIBUTION:
        return trend < 30.0 and momentum < 40.0
    if rule.factor == PenaltyFactor.LATE_TREND:
        return trend > 80.0 and momentum < 40.0
    if rule.factor == PenaltyFactor.OVERBOUGHT:
        return technical > 85.0
    if rule.factor == PenaltyFactor.WEAK_EARNINGS:
        return growth < 25.0
    if rule.factor == PenaltyFactor.NEGATIVE_DIVERGENCE:
        return momentum > 70.0 and trend < 40.0
    if rule.factor == PenaltyFactor.CORPORATE_GOVERNANCE:
        return False
    return False


class EliteScoreCalculator:
    def __init__(self, config: EliteWeightConfig) -> None:
        self._config = config

    @property
    def config(self) -> EliteWeightConfig:
        return self._config

    def calculate(
        self,
        symbol: str,
        scores: Dict[str, float],
        dimension_scores: Dict[ScoringDimension, float],
        source_scores: Optional[Dict] = None,
        source_breakdowns: Optional[Dict] = None,
    ) -> Dict:
        contributions = compute_dimension_contributions(dimension_scores, self._config)
        raw_score = compute_raw_score(contributions)
        bonuses = evaluate_bonuses(scores, dimension_scores, self._config.bonus_rules)
        penalties = evaluate_penalties(scores, dimension_scores, self._config.penalty_rules)
        final_score = apply_bonuses_penalties(raw_score, bonuses, penalties)

        total_evidence = sum(c.evidence_count for c in contributions.values())
        avg_confidence = (
            sum(c.confidence for c in contributions.values()) / len(contributions)
            if contributions
            else 0.0
        )

        return {
            "symbol": symbol,
            "elite_score": final_score,
            "raw_score": raw_score,
            "dimension_contributions": contributions,
            "bonuses": bonuses,
            "penalties": penalties,
            "total_weight": self._config.total_weight,
            "confidence": avg_confidence,
            "evidence_count": total_evidence,
        }


class EliteScoreTrendTracker:
    def __init__(self, max_history: int = 90) -> None:
        self._max_history = max_history
        self._history: Dict[str, List[EliteScoreHistoryEntry]] = {}

    def record(
        self,
        symbol: str,
        elite_score: float,
        elite_category: EliteCategory,
        label: EliteLabel,
        horizon: InvestmentHorizon,
        ranking: Optional[int] = None,
    ) -> EliteScoreHistoryEntry:
        from modules.elite_score_engine.core.types import InvestmentHorizon
        delta = 0.0
        trend = EliteTrend.STABLE
        history_key = f"{symbol}:{horizon.value}"
        history = self._history.get(history_key, [])
        if history:
            prev = history[-1]
            delta = elite_score - prev.elite_score
            trend = self._compute_trend_from_deltas(
                [h.elite_score for h in history[-5:]] + [elite_score]
            )

        entry = EliteScoreHistoryEntry(
            symbol=symbol,
            elite_score=elite_score,
            elite_category=elite_category,
            label=label,
            ranking=ranking,
            horizon=horizon,
            calculated_at=datetime.datetime.utcnow(),
            delta=delta,
            trend=trend,
        )

        if history_key not in self._history:
            self._history[history_key] = []
        self._history[history_key].append(entry)

        if len(self._history[history_key]) > self._max_history:
            self._history[history_key] = self._history[history_key][-self._max_history:]

        return entry

    def get_history(
        self,
        symbol: str,
        horizon: InvestmentHorizon,
        limit: int = 30,
    ) -> List[EliteScoreHistoryEntry]:
        history_key = f"{symbol}:{horizon.value}"
        return self._history.get(history_key, [])[-limit:]

    def get_trend(
        self,
        symbol: str,
        horizon: InvestmentHorizon,
    ) -> Optional[EliteTrend]:
        history_key = f"{symbol}:{horizon.value}"
        history = self._history.get(history_key, [])
        if len(history) < 2:
            return None
        scores = [h.elite_score for h in history[-5:]]
        return self._compute_trend_from_deltas(scores)

    def clear(self) -> None:
        self._history.clear()

    def _compute_trend_from_deltas(self, scores: List[float]) -> EliteTrend:
        if len(scores) < 2:
            return EliteTrend.STABLE
        deltas = [scores[i + 1] - scores[i] for i in range(len(scores) - 1)]
        avg_delta = sum(deltas) / len(deltas)
        volatility = sum(abs(d - avg_delta) for d in deltas) / len(deltas)
        if volatility > 10:
            return EliteTrend.VOLATILE
        if avg_delta > 2:
            return EliteTrend.IMPROVING
        if avg_delta < -2:
            return EliteTrend.DECLINING
        return EliteTrend.STABLE
