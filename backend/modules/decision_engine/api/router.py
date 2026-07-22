from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from modules.decision_engine.schemas.schemas import (
    BenchmarkResponse,
    CacheStatsResponse,
    DecisionGenerateRequest,
    DecisionHistoryResponse,
    DecisionListResponse,
    DecisionTopResponse,
    HealthResponse,
    RecommendationResponse,
    ReportRequest,
    ReportResponse,
)
from modules.decision_engine.services.service import DecisionService

router = APIRouter(prefix="/decision", tags=["Decision Engine"])

_service: Optional[DecisionService] = None


def _get_service() -> DecisionService:
    global _service
    if _service is None:
        _service = DecisionService()
    return _service


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return _get_service().health_check()


@router.post("/generate", response_model=RecommendationResponse)
def generate_decision(request: DecisionGenerateRequest) -> RecommendationResponse:
    service = _get_service()
    result = service.generate_decision(request)
    return service.result_to_response(result)


@router.get("/list", response_model=DecisionListResponse)
def list_decisions() -> DecisionListResponse:
    service = _get_service()
    results = service.list_decisions()
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
    return DecisionListResponse(
        items=[
            {
                "symbol": r.symbol,
                "decision": r.decision_label.value,
                "decision_score": r.decision_score,
                "decision_confidence": r.decision_confidence,
                "decision_urgency": r.decision_urgency.value,
                "summary": r.recommendation.summary,
            }
            for r in results
        ],
        total=len(results),
        generated_at=now,
    )


@router.get("/top", response_model=DecisionTopResponse)
def top_decisions(count: int = Query(default=10, ge=1, le=100)) -> DecisionTopResponse:
    service = _get_service()
    results = service.get_top_decisions(count)
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
    return DecisionTopResponse(
        items=[
            {
                "symbol": r.symbol,
                "decision": r.decision_label.value,
                "decision_score": r.decision_score,
                "decision_confidence": r.decision_confidence,
                "decision_urgency": r.decision_urgency.value,
                "summary": r.recommendation.summary,
            }
            for r in results
        ],
        count=len(results),
        generated_at=now,
    )


@router.get("/details/{symbol}", response_model=RecommendationResponse)
def decision_details(symbol: str) -> RecommendationResponse:
    service = _get_service()
    result = service.get_decision(symbol)
    if result is None:
        raise HTTPException(status_code=404, detail=f"No decision found for {symbol}")
    return service.result_to_response(result)


@router.get("/history/{symbol}", response_model=DecisionHistoryResponse)
def decision_history(symbol: str) -> DecisionHistoryResponse:
    service = _get_service()
    history = service.get_history(symbol)
    return DecisionHistoryResponse(
        symbol=symbol,
        history=[
            {
                "symbol": symbol,
                "decision": h["decision"],
                "score": h["score"],
                "confidence": h["confidence"],
                "generated_at": h["generated_at"],
            }
            for h in history
        ],
        total=len(history),
    )


@router.post("/report", response_model=ReportResponse)
def generate_report(request: ReportRequest) -> ReportResponse:
    service = _get_service()
    report = service.generate_report(request.symbol, request.report_type)
    if "error" in report:
        raise HTTPException(status_code=404, detail=report["error"])
    return ReportResponse(**report)


@router.post("/benchmark", response_model=BenchmarkResponse)
def run_benchmark(iterations: int = Query(default=50, ge=1, le=500)) -> BenchmarkResponse:
    return _get_service().run_benchmark(iterations)


@router.get("/cache/stats", response_model=CacheStatsResponse)
def cache_stats() -> CacheStatsResponse:
    return CacheStatsResponse(**_get_service().cache_stats())


@router.post("/cache/clear")
def clear_cache() -> Dict[str, int]:
    cleared = _get_service().clear_cache()
    return {"cleared": cleared}
