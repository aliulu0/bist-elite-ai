from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from modules.monte_carlo_engine.core.types import (
    MarketScenario,
    MonteCarloRequest,
    ValidationTarget,
)
from modules.monte_carlo_engine.schemas.schemas import (
    BenchmarkResponse,
    CacheStatsResponse,
    HealthResponse,
    MonteCarloListItem,
    MonteCarloListResponse,
    MonteCarloReportRequest,
    MonteCarloReportResponse,
    MonteCarloResultResponse,
    MonteCarloRunRequest,
    SummaryResponse,
)
from modules.monte_carlo_engine.services.service import MonteCarloService

router = APIRouter(prefix="/monte-carlo", tags=["Monte Carlo Risk Lab"])

_service: Optional[MonteCarloService] = None


def _get_service() -> MonteCarloService:
    global _service
    if _service is None:
        _service = MonteCarloService()
    return _service


def _to_core_request(req: MonteCarloRunRequest) -> MonteCarloRequest:
    service = _get_service()
    return MonteCarloRequest(
        symbol=req.symbol,
        strategy=req.strategy,
        start_date=req.start_date,
        end_date=req.end_date,
        simulation_method=service._parse_simulation_method(req.simulation_method),
        num_simulations=req.num_simulations,
        num_days=req.num_days,
        initial_capital=req.initial_capital,
        annual_return=req.annual_return,
        annual_volatility=req.annual_volatility,
        risk_free_rate=req.risk_free_rate,
        confidence_levels=req.confidence_levels,
        scenarios=service._parse_scenarios(req.scenarios),
        parameters=req.parameters,
        seed=req.seed,
        validation_target=service._parse_validation_target(req.validation_target),
        metadata=req.metadata,
    )


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return _get_service().health_check()


@router.post("/run", response_model=MonteCarloResultResponse)
def run_simulation(request: MonteCarloRunRequest) -> MonteCarloResultResponse:
    service = _get_service()
    core_req = _to_core_request(request)
    result = service.run_simulation(core_req)
    return service.result_to_response(result)


@router.get("/list", response_model=MonteCarloListResponse)
def list_simulations() -> MonteCarloListResponse:
    service = _get_service()
    results = service.list_results()
    now = datetime.now(timezone.utc).isoformat()
    return MonteCarloListResponse(
        items=[
            MonteCarloListItem(
                symbol=r.request.symbol,
                strategy=r.request.strategy,
                simulation_method=r.request.simulation_method.value,
                num_simulations=r.request.num_simulations,
                mean_return=r.mean_return,
                var_95=r.risk_metrics.var_95,
                max_drawdown=r.risk_metrics.max_drawdown,
            )
            for r in results
        ],
        total=len(results),
        generated_at=now,
    )


@router.get("/summary", response_model=SummaryResponse)
def summary() -> SummaryResponse:
    return SummaryResponse(**_get_service().summary())


@router.post("/report", response_model=MonteCarloReportResponse)
def generate_report(request: MonteCarloReportRequest) -> MonteCarloReportResponse:
    service = _get_service()
    report = service.generate_report(request.symbol, request.report_type)
    if "error" in report:
        raise HTTPException(status_code=404, detail=report["error"])
    return MonteCarloReportResponse(**report)


@router.get("/scenarios")
def get_scenarios() -> List[Dict[str, Any]]:
    return _get_service().get_scenarios()


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
