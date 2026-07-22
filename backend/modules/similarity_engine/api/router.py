from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from modules.similarity_engine.core.types import (
    FeatureCategory,
    MarketRegime,
    ReportType,
    SimilarityAnalysis,
    SimilarityMethod,
    SimilarityRequest,
    SimilarityResult,
    ValidationPeriod,
)
from modules.similarity_engine.schemas.schemas import (
    BenchmarkResultSchema,
    CacheStatsSchema,
    FeatureVectorSchema,
    HistoricalOutcomeSchema,
    PatternMemorySchema,
    SimilarityAnalysisSchema,
    SimilarityListResponse,
    SimilarityReportResponse,
    SimilarityRequestSchema,
    SimilarityResultSchema,
    SimilarityTopResponse,
)
from modules.similarity_engine.services.service import SimilarityEngineService

router = APIRouter(prefix="/similarity", tags=["Historical Similarity Engine"])

_service: Optional[SimilarityEngineService] = None


def _get_service() -> SimilarityEngineService:
    global _service
    if _service is None:
        _service = SimilarityEngineService()
    return _service


def _convert_request(schema: SimilarityRequestSchema) -> SimilarityRequest:
    methods = [SimilarityMethod(m) for m in schema.methods]
    categories = [FeatureCategory(c) for c in schema.feature_categories] if schema.feature_categories else []
    regime = MarketRegime(schema.market_regime) if schema.market_regime else None
    periods = [ValidationPeriod(p) for p in schema.validation_periods] if schema.validation_periods else []
    return SimilarityRequest(
        symbol=schema.symbol,
        reference_date=schema.reference_date,
        top_n=schema.top_n,
        methods=methods,
        feature_categories=categories,
        market_regime=regime,
        min_similarity=schema.min_similarity,
        lookback_days=schema.lookback_days,
        validation_periods=periods,
        weights=schema.weights,
        seed=schema.seed,
        metadata=schema.metadata,
    )


def _convert_result_to_schema(r: SimilarityResult) -> SimilarityResultSchema:
    return SimilarityResultSchema(
        source_symbol=r.source_symbol,
        target_symbol=r.target_symbol,
        target_date=r.target_date,
        similarity_score=r.similarity_score,
        similarity_label=r.similarity_label.value,
        method=r.method.value,
        feature_distances=r.feature_distances,
        contributing_features=r.contributing_features,
        historical_outcome=r.historical_outcome,
        pattern_outcome=r.pattern_outcome.value,
        market_regime=r.market_regime.value,
        metadata=r.metadata,
    )


def _convert_analysis(analysis: SimilarityAnalysis) -> SimilarityAnalysisSchema:
    results_schema = [_convert_result_to_schema(r) for r in analysis.results]
    top_schema = [_convert_result_to_schema(r) for r in analysis.top_similar_stocks]
    outcomes_schema = {}
    for k, v in analysis.historical_outcomes.items():
        outcomes_schema[k] = HistoricalOutcomeSchema(
            period_return=v.period_return,
            max_drawdown=v.max_drawdown,
            win_rate=v.win_rate,
            holding_period_days=v.holding_period_days,
            avg_return=v.avg_return,
            total_cases=v.total_cases,
            successful_cases=v.successful_cases,
            failed_cases=v.failed_cases,
            neutral_cases=v.neutral_cases,
        )
    memories_schema = [
        PatternMemorySchema(
            symbol=m.symbol,
            date=m.date,
            outcome=m.outcome.value,
            return_pct=m.return_pct,
            holding_period_days=m.holding_period_days,
            market_regime=m.market_regime.value,
            similarity_score=m.similarity_score,
        )
        for m in analysis.pattern_memories
    ]
    return SimilarityAnalysisSchema(
        symbol=analysis.request.symbol,
        reference_date=analysis.request.reference_date,
        results=results_schema,
        top_similar_stocks=top_schema,
        historical_outcomes=outcomes_schema,
        pattern_memories=memories_schema,
        overall_similarity=analysis.overall_similarity,
        confidence_score=analysis.confidence_score,
        regime_distribution=analysis.regime_distribution,
        execution_time_ms=analysis.execution_time_ms,
    )


@router.post("/analyze", response_model=SimilarityAnalysisSchema)
def analyze_similarity(request: SimilarityRequestSchema) -> SimilarityAnalysisSchema:
    svc = _get_service()
    try:
        req = _convert_request(request)
        analysis = svc.analyze(req)
        return _convert_analysis(analysis)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")


@router.get("/list", response_model=SimilarityListResponse)
def list_results(
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
) -> SimilarityListResponse:
    svc = _get_service()
    results = svc.get_list(symbol)
    schemas = [_convert_result_to_schema(r) for r in results]
    return SimilarityListResponse(results=schemas, total=len(schemas))


@router.get("/top", response_model=SimilarityTopResponse)
def get_top(
    symbol: str = Query(..., description="Stock symbol"),
    top_n: int = Query(5, description="Number of top results"),
) -> SimilarityTopResponse:
    svc = _get_service()
    results = svc.get_top(symbol, top_n)
    schemas = [_convert_result_to_schema(r) for r in results]
    return SimilarityTopResponse(symbol=symbol, top_stocks=schemas, total=len(schemas))


@router.get("/details", response_model=SimilarityAnalysisSchema)
def get_details(
    symbol: str = Query(..., description="Stock symbol"),
) -> SimilarityAnalysisSchema:
    svc = _get_service()
    analysis = svc.get_details(symbol)
    if analysis is None:
        raise HTTPException(status_code=404, detail=f"No analysis found for {symbol}")
    return _convert_analysis(analysis)


@router.get("/history", response_model=List[Dict[str, Any]])
def get_history() -> List[Dict[str, Any]]:
    svc = _get_service()
    return svc.get_history()


@router.get("/report/{symbol}", response_model=Dict[str, Any])
def get_report(
    symbol: str,
    report_type: str = Query("executive_summary", description="Report type"),
) -> Dict[str, Any]:
    svc = _get_service()
    try:
        rt = ReportType(report_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid report type: {report_type}")
    return svc.generate_report(symbol, rt)


@router.get("/cache/stats", response_model=CacheStatsSchema)
def get_cache_stats() -> CacheStatsSchema:
    svc = _get_service()
    stats = svc.get_cache_stats()
    return CacheStatsSchema(**stats)


@router.post("/cache/clear")
def clear_cache() -> Dict[str, str]:
    svc = _get_service()
    svc.clear_cache()
    return {"status": "cleared"}
