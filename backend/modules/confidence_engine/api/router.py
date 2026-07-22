from __future__ import annotations

from typing import Dict, Any

from fastapi import APIRouter, HTTPException

from modules.confidence_engine.schemas.schemas import (
    CalculateConfidenceRequest,
    ConfidenceScoreResponse,
    DimensionContributionResponse,
    BonusResponse,
    PenaltyResponse,
    WarningResponse,
    ConfidenceListRequest,
    ConfidenceListResponse,
    ConfidenceDetailsResponse,
    ConfidenceHistoryResponse,
    ConfidenceHistoryEntryResponse,
    ConfidenceBreakdownResponse,
    ProfileResponse,
    ProfileListResponse,
    CacheStatsResponse,
    BenchmarkRequest,
    ValidateRequest,
    ReportRequest,
    ReportResponse,
)
from modules.confidence_engine.services.service import ConfidenceService
from modules.confidence_engine.core.types import ConfidenceCalculationRequest

router = APIRouter(prefix="/api/v1/confidence", tags=["Confidence"])

_service = ConfidenceService()


def _to_response(result) -> ConfidenceScoreResponse:
    dim_resp: Dict[str, DimensionContributionResponse] = {}
    for dim, contrib in result.dimension_contributions.items():
        dim_resp[dim.value] = DimensionContributionResponse(
            dimension=dim.value,
            raw_score=contrib.raw_score,
            normalized_score=contrib.normalized_score,
            weighted_score=contrib.weighted_score,
            contribution=contrib.contribution,
            weight=contrib.weight,
            confidence=contrib.confidence,
            evidence_count=contrib.evidence_count,
            details=contrib.details,
        )

    bonuses = [
        BonusResponse(
            factor=b.factor.value,
            points=b.points,
            condition=b.condition,
            applied_count=b.applied_count,
        )
        for b in result.bonuses
    ]

    penalties = [
        PenaltyResponse(
            factor=p.factor.value,
            points=p.points,
            condition=p.condition,
            applied_count=p.applied_count,
        )
        for p in result.penalties
    ]

    warnings = [
        WarningResponse(
            dimension=w.dimension,
            message=w.message,
            severity=w.severity,
        )
        for w in result.warnings
    ]

    return ConfidenceScoreResponse(
        symbol=result.symbol,
        confidence_score=result.confidence_score,
        confidence_label=result.confidence_label.value,
        dimension_contributions=dim_resp,
        bonuses=bonuses,
        penalties=penalties,
        warnings=warnings,
        raw_score=result.raw_score,
        total_weight=result.total_weight,
        calculated_at=result.calculated_at.isoformat(),
        calculation_id=result.calculation_id,
    )


@router.post("/calculate", response_model=ConfidenceScoreResponse)
def calculate_confidence(request: CalculateConfidenceRequest) -> ConfidenceScoreResponse:
    calc_request = ConfidenceCalculationRequest(
        symbol=request.symbol,
        scores=request.scores,
        dimension_scores=request.dimension_scores,
        breakdowns=request.breakdowns,
        profile_name=request.profile_name,
        source_data=request.source_data,
    )
    result = _service.calculate(calc_request)
    return _to_response(result)


@router.post("/list", response_model=ConfidenceListResponse)
def list_confidence(request: ConfidenceListRequest) -> ConfidenceListResponse:
    results = _service.calculate_list(
        symbols=request.symbols,
        scores_map=request.scores,
        profile_name=request.profile_name,
    )
    return ConfidenceListResponse(
        results=[_to_response(r) for r in results],
        count=len(results),
        total_requested=len(request.symbols),
    )


@router.get("/details")
def get_details(symbol: str) -> Dict[str, Any]:
    details = _service.get_details(symbol)
    if details is None:
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")
    trend_val = details["trend"]
    return {
        "symbol": symbol,
        "trend": trend_val.value if trend_val else None,
        "history_count": details["history_count"],
    }


@router.get("/history")
def get_history(
    symbol: str,
    limit: int = 30,
) -> Dict[str, Any]:
    history = _service.get_history(symbol, limit)
    return {
        "symbol": symbol,
        "history": [
            {
                "symbol": he.symbol,
                "confidence_score": he.confidence_score,
                "confidence_label": he.confidence_label.value,
                "calculated_at": he.calculated_at.isoformat(),
                "delta": he.delta,
                "trend": he.trend.value,
            }
            for he in history
        ],
        "count": len(history),
    }


@router.get("/breakdown")
def get_breakdown(symbol: str) -> Dict[str, Any]:
    details = _service.get_details(symbol)
    if details is None:
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")
    history = _service.get_history(symbol, limit=1)
    if not history:
        raise HTTPException(status_code=404, detail=f"No score data for {symbol}")

    result = _service.calculate(
        ConfidenceCalculationRequest(symbol=symbol, scores={}, profile_name="standard")
    )
    return _service.get_breakdown(result)


@router.get("/profiles")
def get_profiles() -> Dict[str, Any]:
    profiles = _service.get_profiles()
    return {
        "profiles": [
            {
                "name": p.name,
                "description": p.description,
                "dimensions": {d.value: dw.weight for d, dw in p.dimension_weights.items()},
                "bonus_count": len(p.bonus_rules),
                "penalty_count": len(p.penalty_rules),
                "is_active": p.is_active,
            }
            for p in profiles.values()
        ],
        "count": len(profiles),
    }


@router.post("/validate")
def validate(request: ValidateRequest) -> Dict[str, Any]:
    errors = _service.validate(data=request.data)
    return {"is_valid": len(errors) == 0, "errors": errors}


@router.get("/cache/stats")
def cache_stats() -> Dict[str, Any]:
    return _service.cache_stats()


@router.post("/cache/clear")
def clear_cache() -> Dict[str, int]:
    cleared = _service.clear_cache()
    return {"cleared": cleared}


@router.post("/benchmark")
def run_benchmark(request: BenchmarkRequest) -> Dict[str, Any]:
    result = _service.run_benchmark(
        iterations=request.iterations,
        warmup=request.warmup,
        symbol=request.symbol,
        profile_name=request.profile_name,
    )
    return {
        "operation": result.operation,
        "execution_time_ms": result.execution_time_ms,
        "memory_mb": result.memory_mb,
        "iterations": result.iterations,
        "avg_time_ms": result.avg_time_ms,
        "min_time_ms": result.min_time_ms,
        "max_time_ms": result.max_time_ms,
        "p95_time_ms": result.p95_time_ms,
        "success": result.success,
        "error_message": result.error_message,
    }


@router.post("/report")
def generate_report(request: ReportRequest) -> Dict[str, Any]:
    report = _service.generate_report(
        symbol=request.symbol,
        report_type=request.report_type,
        source_data=request.source_data,
    )
    return {
        "symbol": report.symbol,
        "report_type": report.report_type.value,
        "title": report.title,
        "summary": report.summary,
        "sections": report.sections,
        "generated_at": report.generated_at.isoformat(),
    }
