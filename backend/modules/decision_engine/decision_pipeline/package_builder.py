from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from modules.decision_engine.core.types import (
    Conflict,
    DecisionBonus,
    DecisionDimension,
    DecisionPenalty,
    DecisionType,
    DecisionUrgency,
    DimensionScore,
    EngineOutput,
    ExitGuidance,
    HorizonRecommendation,
    PortfolioImpact,
    RecommendationPackage,
    classify_decision,
    classify_stability,
    classify_urgency,
)


class PackageBuilder:
    """Assembles the final RecommendationPackage from all pipeline outputs."""

    def build(
        self,
        symbol: str,
        decision_score: float,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
        conflicts: List[Conflict],
        bonuses: List[DecisionBonus],
        penalties: List[DecisionPenalty],
        decision_confidence: float,
        engine_outputs: Dict[EngineOutput],
        horizon_recommendations: List[HorizonRecommendation],
        portfolio_impact: PortfolioImpact,
        entry_guidance: Any,
        exit_guidance: ExitGuidance,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> RecommendationPackage:
        decision = classify_decision(decision_score)
        urgency_score = self._urgency_from_dimensions(dimension_scores)
        urgency = classify_urgency(decision_score, urgency_score)
        stability = classify_stability(dimension_scores)

        strengths = self._extract_strengths(dimension_scores, bonuses)
        weaknesses = self._extract_weaknesses(dimension_scores, penalties, conflicts)
        evidence = self._extract_evidence(engine_outputs)
        warnings = self._generate_warnings(conflicts, penalties)
        risk_factors = self._extract_risk_factors(dimension_scores, conflicts)
        summary = self._build_summary(symbol, decision, decision_score, decision_confidence)

        source_map: Dict[EngineOutput, Any] = {}
        for eo in engine_outputs.values():
            source_map[eo.source] = eo

        holding = self._suggest_holding_period(decision, dimension_scores)

        return RecommendationPackage(
            symbol=symbol,
            decision=decision,
            decision_score=decision_score,
            decision_confidence=decision_confidence,
            decision_risk=100.0 - decision_score,
            decision_urgency=urgency,
            decision_stability=stability,
            summary=summary,
            strengths=strengths,
            weaknesses=weaknesses,
            evidence=evidence,
            warnings=warnings,
            risk_factors=risk_factors,
            holding_period=holding,
            entry=entry_guidance,
            exit=exit_guidance,
            portfolio_impact=portfolio_impact,
            horizon_recommendations=horizon_recommendations,
            dimension_scores=dimension_scores,
            conflicts=conflicts,
            bonuses=bonuses,
            penalties=penalties,
            engine_outputs=source_map,
            metadata=metadata or {},
        )

    def _urgency_from_dimensions(self, dimension_scores: Dict[DecisionDimension, DimensionScore]) -> float:
        momentum = dimension_scores.get(DecisionDimension.MOMENTUM)
        return momentum.normalized_score if momentum else 50.0

    def _extract_strengths(
        self,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
        bonuses: List[DecisionBonus],
    ) -> List[str]:
        strengths: List[str] = []
        for dim, ds in dimension_scores.items():
            if ds.normalized_score >= 75:
                strengths.append(f"{dim.value.replace('_', ' ').title()}: {ds.normalized_score:.1f}/100")
        for b in bonuses:
            strengths.append(f"Bonus: {b.description}")
        return strengths

    def _extract_weaknesses(
        self,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
        penalties: List[DecisionPenalty],
        conflicts: List[Conflict],
    ) -> List[str]:
        weaknesses: List[str] = []
        for dim, ds in dimension_scores.items():
            if ds.normalized_score <= 35:
                weaknesses.append(f"{dim.value.replace('_', ' ').title()}: {ds.normalized_score:.1f}/100")
        for p in penalties:
            weaknesses.append(f"Penalty: {p.description}")
        for c in conflicts:
            weaknesses.append(f"Conflict: {c.description}")
        return weaknesses

    def _extract_evidence(self, engine_outputs: Dict[EngineOutput]) -> List[str]:
        evidence: List[str] = []
        for source, output in engine_outputs.items():
            if output.score >= 60:
                evidence.append(f"{source.value}: score={output.score:.1f}, confidence={output.confidence:.1f}")
        return evidence

    def _generate_warnings(
        self,
        conflicts: List[Conflict],
        penalties: List[DecisionPenalty],
    ) -> List[str]:
        warnings: List[str] = []
        for c in conflicts:
            warnings.append(f"[{c.severity.value.upper()}] {c.description}")
        for p in penalties:
            warnings.append(f"Penalty: {p.description}")
        return warnings

    def _extract_risk_factors(
        self,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
        conflicts: List[Conflict],
    ) -> List[str]:
        factors: List[str] = []
        risk_dim = dimension_scores.get(DecisionDimension.RISK)
        if risk_dim and risk_dim.normalized_score <= 40:
            factors.append("High risk profile")
        liquidity = dimension_scores.get(DecisionDimension.LIQUIDITY)
        if liquidity and liquidity.normalized_score <= 35:
            factors.append("Low liquidity may affect execution")
        market = dimension_scores.get(DecisionDimension.MARKET_REGIME)
        if market and market.normalized_score <= 30:
            factors.append("Adverse market regime")
        critical = [c for c in conflicts if c.severity.value in ("high", "critical")]
        if critical:
            factors.append(f"{len(critical)} high-severity conflict(s) detected")
        return factors

    def _build_summary(
        self,
        symbol: str,
        decision: DecisionType,
        score: float,
        confidence: float,
    ) -> str:
        label = decision.value.replace("_", " ").title()
        return f"{symbol}: {label} (score={score:.1f}, confidence={confidence:.1f})"

    def _suggest_holding_period(
        self,
        decision: DecisionType,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
    ) -> str:
        if decision in (DecisionType.STRONG_BUY, DecisionType.BUY):
            return "3-6 months"
        elif decision in (DecisionType.EARLY_ACCUMULATION, DecisionType.ACCUMULATE):
            return "1-3 months"
        elif decision in (DecisionType.WATCH, DecisionType.WAIT_CONFIRMATION):
            return "2-4 weeks"
        elif decision in (DecisionType.REDUCE, DecisionType.TAKE_PROFIT):
            return "Immediate review"
        else:
            return "No position"
