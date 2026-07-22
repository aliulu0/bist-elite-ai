from __future__ import annotations

import time
from typing import Any

from modules.early_opportunity_engine.core.types import (
    MarketRegimeType,
    OpportunityResult,
    OpportunityRating,
)
from modules.early_opportunity_engine.pipeline.opportunity_pipeline import OpportunityPipeline
from modules.early_opportunity_engine.ranking.opportunity_ranker import OpportunityRanker
from modules.early_opportunity_engine.validators.opportunity_validator import OpportunityValidator
from modules.early_opportunity_engine.cache.opportunity_cache import get_cache
from modules.early_opportunity_engine.schemas.opportunity_schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    BatchAnalyzeRequest,
    BatchAnalyzeResponse,
    OpportunityResultSchema,
    OpportunityListResponse,
    OpportunityDetailResponse,
    RankedOpportunitySchema,
    OpportunityHistoryEntry,
    OpportunityHistoryResponse,
    OpportunitySummaryResponse,
    ValidateRequest,
    ValidateResponse,
    CacheStatsResponse,
    RiskAssessmentSchema,
    ExpectedReturnSchema,
    StageResultSchema,
    AnalysisSignalSchema,
)


class OpportunityService:

    def __init__(self) -> None:
        self._pipeline = OpportunityPipeline()
        self._ranker = OpportunityRanker()
        self._validator = OpportunityValidator()
        self._cache = get_cache()
        self._history: list[dict] = []

    def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        start = time.perf_counter()

        cached = self._cache.get(request.symbol, {"metrics_hash": str(sorted(request.metrics.items()))})
        if cached:
            elapsed = (time.perf_counter() - start) * 1000
            return AnalyzeResponse(
                result=OpportunityResultSchema(**cached),
                elapsed_ms=elapsed,
            )

        regime = None
        if request.market_regime:
            try:
                regime = MarketRegimeType(request.market_regime)
            except ValueError:
                pass

        result = self._pipeline.analyze(
            request.symbol, request.metrics, market_regime=regime,
        )

        self._history.append({
            "symbol": result.symbol,
            "score": result.opportunity_score,
            "rating": result.rating.value,
            "stage": result.stage.value,
            "timestamp": result.timestamp,
        })

        result_schema = self._result_to_schema(result)
        self._cache.set(
            request.symbol,
            result_schema.model_dump(),
            {"metrics_hash": str(sorted(request.metrics.items()))},
        )

        stage_schemas = [
            StageResultSchema(
                category=sr.category.value,
                score=sr.score,
                signal_count=len(sr.signals),
                warning_count=len(sr.warnings),
                signals=[
                    AnalysisSignalSchema(
                        name=s.name, category=s.category.value,
                        strength=s.strength, confidence=s.confidence,
                        description=s.description,
                    )
                    for s in sr.signals
                ],
                warnings=sr.warnings,
            )
            for sr in result.stage_results
        ]

        elapsed = (time.perf_counter() - start) * 1000
        return AnalyzeResponse(
            result=result_schema,
            stage_results=stage_schemas,
            elapsed_ms=elapsed,
        )

    def batch_analyze(self, request: BatchAnalyzeRequest) -> BatchAnalyzeResponse:
        start = time.perf_counter()

        regime = None
        if request.market_regime:
            try:
                regime = MarketRegimeType(request.market_regime)
            except ValueError:
                pass

        results = []
        for symbol in request.symbols:
            metrics = request.metrics.get(symbol, {})
            if not metrics:
                continue
            result = self._pipeline.analyze(symbol, metrics, market_regime=regime)
            results.append(self._result_to_schema(result))

        results = sorted(results, key=lambda x: x.opportunity_score, reverse=True)
        if request.limit:
            results = results[:request.limit]

        elapsed = (time.perf_counter() - start) * 1000
        return BatchAnalyzeResponse(
            results=results,
            count=len(results),
            elapsed_ms=elapsed,
        )

    def get_top(
        self,
        all_results: list[OpportunityResult],
        limit: int = 50,
        min_score: float = 0.0,
    ) -> OpportunityListResponse:
        filtered = [r for r in all_results if r.opportunity_score >= min_score]
        ranked = self._ranker.rank(filtered, limit=limit)
        for i, r in enumerate(ranked):
            r.rank = i + 1
        return OpportunityListResponse(
            results=[
                RankedOpportunitySchema(
                    symbol=r.symbol, opportunity_score=r.opportunity_score,
                    rating=r.rating if isinstance(r.rating, str) else r.rating,
                    stage=r.stage if isinstance(r.stage, str) else r.stage,
                    confidence=r.confidence, risk_score=r.risk_score,
                    expected_return=r.expected_return, rank=r.rank,
                )
                for r in ranked
            ],
            total=len(ranked),
        )

    def get_detail(
        self,
        results: list[OpportunityResult],
        symbol: str,
    ) -> OpportunityDetailResponse | None:
        for r in results:
            if r.symbol == symbol:
                schema = self._result_to_schema(r)
                stage_schemas = [
                    StageResultSchema(
                        category=sr.category.value, score=sr.score,
                        signal_count=len(sr.signals), warning_count=len(sr.warnings),
                        signals=[
                            AnalysisSignalSchema(
                                name=s.name, category=s.category.value,
                                strength=s.strength, confidence=s.confidence,
                                description=s.description,
                            )
                            for s in sr.signals
                        ],
                        warnings=sr.warnings,
                    )
                    for sr in r.stage_results
                ]
                return OpportunityDetailResponse(
                    symbol=symbol, result=schema, stage_results=stage_schemas,
                )
        return None

    def get_history(
        self,
        limit: int = 100,
        symbol: str | None = None,
    ) -> OpportunityHistoryResponse:
        entries = self._history
        if symbol:
            entries = [e for e in entries if e["symbol"] == symbol]
        entries = entries[-limit:]
        return OpportunityHistoryResponse(
            history=[
                OpportunityHistoryEntry(**e) for e in entries
            ],
            total=len(entries),
        )

    def get_summary(self, results: list[OpportunityResult]) -> OpportunitySummaryResponse:
        agg = self._ranker.aggregate(results)
        return OpportunitySummaryResponse(
            total=agg["total"],
            avg_score=agg["avg_score"],
            avg_confidence=agg["avg_confidence"],
            avg_risk=agg["avg_risk"],
            exceptional=agg["exceptional"],
            very_high=agg["very_high"],
            high=agg["high"],
            medium=agg["medium"],
            low=agg["low"],
            very_low=agg["very_low"],
        )

    def validate(self, request: ValidateRequest) -> ValidateResponse:
        errors = self._validator.validate_metrics(request.metrics)
        analyzable, msg = self._validator.is_analyzable(request.metrics)
        return ValidateResponse(
            valid=len(errors) == 0,
            errors=errors,
            analyzable=analyzable,
            message=msg,
        )

    def cache_stats(self) -> CacheStatsResponse:
        stats = self._cache.stats()
        return CacheStatsResponse(**stats)

    def clear_cache(self) -> int:
        count = self._cache.size
        self._cache.clear()
        return count

    def _result_to_schema(self, r: OpportunityResult) -> OpportunityResultSchema:
        return OpportunityResultSchema(
            symbol=r.symbol,
            opportunity_score=r.opportunity_score,
            rating=r.rating.value if hasattr(r.rating, "value") else str(r.rating),
            stage=r.stage.value if hasattr(r.stage, "value") else str(r.stage),
            confidence=r.confidence,
            risk=RiskAssessmentSchema(
                score=r.risk.score,
                drawdown_probability=r.risk.drawdown_probability,
                liquidity_risk=r.risk.liquidity_risk,
                volatility_risk=r.risk.volatility_risk,
                sector_risk=r.risk.sector_risk,
                details=r.risk.details,
            ),
            expected_window=r.expected_window.value if hasattr(r.expected_window, "value") else str(r.expected_window),
            expected_return=ExpectedReturnSchema(
                conservative=r.expected_return.conservative,
                expected=r.expected_return.expected,
                optimistic=r.expected_return.optimistic,
            ),
            market_regime=r.market_regime.value if hasattr(r.market_regime, "value") else str(r.market_regime),
            warnings=r.warnings,
            red_flags_count=len(r.red_flags),
            early_warnings_count=len(r.early_warnings),
            explanations=r.explanations,
            timestamp=r.timestamp,
        )
