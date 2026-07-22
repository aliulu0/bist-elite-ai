from __future__ import annotations

from typing import Dict, List, Optional, Any
import datetime

from modules.confidence_engine.core.types import (
    ConfidenceDimension,
    DimensionContribution,
    BonusFactor,
    BonusRule,
    BonusApplied,
    PenaltyFactor,
    PenaltyRule,
    PenaltyApplied,
    ConfidenceWarning,
    ConfidenceLabel,
    ConfidenceTrend,
    ConfidenceHistoryEntry,
    ConfidenceWeightConfig,
    normalize_score,
)
from modules.confidence_engine.calculators.dimension_calculators import ALL_CALCULATORS


def compute_dimension_contributions(
    data: Dict[str, Any],
    config: ConfidenceWeightConfig,
) -> Dict[ConfidenceDimension, DimensionContribution]:
    contributions: Dict[ConfidenceDimension, DimensionContribution] = {}
    for dim, dw in config.dimensions.items():
        calc_cls = ALL_CALCULATORS.get(dim)
        if calc_cls is None:
            continue
        calculator = calc_cls()
        contrib = calculator.calculate(data)
        weighted = contrib.normalized_score * dw.weight
        contributions[dim] = DimensionContribution(
            dimension=dim,
            raw_score=contrib.raw_score,
            normalized_score=contrib.normalized_score,
            weighted_score=weighted,
            contribution=weighted,
            weight=dw.weight,
            confidence=contrib.confidence,
            evidence_count=contrib.evidence_count,
            details=contrib.details,
        )
    return contributions


def compute_raw_score(
    contributions: Dict[ConfidenceDimension, DimensionContribution],
) -> float:
    total = sum(c.contribution for c in contributions.values())
    total_weight = sum(c.weight for c in contributions.values())
    if total_weight == 0:
        return 0.0
    return total / total_weight


def evaluate_bonuses(
    data: Dict[str, Any],
    dimension_scores: Dict[ConfidenceDimension, float],
    bonus_rules: List[BonusRule],
) -> List[BonusApplied]:
    applied: List[BonusApplied] = []
    for rule in bonus_rules:
        if _check_bonus_condition(rule, data, dimension_scores):
            applied.append(BonusApplied(
                factor=rule.factor,
                points=rule.points,
                condition=rule.condition or rule.factor.value,
            ))
    return applied


def evaluate_penalties(
    data: Dict[str, Any],
    dimension_scores: Dict[ConfidenceDimension, float],
    penalty_rules: List[PenaltyRule],
) -> List[PenaltyApplied]:
    applied: List[PenaltyApplied] = []
    for rule in penalty_rules:
        if _check_penalty_condition(rule, data, dimension_scores):
            applied.append(PenaltyApplied(
                factor=rule.factor,
                points=rule.points,
                condition=rule.condition or rule.factor.value,
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


def generate_warnings(
    data: Dict[str, Any],
    dimension_scores: Dict[ConfidenceDimension, float],
) -> List[ConfidenceWarning]:
    warnings: List[ConfidenceWarning] = []
    if dimension_scores.get(ConfidenceDimension.DATA, 50) < 40:
        warnings.append(ConfidenceWarning(
            dimension="data",
            message="Data quality is below acceptable threshold",
            severity="high",
        ))
    if dimension_scores.get(ConfidenceDimension.LIQUIDITY, 50) < 30:
        warnings.append(ConfidenceWarning(
            dimension="liquidity",
            message="Liquidity is critically low",
            severity="high",
        ))
    if dimension_scores.get(ConfidenceDimension.SIGNAL, 50) < 35:
        warnings.append(ConfidenceWarning(
            dimension="signal",
            message="Signal confirmation is weak across engines",
            severity="medium",
        ))
    if dimension_scores.get(ConfidenceDimension.EVIDENCE, 50) < 30:
        warnings.append(ConfidenceWarning(
            dimension="evidence",
            message="Insufficient evidence backing",
            severity="medium",
        ))
    if dimension_scores.get(ConfidenceDimension.MARKET, 50) < 30:
        warnings.append(ConfidenceWarning(
            dimension="market",
            message="Market conditions are unfavorable",
            severity="medium",
        ))
    vol = data.get("market_volatility", 0)
    if vol > 50:
        warnings.append(ConfidenceWarning(
            dimension="market",
            message="High market volatility detected",
            severity="low",
        ))
    return warnings


def _check_bonus_condition(
    rule: BonusRule,
    data: Dict[str, Any],
    dim_scores: Dict[ConfidenceDimension, float],
) -> bool:
    signal = dim_scores.get(ConfidenceDimension.SIGNAL, 50)
    similarity = data.get("similarity_score", 50)
    evidence = dim_scores.get(ConfidenceDimension.EVIDENCE, 50)
    smart_money = data.get("smart_money_confirmation", 50)
    historical = dim_scores.get(ConfidenceDimension.HISTORICAL, 50)

    if rule.factor == BonusFactor.STRONG_CONFIRMATION:
        return signal >= 75
    if rule.factor == BonusFactor.HIGH_SIMILARITY:
        return similarity >= 75
    if rule.factor == BonusFactor.EXCELLENT_EVIDENCE:
        return evidence >= 80
    if rule.factor == BonusFactor.INSTITUTIONAL_ACCUMULATION:
        return smart_money >= 75
    if rule.factor == BonusFactor.HISTORICAL_CONSISTENCY:
        return historical >= 75
    return False


def _check_penalty_condition(
    rule: PenaltyRule,
    data: Dict[str, Any],
    dim_scores: Dict[ConfidenceDimension, float],
) -> bool:
    data_score = dim_scores.get(ConfidenceDimension.DATA, 50)
    liquidity = dim_scores.get(ConfidenceDimension.LIQUIDITY, 50)
    signal = dim_scores.get(ConfidenceDimension.SIGNAL, 50)
    vol = data.get("market_volatility", 30)
    evidence = dim_scores.get(ConfidenceDimension.EVIDENCE, 50)
    historical = dim_scores.get(ConfidenceDimension.HISTORICAL, 50)

    if rule.factor == PenaltyFactor.WEAK_DATA:
        return data_score < 35
    if rule.factor == PenaltyFactor.LOW_LIQUIDITY:
        return liquidity < 30
    if rule.factor == PenaltyFactor.CONFLICTING_INDICATORS:
        return signal < 30
    if rule.factor == PenaltyFactor.HIGH_VOLATILITY:
        return vol > 60
    if rule.factor == PenaltyFactor.WEAK_EVIDENCE:
        return evidence < 30
    if rule.factor == PenaltyFactor.LOW_HISTORICAL_ACCURACY:
        return historical < 30
    return False


class ConfidenceCalculator:
    def __init__(self, config: ConfidenceWeightConfig) -> None:
        self._config = config

    @property
    def config(self) -> ConfidenceWeightConfig:
        return self._config

    def calculate(
        self,
        symbol: str,
        data: Dict[str, Any],
    ) -> Dict:
        contributions = compute_dimension_contributions(data, self._config)
        raw_score = compute_raw_score(contributions)
        dim_scores = {dim: c.normalized_score for dim, c in contributions.items()}
        bonuses = evaluate_bonuses(data, dim_scores, self._config.bonus_rules)
        penalties = evaluate_penalties(data, dim_scores, self._config.penalty_rules)
        final_score = apply_bonuses_penalties(raw_score, bonuses, penalties)
        warnings = generate_warnings(data, dim_scores)

        total_evidence = sum(c.evidence_count for c in contributions.values())
        avg_confidence = (
            sum(c.confidence for c in contributions.values()) / len(contributions)
            if contributions else 0.0
        )

        return {
            "symbol": symbol,
            "confidence_score": final_score,
            "raw_score": raw_score,
            "dimension_contributions": contributions,
            "bonuses": bonuses,
            "penalties": penalties,
            "warnings": warnings,
            "total_weight": self._config.total_weight,
            "evidence_count": total_evidence,
            "avg_confidence": avg_confidence,
        }


class ConfidenceTrendTracker:
    def __init__(self, max_history: int = 90) -> None:
        self._max_history = max_history
        self._history: Dict[str, List[ConfidenceHistoryEntry]] = {}

    def record(
        self,
        symbol: str,
        confidence_score: float,
        confidence_label: ConfidenceLabel,
    ) -> ConfidenceHistoryEntry:
        delta = 0.0
        trend = ConfidenceTrend.STABLE
        history = self._history.get(symbol, [])
        if history:
            prev = history[-1]
            delta = confidence_score - prev.confidence_score
            trend = self._compute_trend(
                [h.confidence_score for h in history[-5:]] + [confidence_score]
            )

        entry = ConfidenceHistoryEntry(
            symbol=symbol,
            confidence_score=confidence_score,
            confidence_label=confidence_label,
            calculated_at=datetime.datetime.utcnow(),
            delta=delta,
            trend=trend,
        )

        if symbol not in self._history:
            self._history[symbol] = []
        self._history[symbol].append(entry)

        if len(self._history[symbol]) > self._max_history:
            self._history[symbol] = self._history[symbol][-self._max_history:]

        return entry

    def get_history(
        self,
        symbol: str,
        limit: int = 30,
    ) -> List[ConfidenceHistoryEntry]:
        return self._history.get(symbol, [])[-limit:]

    def get_trend(self, symbol: str) -> Optional[ConfidenceTrend]:
        history = self._history.get(symbol, [])
        if len(history) < 2:
            return None
        scores = [h.confidence_score for h in history[-5:]]
        return self._compute_trend(scores)

    def clear(self) -> None:
        self._history.clear()

    def _compute_trend(self, scores: List[float]) -> ConfidenceTrend:
        if len(scores) < 2:
            return ConfidenceTrend.STABLE
        deltas = [scores[i + 1] - scores[i] for i in range(len(scores) - 1)]
        avg_delta = sum(deltas) / len(deltas)
        volatility = sum(abs(d - avg_delta) for d in deltas) / len(deltas)
        if volatility > 10:
            return ConfidenceTrend.VOLATILE
        if avg_delta > 2:
            return ConfidenceTrend.IMPROVING
        if avg_delta < -2:
            return ConfidenceTrend.DECLINING
        return ConfidenceTrend.STABLE
