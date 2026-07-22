from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.decision_engine.core.types import (
    DecisionDimension,
    DecisionResult,
    DimensionScore,
    EngineOutput,
    RecommendationPackage,
    classify_decision,
)
from modules.decision_engine.decision_pipeline.collector import EngineOutputCollector
from modules.decision_engine.decision_pipeline.validator import OutputValidator, ValidationResult
from modules.decision_engine.decision_pipeline.conflict_detector import ConflictDetector
from modules.decision_engine.decision_pipeline.rule_engine import DecisionRuleEngine
from modules.decision_engine.decision_pipeline.confidence_calculator import DecisionConfidenceCalculator
from modules.decision_engine.recommendations.generator import RecommendationGenerator
from modules.decision_engine.recommendations.portfolio_impact import PortfolioImpactAnalyzer
from modules.decision_engine.decision_pipeline.package_builder import PackageBuilder


class DecisionPipeline:
    """Orchestrates the full decision pipeline from engine outputs to final recommendation."""

    def __init__(self) -> None:
        self.collector = EngineOutputCollector()
        self.validator = OutputValidator()
        self.conflict_detector = ConflictDetector()
        self.rule_engine = DecisionRuleEngine()
        self.confidence_calculator = DecisionConfidenceCalculator()
        self.recommendation_generator = RecommendationGenerator()
        self.portfolio_analyzer = PortfolioImpactAnalyzer()
        self.package_builder = PackageBuilder()

    def execute(
        self,
        symbol: str,
        engine_data: Dict[str, Any],
        existing_positions: Optional[Dict[str, Dict[str, Any]]] = None,
        sector: str = "",
    ) -> DecisionResult:
        outputs = self.collector.collect(engine_data)
        validation = self.validator.validate(outputs)

        dimension_scores = self._compute_dimension_scores(outputs)
        conflicts = self.conflict_detector.detect(dimension_scores)
        rule_result = self.rule_engine.evaluate(dimension_scores, outputs, conflicts)
        decision_confidence = self.confidence_calculator.calculate(dimension_scores, conflicts)

        base_score = self._compute_base_score(dimension_scores, outputs)
        final_score = max(0.0, min(100.0, base_score + rule_result.adjustment))

        entry = self.recommendation_generator.generate_entry(
            classify_decision(final_score),
            final_score,
            self._get_risk_score(dimension_scores),
            self._get_momentum_score(dimension_scores),
        )
        exit_g = self.recommendation_generator.generate_exit(
            classify_decision(final_score),
            final_score,
            self._get_risk_score(dimension_scores),
        )
        horizon_recs = self.recommendation_generator.generate_horizon_recommendations(
            symbol, final_score, dimension_scores,
            self._get_risk_score(dimension_scores),
            self._get_momentum_score(dimension_scores),
        )
        portfolio_impact = self.portfolio_analyzer.analyze(
            symbol, final_score, dimension_scores, existing_positions or {}, sector
        )

        from datetime import datetime, timezone
        timestamp = datetime.now(timezone.utc).isoformat()

        recommendation = self.package_builder.build(
            symbol=symbol,
            decision_score=final_score,
            dimension_scores=dimension_scores,
            conflicts=conflicts,
            bonuses=rule_result.bonuses,
            penalties=rule_result.penalties,
            decision_confidence=decision_confidence,
            engine_outputs=outputs,
            horizon_recommendations=horizon_recs,
            portfolio_impact=portfolio_impact,
            entry_guidance=entry,
            exit_guidance=exit_g,
            metadata={"validation": validation.__dict__ if validation else {}},
        )

        return DecisionResult(
            symbol=symbol,
            recommendation=recommendation,
            decision_score=final_score,
            decision_label=classify_decision(final_score),
            decision_confidence=decision_confidence,
            decision_risk=100.0 - final_score,
            decision_urgency=recommendation.decision_urgency,
            generated_at=timestamp,
        )

    def _compute_dimension_scores(
        self,
        outputs: Dict[EngineOutput],
    ) -> Dict[DecisionDimension, DimensionScore]:
        mapping = {
            DecisionDimension.FINANCIAL_QUALITY: ("financial", "unified_scoring"),
            DecisionDimension.VALUATION: ("financial", "unified_scoring"),
            DecisionDimension.GROWTH: ("financial", "elite_score"),
            DecisionDimension.TECHNICAL_TREND: ("trend", "elite_score"),
            DecisionDimension.MOMENTUM: ("momentum", "elite_score"),
            DecisionDimension.SMART_MONEY: ("volume", "elite_score"),
            DecisionDimension.PATTERN_QUALITY: ("pattern", "elite_score"),
            DecisionDimension.RISK: ("risk", "confidence"),
            DecisionDimension.SECTOR_STRENGTH: ("sector", "confidence"),
            DecisionDimension.MARKET_REGIME: ("market", "confidence"),
            DecisionDimension.LIQUIDITY: ("liquidity", "confidence"),
            DecisionDimension.CONFIDENCE: ("confidence", "confidence"),
            DecisionDimension.HISTORICAL_SIMILARITY: ("similarity", "confidence"),
        }

        dimension_scores: Dict[DecisionDimension, DimensionScore] = {}
        for dim, (signal_key, primary_source) in mapping.items():
            score, conf = self._extract_score_confidence(outputs, signal_key, primary_source)
            weight = 1.0 / len(DecisionDimension)
            dimension_scores[dim] = DimensionScore(
                dimension=dim,
                raw_score=score,
                normalized_score=score,
                weight=weight,
                contribution=score * weight,
                confidence=conf,
                evidence=[],
            )
        return dimension_scores

    def _extract_score_confidence(
        self,
        outputs: Dict[EngineOutput],
        signal_key: str,
        primary_source: str,
    ) -> tuple:
        for source, output in outputs.items():
            if source.value == primary_source:
                signal_val = output.signals.get(signal_key)
                if isinstance(signal_val, (int, float)):
                    return float(signal_val), output.confidence
                return output.score, output.confidence
        for source, output in outputs.items():
            signal_val = output.signals.get(signal_key)
            if isinstance(signal_val, (int, float)):
                return float(signal_val), output.confidence
        return 50.0, 30.0

    def _compute_base_score(
        self,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
        outputs: Dict[EngineOutput],
    ) -> float:
        if not dimension_scores:
            return 0.0
        weighted_sum = sum(ds.contribution for ds in dimension_scores.values())
        total_weight = sum(ds.weight for ds in dimension_scores.values())
        if total_weight == 0:
            return 0.0
        return weighted_sum / total_weight

    def _get_risk_score(self, dimension_scores: Dict[DecisionDimension, DimensionScore]) -> float:
        risk = dimension_scores.get(DecisionDimension.RISK)
        return risk.normalized_score if risk else 50.0

    def _get_momentum_score(self, dimension_scores: Dict[DecisionDimension, DimensionScore]) -> float:
        momentum = dimension_scores.get(DecisionDimension.MOMENTUM)
        return momentum.normalized_score if momentum else 50.0
