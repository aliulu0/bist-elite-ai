from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from modules.walk_forward_engine.core.types import (
    WalkForwardRequest,
    WindowMode,
    TrainTestSplit,
    WindowPeriod,
    ValidationTarget,
)
from modules.walk_forward_engine.schemas.schemas import (
    BenchmarkResponse,
    CacheStatsResponse,
    HealthResponse,
    SummaryResponse,
    WalkForwardHistoryItem,
    WalkForwardHistoryResponse,
    WalkForwardListItem,
    WalkForwardListResponse,
    WalkForwardReportRequest,
    WalkForwardReportResponse,
    WalkForwardResultResponse,
    WalkForwardRunRequest,
)
from modules.walk_forward_engine.services.service import WalkForwardService

router = APIRouter(prefix="/walk-forward", tags=["Walk Forward Analysis"])

_service: Optional[WalkForwardService] = None


def _get_service() -> WalkForwardService:
    global _service
    if _service is None:
        _service = WalkForwardService()
    return _service


def _to_core_request(req: WalkForwardRunRequest) -> WalkForwardRequest:
    service = _get_service()
    return WalkForwardRequest(
        symbol=req.symbol,
        strategy=req.strategy,
        start_date=req.start_date,
        end_date=req.end_date,
        window_mode=service._parse_window_mode(req.window_mode),
        train_test_split=service._parse_train_test_split(req.train_test_split),
        custom_train_pct=req.custom_train_pct,
        window_period=service._parse_window_period(req.window_period),
        min_train_rows=req.min_train_rows,
        min_test_rows=req.min_test_rows,
        optimization_metric=req.optimization_metric,
        validation_target=service._parse_validation_target(req.validation_target),
        parameter_space=req.parameter_space,
        max_combinations=req.max_combinations,
        regime_aware=req.regime_aware,
        initial_capital=req.initial_capital,
        commission_pct=req.commission_pct,
        slippage_pct=req.slippage_pct,
        stop_loss_pct=req.stop_loss_pct,
        take_profit_pct=req.take_profit_pct,
        metadata=req.metadata,
    )


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return _get_service().health_check()


@router.post("/run", response_model=WalkForwardResultResponse)
def run_walk_forward(request: WalkForwardRunRequest) -> WalkForwardResultResponse:
    service = _get_service()
    core_req = _to_core_request(request)
    result = service.run_analysis(core_req)
    return service.result_to_response(result)


@router.get("/list", response_model=WalkForwardListResponse)
def list_walk_forwards() -> WalkForwardListResponse:
    service = _get_service()
    results = service.list_results()
    now = datetime.now(timezone.utc).isoformat()
    return WalkForwardListResponse(
        items=[
            WalkForwardListItem(
                symbol=r.request.symbol,
                strategy=r.request.strategy,
                window_mode=r.request.window_mode.value,
                total_windows=r.total_windows,
                generalization_score=r.generalization.generalization_score,
                overfitting_score=r.generalization.overfitting_score,
                robustness_score=r.generalization.robustness_score,
                test_return=r.overall_test_return,
                test_sharpe=r.overall_test_sharpe,
            )
            for r in results
        ],
        total=len(results),
        generated_at=now,
    )


@router.get("/history/{symbol}", response_model=WalkForwardHistoryResponse)
def walk_forward_history(symbol: str) -> WalkForwardHistoryResponse:
    service = _get_service()
    results = service.get_history(symbol)
    return WalkForwardHistoryResponse(
        symbol=symbol,
        history=[
            WalkForwardHistoryItem(
                symbol=r.request.symbol,
                strategy=r.request.strategy,
                window_mode=r.request.window_mode.value,
                start_date=r.request.start_date,
                end_date=r.request.end_date,
                total_windows=r.total_windows,
                generalization_score=r.generalization.generalization_score,
                severity=r.generalization.severity.value,
                execution_time_ms=r.execution_time_ms,
            )
            for r in results
        ],
        total=len(results),
    )


@router.get("/summary", response_model=SummaryResponse)
def summary() -> SummaryResponse:
    return SummaryResponse(**_get_service().summary())


@router.post("/report", response_model=WalkForwardReportResponse)
def generate_report(request: WalkForwardReportRequest) -> WalkForwardReportResponse:
    service = _get_service()
    report = service.generate_report(request.symbol, request.report_type)
    if "error" in report:
        raise HTTPException(status_code=404, detail=report["error"])
    return WalkForwardReportResponse(**report)


@router.post("/benchmark", response_model=BenchmarkResponse)
def run_benchmark(iterations: int = Query(default=10, ge=1, le=100)) -> BenchmarkResponse:
    return _get_service().run_engine_benchmark(iterations)


@router.get("/cache/stats", response_model=CacheStatsResponse)
def cache_stats() -> CacheStatsResponse:
    return CacheStatsResponse(**_get_service().cache_stats())


@router.post("/cache/clear")
def clear_cache() -> Dict[str, int]:
    cleared = _get_service().clear_cache()
    return {"cleared": cleared}
