from fastapi import APIRouter, HTTPException, Query

from modules.volume_engine.services.volume_service import VolumeService
from modules.volume_engine.schemas.volume_schemas import (
    IndicatorResponse,
    SignalResponse,
    SmartMoneyResponse,
    LiquidityResponse,
    InstitutionalScoreResponse,
    CalculateRequest,
    AvailableIndicatorsResponse,
    CacheStatsResponse,
    BenchmarkResponse,
)

router = APIRouter(prefix="/volume", tags=["volume"])


def _get_service() -> VolumeService:
    return VolumeService()


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
            include_smart_money=request.include_smart_money,
            include_liquidity=request.include_liquidity,
            include_scoring=request.include_scoring,
            **request.params,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/obv", response_model=IndicatorResponse)
def get_obv():
    raise HTTPException(status_code=400, detail="Use POST /volume/calculate with indicator=obv")


@router.post("/cmf", response_model=IndicatorResponse)
def get_cmf():
    raise HTTPException(status_code=400, detail="Use POST /volume/calculate with indicator=cmf")


@router.post("/mfi", response_model=IndicatorResponse)
def get_mfi():
    raise HTTPException(status_code=400, detail="Use POST /volume/calculate with indicator=mfi")


@router.post("/vwap", response_model=IndicatorResponse)
def get_vwap():
    raise HTTPException(status_code=400, detail="Use POST /volume/calculate with indicator=vwap")


@router.post("/rvol", response_model=IndicatorResponse)
def get_rvol():
    raise HTTPException(status_code=400, detail="Use POST /volume/calculate with indicator=rvol")


@router.post("/liquidity", response_model=LiquidityResponse)
def get_liquidity():
    raise HTTPException(status_code=400, detail="Use POST /volume/calculate with include_liquidity=true")


@router.post("/smart-money", response_model=SmartMoneyResponse)
def get_smart_money():
    raise HTTPException(status_code=400, detail="Use POST /volume/calculate with include_smart_money=true")


@router.get("/signals/{indicator}", response_model=list[SignalResponse])
def get_signals(indicator: str):
    raise HTTPException(status_code=400, detail="Use POST /volume/calculate with include_signals=true")


@router.get("/cache-stats", response_model=CacheStatsResponse)
def get_cache_stats():
    service = _get_service()
    return service.get_cache_stats()


@router.post("/benchmark", response_model=BenchmarkResponse)
def benchmark_indicator(
    indicator: str,
    iterations: int = Query(default=1000, ge=1, le=10000),
):
    raise HTTPException(status_code=400, detail="Use POST /volume/calculate for actual calculations")
