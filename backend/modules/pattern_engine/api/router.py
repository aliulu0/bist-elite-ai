from __future__ import annotations

from fastapi import APIRouter, HTTPException
from modules.pattern_engine.core.types import PriceBar
from modules.pattern_engine.schemas.pattern_schemas import (
    PatternDetectionRequest, PatternAnalysisResponse, PatternResultSchema,
    ClassicalDetectionRequest, CandlestickDetectionRequest,
    SMCDetectionRequest, WyckoffDetectionRequest,
    PluginListResponse, PluginInfoSchema, PluginParametersResponse,
    ValidationRequest, ValidationResult,
    SimilarityResponse, SimilarPatternSchema,
    BacktestRequest, BacktestResultSchema,
)
from modules.pattern_engine.services.pattern_service import PatternService

router = APIRouter(prefix="/api/v1/patterns", tags=["patterns"])

_service = PatternService()


def _to_price_bars(schemas: list) -> list[PriceBar]:
    return [
        PriceBar(
            date=p.date, open=p.open, high=p.high,
            low=p.low, close=p.close, volume=p.volume, turnover=p.turnover,
        )
        for p in schemas
    ]


def _result_to_schema(r) -> PatternResultSchema:
    return PatternResultSchema(
        pattern_name=r.pattern_name,
        category=r.category.value if hasattr(r.category, "value") else str(r.category),
        direction=r.direction.value if hasattr(r.direction, "value") else str(r.direction),
        status=r.status.value if hasattr(r.status, "value") else str(r.status),
        confidence=r.confidence,
        probability=r.probability,
        risk=r.risk,
        expected_target=r.expected_target,
        expected_duration=r.expected_duration,
        expected_pullback=r.expected_pullback,
        pattern_quality=r.pattern_quality,
        confirmation_score=r.confirmation_score,
        entry_price=r.entry_price,
        stop_loss=r.stop_loss,
        take_profit=r.take_profit,
        start_index=r.start_index,
        end_index=r.end_index,
        key_levels=r.key_levels,
        description=r.description,
        warnings=r.warnings if hasattr(r, "warnings") else [],
    )


@router.post("/detect", response_model=PatternAnalysisResponse)
def detect_patterns(request: PatternDetectionRequest) -> PatternAnalysisResponse:
    prices = _to_price_bars(request.prices)
    errors = _service.validate_prices(prices)
    if errors:
        raise HTTPException(status_code=422, detail=errors)
    analysis = _service.detect(
        prices, category=request.category,
        patterns=request.patterns, params=request.params,
    )
    return PatternAnalysisResponse(
        symbol=request.symbol,
        total_patterns=analysis.total_patterns,
        bullish_count=analysis.bullish_count,
        bearish_count=analysis.bearish_count,
        avg_confidence=analysis.avg_confidence,
        dominant_direction=analysis.dominant_direction.value,
        patterns=[_result_to_schema(d) for d in analysis.detected_patterns],
    )


@router.post("/classical", response_model=list[PatternResultSchema])
def detect_classical(request: ClassicalDetectionRequest) -> list[PatternResultSchema]:
    prices = _to_price_bars(request.prices)
    results = _service.detect_classical(prices, request.params)
    return [_result_to_schema(r) for r in results]


@router.post("/candlestick", response_model=list[PatternResultSchema])
def detect_candlestick(request: CandlestickDetectionRequest) -> list[PatternResultSchema]:
    prices = _to_price_bars(request.prices)
    results = _service.detect_candlestick(prices, request.params)
    return [_result_to_schema(r) for r in results]


@router.post("/smc", response_model=list[PatternResultSchema])
def detect_smc(request: SMCDetectionRequest) -> list[PatternResultSchema]:
    prices = _to_price_bars(request.prices)
    results = _service.detect_smc(prices, request.params)
    return [_result_to_schema(r) for r in results]


@router.post("/wyckoff", response_model=list[PatternResultSchema])
def detect_wyckoff(request: WyckoffDetectionRequest) -> list[PatternResultSchema]:
    prices = _to_price_bars(request.prices)
    results = _service.detect_wyckoff(prices, request.params)
    return [_result_to_schema(r) for r in results]


@router.get("/list", response_model=PluginListResponse)
def list_plugins() -> PluginListResponse:
    plugins = _service.list_plugins()
    return PluginListResponse(
        total=len(plugins),
        plugins=[PluginInfoSchema(**p) for p in plugins],
    )


@router.get("/plugin/{name}", response_model=PluginParametersResponse)
def get_plugin_parameters(name: str) -> PluginParametersResponse:
    info = _service.get_plugin(name)
    if info is None:
        raise HTTPException(status_code=404, detail=f"Plugin '{name}' not found")
    return PluginParametersResponse(
        name=info["name"],
        display_name=info["display_name"],
        parameters=info.get("parameters", {}),
    )


@router.post("/validate", response_model=ValidationResult)
def validate_prices(request: ValidationRequest) -> ValidationResult:
    prices = _to_price_bars(request.prices)
    errors = _service.validate_prices(prices)
    return ValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        bar_count=len(prices),
    )


@router.post("/history", response_model=list[PatternResultSchema])
def get_history(request: PatternDetectionRequest) -> list[PatternResultSchema]:
    prices = _to_price_bars(request.prices)
    analysis = _service.detect(
        prices, category=request.category,
        patterns=request.patterns, params=request.params,
    )
    return [_result_to_schema(d) for d in analysis.detected_patterns]
