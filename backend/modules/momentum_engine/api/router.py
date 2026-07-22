from fastapi import APIRouter, HTTPException, Query

from modules.momentum_engine.services.momentum_service import MomentumService
from modules.momentum_engine.schemas.momentum_schemas import (
    IndicatorResponse,
    SignalResponse,
    DivergenceResponse,
    CalculateRequest,
    AvailableIndicatorsResponse,
    CacheStatsResponse,
    BenchmarkResponse,
)

router = APIRouter(prefix="/momentum", tags=["momentum"])


def _get_service() -> MomentumService:
    return MomentumService()


@router.get("/indicators", response_model=AvailableIndicatorsResponse)
def get_available_indicators():
    service = _get_service()
    return service.get_available_indicators()


@router.post("/calculate", response_model=IndicatorResponse)
def calculate_indicator(request: CalculateRequest):
    service = _get_service()
    try:
        return service.calculate(
            indicator=request.indicator,
            prices=request.prices,
            include_signals=request.include_signals,
            include_divergence=request.include_divergence,
            include_scoring=request.include_scoring,
            **request.params,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/rsi", response_model=IndicatorResponse)
def get_rsi(
    period: int = Query(default=14, ge=2, le=500),
    prices_json: str = Query(default=None, description="JSON-encoded prices"),
):
    import json
    if not prices_json:
        raise HTTPException(status_code=400, detail="prices_json is required")
    try:
        raw = json.loads(prices_json)
        prices = [__import__("modules.momentum_engine.schemas.momentum_schemas", fromlist=["PriceBarSchema"]).PriceBarSchema(**p) for p in raw]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid prices: {e}")
    service = _get_service()
    return service.calculate("rsi", prices, period=period)


@router.get("/stoch-rsi", response_model=IndicatorResponse)
def get_stoch_rsi(
    rsi_period: int = Query(default=14, ge=2, le=500),
    stoch_period: int = Query(default=14, ge=2, le=500),
):
    raise HTTPException(status_code=400, detail="Use POST /momentum/calculate with indicator=stoch_rsi")


@router.get("/macd", response_model=IndicatorResponse)
def get_macd(
    fast_period: int = Query(default=12, ge=2, le=200),
    slow_period: int = Query(default=26, ge=5, le=500),
    signal_period: int = Query(default=9, ge=2, le=100),
):
    raise HTTPException(status_code=400, detail="Use POST /momentum/calculate with indicator=macd")


@router.get("/adx", response_model=IndicatorResponse)
def get_adx(
    period: int = Query(default=14, ge=2, le=500),
):
    raise HTTPException(status_code=400, detail="Use POST /momentum/calculate with indicator=adx")


@router.get("/signals/{indicator}", response_model=list[SignalResponse])
def get_signals(
    indicator: str,
    period: int = Query(default=14, ge=2, le=500),
):
    raise HTTPException(status_code=400, detail="Use POST /momentum/calculate with include_signals=true")


@router.get("/divergence/{indicator}", response_model=list[DivergenceResponse])
def get_divergence(indicator: str):
    raise HTTPException(status_code=400, detail="Use POST /momentum/calculate with include_divergence=true")


@router.get("/cache-stats", response_model=CacheStatsResponse)
def get_cache_stats():
    service = _get_service()
    return service.get_cache_stats()


@router.post("/benchmark", response_model=BenchmarkResponse)
def benchmark_indicator(
    indicator: str,
    iterations: int = Query(default=1000, ge=1, le=10000),
):
    raise HTTPException(status_code=400, detail="Use POST /momentum/calculate for actual calculations")
