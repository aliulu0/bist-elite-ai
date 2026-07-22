from fastapi import APIRouter, Query, HTTPException

from modules.moving_average.services.ma_service import MAService
from modules.moving_average.schemas.ma_schemas import (
    MAResponse,
    CalculateRequest,
    CalculateMultipleRequest,
    CrossoverRequest,
    CrossoverResponse,
    AvailableTypesResponse,
    TimeframeListResponse,
    ValidateRequest,
    ValidateResponse,
)

router = APIRouter(prefix="/moving-average", tags=["moving-average"])


def _get_service() -> MAService:
    return MAService()


@router.get("/types", response_model=AvailableTypesResponse)
def get_available_types():
    service = _get_service()
    return service.get_available_types()


@router.post("/calculate", response_model=MAResponse)
def calculate_ma(request: CalculateRequest):
    service = _get_service()
    try:
        return service.calculate(
            ma_type=request.ma_type,
            period=request.period,
            prices=request.prices,
            include_slope=request.include_slope,
            include_distance=request.include_distance,
            include_trend=request.include_trend,
            include_signals=request.include_signals,
            include_smart_signals=request.include_smart_signals,
            include_scores=request.include_scores,
            fast_period=request.fast_period,
            slow_period=request.slow_period,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/calculate-multiple", response_model=list[MAResponse])
def calculate_multiple(request: CalculateMultipleRequest):
    service = _get_service()
    try:
        return service.calculate_multiple(
            ma_type=request.ma_type,
            periods=request.periods,
            prices=request.prices,
            include_slope=request.include_slope,
            include_distance=request.include_distance,
            include_trend=request.include_trend,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/crossovers", response_model=CrossoverResponse)
def calculate_crossovers(request: CrossoverRequest):
    service = _get_service()
    try:
        return service.calculate_crossovers(
            ma_type=request.ma_type,
            fast_period=request.fast_period,
            slow_period=request.slow_period,
            prices=request.prices,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/timeframes", response_model=TimeframeListResponse)
def get_timeframes(
    timeframe: str | None = Query(default=None, description="Base timeframe for higher/lower comparison"),
    uptrend_timeframes: list[str] | None = Query(default=None, description="Timeframes in uptrend for alignment score"),
):
    service = _get_service()
    return service.get_timeframes(timeframe=timeframe, uptrend_timeframes=uptrend_timeframes)


@router.post("/validate", response_model=ValidateResponse)
def validate_ma(request: ValidateRequest):
    service = _get_service()
    return service.validate(
        ma_type=request.ma_type,
        period=request.period,
        prices=request.prices,
    )
