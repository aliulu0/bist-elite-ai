from __future__ import annotations

from fastapi import APIRouter, HTTPException

from modules.strategy_engine.services.strategy_service import StrategyService
from modules.strategy_engine.schemas.strategy_schemas import (
    StrategyListResponse,
    StrategyTemplatesResponse,
    RunStrategyRequest,
    RunStrategyResponse,
    StrategyResultSchema,
    RankedStockSchema,
    CreateStrategyRequest,
    UpdateStrategyRequest,
    ValidationRequest,
    ValidationResult,
    StrategyHistoryResponse,
    StrategyHistoryEntry,
    BenchmarkRequest,
    BenchmarkResponse,
    StrategyDefinitionSchema,
)

router = APIRouter(prefix="/strategy", tags=["strategy"])


def _get_service() -> StrategyService:
    return StrategyService()


@router.get("/list", response_model=StrategyListResponse)
def list_strategies():
    service = _get_service()
    strategies = service.list_strategies()
    return StrategyListResponse(
        strategies=[service.convert_to_schema(s) for s in strategies],
        count=len(strategies),
    )


@router.get("/templates", response_model=StrategyTemplatesResponse)
def list_templates():
    service = _get_service()
    strategies = service.list_templates()
    return StrategyTemplatesResponse(
        templates=[service.convert_to_schema(s) for s in strategies],
        count=len(strategies),
    )


@router.get("/history", response_model=StrategyHistoryResponse)
def get_history(strategy_name: str = "", limit: int = 50):
    service = _get_service()
    entries = service.get_history(strategy_name=strategy_name or None, limit=limit)
    return StrategyHistoryResponse(
        entries=[StrategyHistoryEntry(**e) for e in entries],
        count=len(entries),
    )


@router.post("/run", response_model=RunStrategyResponse)
def run_strategy(request: RunStrategyRequest):
    service = _get_service()
    try:
        results, rankings, summary = service.run_strategy(
            strategy_name=request.strategy_name,
            symbols=request.symbols,
            metrics_map=request.metrics_map,
        )
        return RunStrategyResponse(
            strategy_name=request.strategy_name,
            results=[service.convert_result_to_schema(r) for r in results],
            rankings=[service.convert_ranking_to_schema(r) for r in rankings],
            summary=summary,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create", response_model=ValidationResult)
def create_strategy(request: CreateStrategyRequest):
    service = _get_service()
    definition = service._definition_from_schema(request.definition)
    errors = service.create_strategy(definition)
    return ValidationResult(valid=len(errors) == 0, errors=errors)


@router.post("/update", response_model=ValidationResult)
def update_strategy(request: UpdateStrategyRequest):
    service = _get_service()
    definition = service._definition_from_schema(request.definition)
    errors = service.update_strategy(definition)
    return ValidationResult(valid=len(errors) == 0, errors=errors)


@router.delete("/{strategy_name}")
def delete_strategy(strategy_name: str):
    service = _get_service()
    removed = service.delete_strategy(strategy_name)
    if not removed:
        raise HTTPException(status_code=404, detail=f"Strategy '{strategy_name}' not found")
    return {"deleted": True, "strategy_name": strategy_name}


@router.post("/validate", response_model=ValidationResult)
def validate_strategy(request: ValidationRequest):
    service = _get_service()
    definition = service._definition_from_schema(request.definition)
    return service.validate_strategy(definition)


@router.post("/benchmark", response_model=BenchmarkResponse)
def benchmark_strategy(request: BenchmarkRequest):
    service = _get_service()
    sample_metrics = {
        "pe_ratio": 12.0,
        "pb_ratio": 1.2,
        "roe": 18.0,
        "rsi": 45.0,
        "macd": 0.5,
        "adx": 30.0,
        "volume_ratio": 2.0,
        "close": 100.0,
        "momentum": 5.0,
        "volatility": 15.0,
        "max_drawdown": 10.0,
        "sharpe_ratio": 1.5,
    }
    try:
        result = service.benchmark(
            strategy_name=request.strategy_name,
            sample_metrics=sample_metrics,
            iterations=request.iterations,
        )
        return BenchmarkResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
