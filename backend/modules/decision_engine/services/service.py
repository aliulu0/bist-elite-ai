from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from modules.decision_engine.cache.cache import DecisionCache
from modules.decision_engine.core.types import (
    DecisionResult,
    DecisionType,
    DecisionUrgency,
    EngineOutput,
    classify_decision,
)
from modules.decision_engine.decision_pipeline.pipeline import DecisionPipeline
from modules.decision_engine.decision_profiles.manager import ProfileManager
from modules.decision_engine.decision_profiles.profiles import get_profile_weights
from modules.decision_engine.benchmark.benchmark import DecisionBenchmark
from modules.decision_engine.validators.validator import DecisionValidator
from modules.decision_engine.schemas.schemas import (
    BenchmarkResponse,
    CacheStatsResponse,
    DecisionGenerateRequest,
    DecisionHistoryItem,
    DecisionHistoryResponse,
    DecisionListItem,
    DecisionListResponse,
    DecisionTopResponse,
    HealthResponse,
    RecommendationResponse,
    ReportResponse,
    EngineDataSchema,
    EntryGuidanceSchema,
    ExitGuidanceSchema,
    PortfolioImpactSchema,
    HorizonRecommendationSchema,
    DimensionScoreSchema,
    ConflictSchema,
    BonusPenaltySchema,
)


class DecisionService:
    """Orchestrates all decision engine operations."""

    def __init__(self) -> None:
        self.pipeline = DecisionPipeline()
        self.cache = DecisionCache()
        self.profiles = ProfileManager()
        self.validator = DecisionValidator()
        self.benchmark = DecisionBenchmark()
        self._history: Dict[str, List[Dict[str, Any]]] = {}
        self._all_results: List[DecisionResult] = []

    def generate_decision(
        self,
        request: DecisionGenerateRequest,
    ) -> DecisionResult:
        cache_key = self._cache_key(request.symbol, request.engine_data)
        cached = self.cache.get(cache_key)
        if cached is not None:
            if not any(r.symbol == request.symbol for r in self._all_results):
                self._all_results.append(cached)
                self._history.setdefault(request.symbol, []).append({
                    "decision": cached.decision_label.value,
                    "score": cached.decision_score,
                    "confidence": cached.decision_confidence,
                    "generated_at": cached.generated_at,
                })
            return cached

        engine_data = {k: v.model_dump() for k, v in request.engine_data.items()}
        result = self.pipeline.execute(
            symbol=request.symbol,
            engine_data=engine_data,
            existing_positions=request.existing_positions,
            sector=request.sector,
        )

        self.cache.set(cache_key, result)
        self._history.setdefault(request.symbol, []).append({
            "decision": result.decision_label.value,
            "score": result.decision_score,
            "confidence": result.decision_confidence,
            "generated_at": result.generated_at,
        })
        self._all_results.append(result)
        return result

    def get_decision(self, symbol: str) -> Optional[DecisionResult]:
        for r in reversed(self._all_results):
            if r.symbol == symbol:
                return r
        return None

    def list_decisions(self) -> List[DecisionResult]:
        return list(self._all_results)

    def get_top_decisions(self, count: int = 10) -> List[DecisionResult]:
        sorted_results = sorted(
            self._all_results,
            key=lambda r: r.decision_score,
            reverse=True,
        )
        return sorted_results[:count]

    def get_history(self, symbol: str) -> List[Dict[str, Any]]:
        return self._history.get(symbol, [])

    def generate_report(
        self,
        symbol: str,
        report_type: str = "executive",
    ) -> Dict[str, Any]:
        result = self.get_decision(symbol)
        if not result:
            return {"error": f"No decision found for {symbol}"}

        rec = result.recommendation
        sections: Dict[str, str] = {}

        if report_type in ("executive", "all"):
            sections["executive"] = (
                f"Decision for {symbol}: {result.decision_label.value.replace('_', ' ').title()} "
                f"(score={result.decision_score:.1f}, confidence={result.decision_confidence:.1f})"
            )

        if report_type in ("detailed", "all"):
            lines = [f"Detailed Report for {symbol}", ""]
            for dim, ds in rec.dimension_scores.items():
                lines.append(f"  {dim.value}: {ds.normalized_score:.1f} (conf={ds.confidence:.1f})")
            sections["detailed"] = "\n".join(lines)

        if report_type in ("evidence", "all"):
            sections["evidence"] = "\n".join(f"- {e}" for e in rec.evidence) or "No evidence"

        if report_type in ("risk_analysis", "all"):
            sections["risk_analysis"] = "\n".join(f"- {r}" for r in rec.risk_factors) or "No risk factors"

        if report_type in ("timeline", "all"):
            lines = [f"Timeline for {symbol}:"]
            for hr in rec.horizon_recommendations:
                lines.append(f"  {hr.horizon.value}: {hr.decision.value} (score={hr.score:.1f})")
            sections["timeline"] = "\n".join(lines)

        content = "\n\n".join(sections.values())
        return {
            "symbol": symbol,
            "report_type": report_type,
            "content": content,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "sections": sections,
        }

    def clear_cache(self) -> int:
        return self.cache.clear()

    def cache_stats(self) -> Dict[str, Any]:
        return self.cache.stats()

    def run_benchmark(self, iterations: int = 50) -> BenchmarkResponse:
        from modules.decision_engine.core.types import EngineOutput, DataSource

        sample_data = {
            "unified_scoring": {
                "score": 72.0,
                "confidence": 80.0,
                "signals": {"financial": 75.0},
            },
            "elite_score": {
                "score": 68.0,
                "confidence": 75.0,
                "signals": {"trend": 70.0, "momentum": 65.0},
            },
            "confidence": {
                "score": 65.0,
                "confidence": 70.0,
                "signals": {"risk": 60.0, "sector": 72.0, "market": 68.0},
            },
        }

        result = self.benchmark.run(
            "decision_generation",
            lambda: self.pipeline.execute("TUPRS", sample_data),
            iterations=iterations,
            warmup=5,
        )

        return BenchmarkResponse(
            operation=result.operation,
            iterations=result.iterations,
            avg_time_ms=result.avg_time_ms,
            min_time_ms=result.min_time_ms,
            max_time_ms=result.max_time_ms,
            success=result.success,
        )

    def health_check(self) -> HealthResponse:
        return HealthResponse(
            status="healthy",
            version="1.0.0",
            engines_available=12,
            cache_stats=CacheStatsResponse(**self.cache.stats()),
        )

    def result_to_response(self, result: DecisionResult) -> RecommendationResponse:
        rec = result.recommendation
        return RecommendationResponse(
            symbol=rec.symbol,
            decision=rec.decision.value,
            decision_score=rec.decision_score,
            decision_confidence=rec.decision_confidence,
            decision_risk=rec.decision_risk,
            decision_urgency=rec.decision_urgency.value,
            decision_stability=rec.decision_stability,
            summary=rec.summary,
            strengths=rec.strengths,
            weaknesses=rec.weaknesses,
            evidence=rec.evidence,
            warnings=rec.warnings,
            risk_factors=rec.risk_factors,
            holding_period=rec.holding_period,
            entry=EntryGuidanceSchema(
                timing=rec.entry.timing.value,
                suggested_entry_price=rec.entry.suggested_entry_price,
                scale_in_levels=rec.entry.scale_in_levels,
                max_position_pct=rec.entry.max_position_pct,
                rationale=rec.entry.rationale,
            ),
            exit=ExitGuidanceSchema(
                action=rec.exit.action.value,
                initial_target=rec.exit.initial_target,
                secondary_target=rec.exit.secondary_target,
                risk_stop=rec.exit.risk_stop,
                trailing_stop_pct=rec.exit.trailing_stop_pct,
                review_days=rec.exit.review_days,
                rationale=rec.exit.rationale,
            ),
            portfolio_impact=PortfolioImpactSchema(
                diversification_effect=rec.portfolio_impact.diversification_effect,
                sector_concentration=rec.portfolio_impact.sector_concentration,
                risk_contribution=rec.portfolio_impact.risk_contribution,
                position_size_suggestion=rec.portfolio_impact.position_size_suggestion,
                existing_overlap=rec.portfolio_impact.existing_overlap,
            ),
            horizon_recommendations=[
                HorizonRecommendationSchema(
                    horizon=hr.horizon.value,
                    decision=hr.decision.value,
                    score=hr.score,
                    confidence=hr.confidence,
                    entry=EntryGuidanceSchema(
                        timing=hr.entry.timing.value,
                        max_position_pct=hr.entry.max_position_pct,
                        rationale=hr.entry.rationale,
                    ),
                    exit=ExitGuidanceSchema(
                        action=hr.exit.action.value,
                        initial_target=hr.exit.initial_target,
                        risk_stop=hr.exit.risk_stop,
                        review_days=hr.exit.review_days,
                        rationale=hr.exit.rationale,
                    ),
                    summary=hr.summary,
                )
                for hr in rec.horizon_recommendations
            ],
            dimension_scores={
                dim.value: DimensionScoreSchema(
                    dimension=ds.dimension.value,
                    raw_score=ds.raw_score,
                    normalized_score=ds.normalized_score,
                    weight=ds.weight,
                    contribution=ds.contribution,
                    confidence=ds.confidence,
                    evidence=ds.evidence,
                )
                for dim, ds in rec.dimension_scores.items()
            },
            conflicts=[
                ConflictSchema(
                    dimension_a=c.dimension_a.value,
                    dimension_b=c.dimension_b.value,
                    severity=c.severity.value,
                    description=c.description,
                    explanation=c.explanation,
                )
                for c in rec.conflicts
            ],
            bonuses=[
                BonusPenaltySchema(factor=b.factor, value=b.value, description=b.description)
                for b in rec.bonuses
            ],
            penalties=[
                BonusPenaltySchema(factor=p.factor, value=p.value, description=p.description)
                for p in rec.penalties
            ],
            generated_at=result.generated_at,
        )

    def _cache_key(self, symbol: str, engine_data: Dict[str, Any]) -> str:
        data_str = json.dumps({k: sorted(v.items()) if isinstance(v, dict) else v for k, v in sorted(engine_data.items())}, default=str)
        return f"{symbol}:{hash(data_str)}"
