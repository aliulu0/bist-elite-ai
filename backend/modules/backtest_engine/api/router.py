from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from modules.backtest_engine.schemas.schemas import (
    BacktestCompareRequest,
    BacktestCompareResponse,
    BacktestListItem,
    BacktestListResponse,
    BacktestResultResponse,
    BacktestRunRequest,
    BenchmarkResponse,
    CacheStatsResponse,
    HealthResponse,
    HistoryResponse,
    PerformanceMetricsSchema,
    ReportRequest,
    ReportResponse,
    SummaryResponse,
)
from modules.backtest_engine.services.service import BacktestService
from modules.backtest_engine.core.types import (
    BacktestRequest,
    BacktestType,
    BenchmarkType,
    InvestmentHorizon,
)

router = APIRouter(prefix="/backtest", tags=["Backtest Engine"])

_service: Optional[BacktestService] = None


def _get_service() -> BacktestService:
    global _service
    if _service is None:
        _service = BacktestService()
    return _service


def _to_core_request(req: BacktestRunRequest) -> BacktestRequest:
    service = _get_service()
    return BacktestRequest(
        symbol=req.symbol,
        strategy=req.strategy,
        start_date=req.start_date,
        end_date=req.end_date,
        initial_capital=req.initial_capital,
        commission_pct=req.commission_pct,
        slippage_pct=req.slippage_pct,
        position_size_pct=req.position_size_pct,
        stop_loss_pct=req.stop_loss_pct,
        take_profit_pct=req.take_profit_pct,
        max_positions=req.max_positions,
        horizon=service._parse_horizon(req.horizon),
        backtest_type=service._parse_backtest_type(req.backtest_type),
        benchmark=service._parse_benchmark(req.benchmark),
        parameters=req.parameters,
    )


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return _get_service().health_check()


@router.post("/run", response_model=BacktestResultResponse)
def run_backtest(request: BacktestRunRequest) -> BacktestResultResponse:
    service = _get_service()
    core_req = _to_core_request(request)
    result = service.run_backtest(core_req)
    return service.result_to_response(result)


@router.get("/list", response_model=BacktestListResponse)
def list_backtests() -> BacktestListResponse:
    service = _get_service()
    results = service.list_results()
    now = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
    return BacktestListResponse(
        items=[
            BacktestListItem(
                symbol=r.request.symbol,
                strategy=r.request.strategy,
                total_return=r.metrics.total_return,
                sharpe_ratio=r.metrics.sharpe_ratio,
                max_drawdown=r.metrics.max_drawdown,
                total_trades=r.metrics.total_trades,
                market_period=r.market_period.value,
            )
            for r in results
        ],
        total=len(results),
        generated_at=now,
    )


@router.get("/history/{symbol}", response_model=HistoryResponse)
def backtest_history(symbol: str) -> HistoryResponse:
    service = _get_service()
    results = service.get_history(symbol)
    return HistoryResponse(
        symbol=symbol,
        history=[
            BacktestListItem(
                symbol=r.request.symbol,
                strategy=r.request.strategy,
                total_return=r.metrics.total_return,
                sharpe_ratio=r.metrics.sharpe_ratio,
                max_drawdown=r.metrics.max_drawdown,
                total_trades=r.metrics.total_trades,
                market_period=r.market_period.value,
            )
            for r in results
        ],
        total=len(results),
    )


@router.get("/summary", response_model=SummaryResponse)
def summary() -> SummaryResponse:
    return SummaryResponse(**_get_service().summary())


@router.post("/compare", response_model=BacktestCompareResponse)
def compare_backtests(request: BacktestCompareRequest) -> BacktestCompareResponse:
    service = _get_service()
    requests = [
        BacktestRequest(
            symbol=sym,
            strategy=request.strategy,
            start_date=request.start_date,
            end_date=request.end_date,
            initial_capital=request.initial_capital,
            parameters=request.parameters,
        )
        for sym in request.symbols
    ]
    result = service.compare(requests)
    metrics_schema = {}
    for sym, m in result.get("metrics", {}).items():
        metrics_schema[sym] = PerformanceMetricsSchema(**m) if isinstance(m, dict) else m
    return BacktestCompareResponse(
        count=result.get("count", 0),
        best_performer=result.get("best_performer", ""),
        worst_performer=result.get("worst_performer", ""),
        avg_return=result.get("avg_return", 0.0),
        avg_sharpe=result.get("avg_sharpe", 0.0),
        metrics=metrics_schema,
    )


@router.post("/report", response_model=ReportResponse)
def generate_report(request: ReportRequest) -> ReportResponse:
    service = _get_service()
    report = service.generate_report(request.symbol, request.report_type)
    if "error" in report:
        raise HTTPException(status_code=404, detail=report["error"])
    return ReportResponse(**report)


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
