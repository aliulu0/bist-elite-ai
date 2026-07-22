from __future__ import annotations

from typing import Dict, List, Tuple

from modules.decision_engine.core.types import (
    Conflict,
    ConflictSeverity,
    DecisionDimension,
    DimensionScore,
    EngineOutput,
    DataSource,
)


class ConflictDetector:
    """Detects conflicting signals across decision dimensions."""

    PAIR_RULES: List[Tuple[DecisionDimension, DecisionDimension, str, str]] = [
        (
            DecisionDimension.CONFIDENCE,
            DecisionDimension.TECHNICAL_TREND,
            "High confidence but weak technical trend",
            "Confidence scores suggest strength but technical indicators show weakness",
        ),
        (
            DecisionDimension.FINANCIAL_QUALITY,
            DecisionDimension.MOMENTUM,
            "Strong financials but weak momentum",
            "Fundamentals are solid but price momentum is negative",
        ),
        (
            DecisionDimension.PATTERN_QUALITY,
            DecisionDimension.SMART_MONEY,
            "Positive pattern but weak volume confirmation",
            "Chart patterns appear bullish but volume/smart money does not confirm",
        ),
        (
            DecisionDimension.TECHNICAL_TREND,
            DecisionDimension.MARKET_REGIME,
            "Bullish setup in bear market",
            "Individual stock setup is bullish but broader market regime is bearish",
        ),
        (
            DecisionDimension.VALUATION,
            DecisionDimension.GROWTH,
            "Cheap valuation but no growth",
            "Stock appears undervalued but growth metrics are weak",
        ),
    ]

    HIGH_THRESHOLD = 70.0
    LOW_THRESHOLD = 35.0
    GAP_THRESHOLD = 35.0

    def detect(
        self,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
    ) -> List[Conflict]:
        conflicts: List[Conflict] = []
        self._detect_pair_conflicts(dimension_scores, conflicts)
        self._detect_extreme_spread(dimension_scores, conflicts)
        return conflicts

    def _detect_pair_conflicts(
        self,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
        conflicts: List[Conflict],
    ) -> None:
        for dim_a, dim_b, desc, explanation in self.PAIR_RULES:
            score_a = dimension_scores.get(dim_a)
            score_b = dimension_scores.get(dim_b)
            if score_a is None or score_b is None:
                continue
            if score_a.normalized_score >= self.HIGH_THRESHOLD and score_b.normalized_score <= self.LOW_THRESHOLD:
                severity = ConflictSeverity.HIGH if abs(score_a.normalized_score - score_b.normalized_score) > 50 else ConflictSeverity.MEDIUM
                conflicts.append(Conflict(
                    dimension_a=dim_a,
                    dimension_b=dim_b,
                    severity=severity,
                    description=desc,
                    explanation=explanation,
                ))
            elif score_b.normalized_score >= self.HIGH_THRESHOLD and score_a.normalized_score <= self.LOW_THRESHOLD:
                severity = ConflictSeverity.HIGH if abs(score_b.normalized_score - score_a.normalized_score) > 50 else ConflictSeverity.MEDIUM
                conflicts.append(Conflict(
                    dimension_a=dim_b,
                    dimension_b=dim_a,
                    severity=severity,
                    description=desc,
                    explanation=explanation,
                ))

    def _detect_extreme_spread(
        self,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
        conflicts: List[Conflict],
    ) -> None:
        if len(dimension_scores) < 3:
            return
        scores = [ds.normalized_score for ds in dimension_scores.values()]
        spread = max(scores) - min(scores)
        if spread > 60:
            max_dim = max(dimension_scores.items(), key=lambda x: x[1].normalized_score)
            min_dim = min(dimension_scores.items(), key=lambda x: x[1].normalized_score)
            conflicts.append(Conflict(
                dimension_a=max_dim[0],
                dimension_b=min_dim[0],
                severity=ConflictSeverity.CRITICAL if spread > 75 else ConflictSeverity.HIGH,
                description=f"Extreme spread ({spread:.1f}) between {max_dim[0].value} and {min_dim[0].value}",
                explanation=f"Very divergent signals across dimensions (spread={spread:.1f})",
            ))

    def has_critical_conflicts(self, conflicts: List[Conflict]) -> bool:
        return any(c.severity == ConflictSeverity.CRITICAL for c in conflicts)

    def has_high_conflicts(self, conflicts: List[Conflict]) -> bool:
        return any(c.severity in (ConflictSeverity.HIGH, ConflictSeverity.CRITICAL) for c in conflicts)

    def severity_score(self, conflicts: List[Conflict]) -> float:
        if not conflicts:
            return 0.0
        severity_map = {
            ConflictSeverity.LOW: 5.0,
            ConflictSeverity.MEDIUM: 15.0,
            ConflictSeverity.HIGH: 30.0,
            ConflictSeverity.CRITICAL: 50.0,
        }
        total = sum(severity_map[c.severity] for c in conflicts)
        return min(100.0, total)
