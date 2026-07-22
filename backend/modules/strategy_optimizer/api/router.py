from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from modules.strategy_optimizer.core.types import (
    InvestmentHorizon,
    OptimizationObjective,
    OptimizationRequest,
    OptimizationType,
    ReportType,
)
from modules.strategy_optimizer.schemas.schemas import (
    BenchmarkResultSchema,
    CacheStatsSchema,
    InvestmentHorizonSchema,
    OptimizationListResponse,
    OptimizationObjectiveSchema,
    OptimizationReportResponse,
    OptimizationRequestSchema,
    OptimizationResultSchema,
    OptimizationRunSchema,
    OptimizationTypeSchema,
    ParameterCandidateSchema,
    ReportTypeSchema,
)
from modules.strategy_optimizer.services.service import StrategyOptimizerService

router = APIRouter(prefix="/optimizer", tags=["Strategy Optimizer"])

_service: Optional[StrategyOptimizerService] = None


def _get_service() -> StrategyOptimizerService:
    global _service
    if _service is None:
        _service = StrategyOptimizerService()
    return _service


def _convert_request(schema: OptimizationRequestSchema) -> OptimizationRequest:
    return OptimizationRequest(
        symbol=schema.symbol,
        strategy=schema.strategy,
        optimization_type=OptimizationType(schema.optimization_type),
        horizon=InvestmentHorizon(schema.horizon),
        objective=OptimizationObjective(schema.objective),
        max_iterations=schema.max_iterations,
        max_candidates=schema.max_candidates,
        rejection_thresholds=schema.rejection_thresholds,
        early_stopping=schema.early_stopping,
        early_stopping_patience=schema.early_stopping_patience,
        seed=schema.seed,
        initial_capital=schema.initial_capital,
        commission_pct=schema.commission_pct,
        start_date=schema.start_date,
        end_date=schema.end_date,
        metadata=schema.metadata,
    )


def _convert_result(result: Any) -> OptimizationResultSchema:
    run = result.run
    best_schema = None
    if run.best_candidate:
        bc = run.best_candidate
        best_schema = ParameterCandidateSchema(
            parameters=bc.parameters,
            fitness_score=bc.fitness_score,
            objective_scores=bc.objective_scores,
            backtest_score=bc.backtest_score,
            walk_forward_score=bc.walk_forward_score,
            monte_carlo_score=bc.monte_carlo_score,
            overall_score=bc.overall_score,
            is_accepted=bc.is_accepted,
            rejection_reasons=[r.value for r in bc.rejection_reasons],
        )

    run_schema = OptimizationRunSchema(
        run_id=run.run_id,
        symbol=run.symbol,
        strategy=run.strategy,
        optimization_type=run.optimization_type.value,
        horizon=run.horizon.value,
        objective=run.objective.value,
        candidates_evaluated=run.candidates_evaluated,
        candidates_accepted=run.candidates_accepted,
        candidates_rejected=run.candidates_rejected,
        best_candidate=best_schema,
        baseline_fitness=run.baseline_fitness,
        best_fitness=run.best_fitness,
        improvement_pct=run.improvement_pct,
        execution_time_ms=run.execution_time_ms,
    )

    return OptimizationResultSchema(
        run=run_schema,
        optimized_parameters=result.optimized_parameters,
        performance_improvement=result.performance_improvement,
        risk_improvement=result.risk_improvement,
        robustness_score=result.robustness_score,
        generalization_score=result.generalization_score,
        execution_time_ms=result.execution_time_ms,
    )


@router.post("/run", response_model=OptimizationResultSchema)
def run_optimization(request: OptimizationRequestSchema) -> OptimizationResultSchema:
    svc = _get_service()
    try:
        opt_request = _convert_request(request)
        result = svc.run_optimization(opt_request)
        return _convert_result(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {e}")


@router.get("/list", response_model=OptimizationListResponse)
def list_optimizations(
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
) -> OptimizationListResponse:
    svc = _get_service()
    if symbol:
        runs = svc.get_history_by_symbol(symbol)
    else:
        runs = svc.get_history()
    run_schemas = []
    for run in runs:
        run_schemas.append(OptimizationRunSchema(
            run_id=run.run_id,
            symbol=run.symbol,
            strategy=run.strategy,
            optimization_type=run.optimization_type.value,
            horizon=run.horizon.value,
            objective=run.objective.value,
            candidates_evaluated=run.candidates_evaluated,
            candidates_accepted=run.candidates_accepted,
            candidates_rejected=run.candidates_rejected,
            baseline_fitness=run.baseline_fitness,
            best_fitness=run.best_fitness,
            improvement_pct=run.improvement_pct,
            execution_time_ms=run.execution_time_ms,
        ))
    return OptimizationListResponse(runs=run_schemas, total=len(run_schemas))


@router.get("/history/{run_id}", response_model=OptimizationRunSchema)
def get_history(run_id: str) -> OptimizationRunSchema:
    svc = _get_service()
    run = svc.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    return OptimizationRunSchema(
        run_id=run.run_id,
        symbol=run.symbol,
        strategy=run.strategy,
        optimization_type=run.optimization_type.value,
        horizon=run.horizon.value,
        objective=run.objective.value,
        candidates_evaluated=run.candidates_evaluated,
        candidates_accepted=run.candidates_accepted,
        candidates_rejected=run.candidates_rejected,
        baseline_fitness=run.baseline_fitness,
        best_fitness=run.best_fitness,
        improvement_pct=run.improvement_pct,
        execution_time_ms=run.execution_time_ms,
    )


@router.get("/report/{run_id}", response_model=OptimizationReportResponse)
def get_report(
    run_id: str,
    report_type: str = Query("optimization_summary", description="Report type"),
) -> OptimizationReportResponse:
    svc = _get_service()
    try:
        rt = ReportType(report_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid report type: {report_type}")
    return svc.get_report(run_id, rt)


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
