from fastapi import APIRouter, HTTPException, Query

from modules.trend_engine.services.trend_service import TrendService
from modules.trend_engine.schemas.trend_schemas import (
    IndicatorResponse,
    SignalResponse,
    CalculateRequest,
    AvailableIndicatorsResponse,
    CacheStatsResponse,
    BenchmarkResponse,
    TrendResultResponse,
)

router = APIRouter(prefix="/trend", tags=["trend"])


def _get_service() -> TrendService:
    return TrendService()


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
            include_trend_analysis=request.include_trend_analysis,
            include_breakout=request.include_breakout,
            include_pullback=request.include_pullback,
            include_scoring=request.include_scoring,
            **request.params,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/supertrend", response_model=IndicatorResponse)
def get_supertrend(
    period: int = Query(default=10, ge=2, le=200),
    multiplier: float = Query(default=3.0, ge=0.5, le=10.0),
):
    raise HTTPException(status_code=400, detail="Use POST /trend/calculate with indicator=supertrend")


@router.get("/ichimoku", response_model=IndicatorResponse)
def get_ichimoku():
    raise HTTPException(status_code=400, detail="Use POST /trend/calculate with indicator=ichimoku")


@router.get("/bollinger", response_model=IndicatorResponse)
def get_bollinger():
    raise HTTPException(status_code=400, detail="Use POST /trend/calculate with indicator=bollinger")


@router.get("/donchian", response_model=IndicatorResponse)
def get_donchian():
    raise HTTPException(status_code=400, detail="Use POST /trend/calculate with indicator=donchian")


@router.get("/parabolic", response_model=IndicatorResponse)
def get_parabolic():
    raise HTTPException(status_code=400, detail="Use POST /trend/calculate with indicator=parabolic_sar")


@router.get("/signals/{indicator}", response_model=list[SignalResponse])
def get_signals(indicator: str):
    raise HTTPException(status_code=400, detail="Use POST /trend/calculate with include_signals=true")


@router.get("/breakout", response_model=IndicatorResponse)
def get_breakout():
    raise HTTPException(status_code=400, detail="Use POST /trend/calculate with include_breakout=true")


@router.get("/cache-stats", response_model=CacheStatsResponse)
def get_cache_stats():
    service = _get_service()
    return service.get_cache_stats()


@router.post("/benchmark", response_model=BenchmarkResponse)
def benchmark_indicator(
    indicator: str,
    iterations: int = Query(default=1000, ge=1, le=10000),
):
    raise HTTPException(status_code=400, detail="Use POST /trend/calculate for actual calculations")
