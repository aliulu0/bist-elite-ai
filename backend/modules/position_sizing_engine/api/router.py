from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException

from modules.position_sizing_engine.core.types import (
    InvestmentHorizon,
    PositionInput,
    PositionSizingRequest,
    ReportType,
    RiskProfile,
)
from modules.position_sizing_engine.schemas.schemas import (
    CacheStatsSchema,
    PositionCurrentResponse,
    PositionExposureResponse,
    PositionInputSchema,
    PositionReportResponse,
    PositionSizingRequestSchema,
    PositionSizingResultSchema,
    PositionSizingSchema,
    PortfolioExposureSchema,
    StopLossSchema,
    TakeProfitSchema,
)
from modules.position_sizing_engine.services.service import PositionSizingService

router = APIRouter(prefix="/position", tags=["Position Sizing Engine"])

_service: Optional[PositionSizingService] = None


def _get_service() -> PositionSizingService:
    global _service
    if _service is None:
        _service = PositionSizingService()
    return _service


def _convert_request(schema: PositionSizingRequestSchema) -> PositionSizingRequest:
    horizon = InvestmentHorizon(schema.horizon)
    risk_profile = RiskProfile(schema.risk_profile)
    positions = [
        PositionInput(
            symbol=p.symbol,
            sector=p.sector,
            elite_score=p.elite_score,
            confidence=p.confidence,
            risk=p.risk,
            liquidity=p.liquidity,
            avg_daily_volume=p.avg_daily_volume,
            atr=p.atr,
            volatility=p.volatility,
            beta=p.beta,
            market_regime=p.market_regime,
            sector_exposure=p.sector_exposure,
            correlation=p.correlation,
            agreement_score=p.agreement_score,
            price=p.price,
            metadata=p.metadata,
        )
        for p in schema.positions
    ]
    return PositionSizingRequest(
        reference_date=schema.reference_date,
        horizon=horizon,
        risk_profile=risk_profile,
        total_capital=schema.total_capital,
        positions=positions,
        sector_limits=schema.sector_limits,
        max_sector_exposure=schema.max_sector_exposure,
        max_correlation=schema.max_correlation,
        custom_params=schema.custom_params,
        metadata=schema.metadata,
    )


def _convert_stop_loss(sl: Any) -> Optional[StopLossSchema]:
    if sl is None:
        return None
    return StopLossSchema(
        symbol=sl.symbol,
        stop_loss_price=sl.stop_loss_price,
        stop_loss_pct=sl.stop_loss_pct,
        stop_loss_type=sl.stop_loss_type.value,
        atr_multiplier=sl.atr_multiplier,
        volatility_multiplier=sl.volatility_multiplier,
        explanation=sl.explanation,
    )


def _convert_take_profit(tp: Any) -> Optional[TakeProfitSchema]:
    if tp is None:
        return None
    return TakeProfitSchema(
        symbol=tp.symbol,
        primary_target=tp.primary_target,
        secondary_target=tp.secondary_target,
        risk_reward_ratio=tp.risk_reward_ratio,
        explanation=tp.explanation,
    )


def _convert_position_sizing(pos: Any) -> PositionSizingSchema:
    return PositionSizingSchema(
        symbol=pos.symbol,
        recommended_pct=pos.recommended_pct,
        min_pct=pos.min_pct,
        max_pct=pos.max_pct,
        portfolio_weight=pos.portfolio_weight,
        cash_allocation_pct=pos.cash_allocation_pct,
        position_grade=pos.position_grade.value,
        stop_loss=_convert_stop_loss(pos.stop_loss),
        take_profit=_convert_take_profit(pos.take_profit),
        explanation=pos.explanation,
        metadata=pos.metadata,
    )


def _convert_exposure(exp: Any) -> PortfolioExposureSchema:
    return PortfolioExposureSchema(
        sector_exposure=exp.sector_exposure,
        market_exposure=exp.market_exposure,
        total_risk_exposure=exp.total_risk_exposure,
        cash_ratio=exp.cash_ratio,
        concentration_risk=exp.concentration_risk,
        sector_count=exp.sector_count,
    )


def _convert_result(result: Any) -> PositionSizingResultSchema:
    positions = [_convert_position_sizing(p) for p in result.positions]
    exposure = _convert_exposure(result.exposure)
    request_schema = None
    if result.request:
        req = result.request
        request_schema = PositionSizingRequestSchema(
            reference_date=req.reference_date,
            horizon=req.horizon.value,
            risk_profile=req.risk_profile.value,
            total_capital=req.total_capital,
            positions=[
                PositionInputSchema(
                    symbol=p.symbol,
                    sector=p.sector,
                    elite_score=p.elite_score,
                    confidence=p.confidence,
                    risk=p.risk,
                    liquidity=p.liquidity,
                    avg_daily_volume=p.avg_daily_volume,
                    atr=p.atr,
                    volatility=p.volatility,
                    beta=p.beta,
                    market_regime=p.market_regime,
                    sector_exposure=p.sector_exposure,
                    correlation=p.correlation,
                    agreement_score=p.agreement_score,
                    price=p.price,
                    metadata=p.metadata,
                )
                for p in req.positions
            ],
            sector_limits=req.sector_limits,
            max_sector_exposure=req.max_sector_exposure,
            max_correlation=req.max_correlation,
            custom_params=req.custom_params,
            metadata=req.metadata,
        )
    return PositionSizingResultSchema(
        request=request_schema,
        positions=positions,
        exposure=exposure,
        execution_time_ms=result.execution_time_ms,
        metadata=result.metadata,
    )


@router.post("/calculate", response_model=PositionSizingResultSchema)
def calculate_position_sizing(
    request: PositionSizingRequestSchema,
) -> PositionSizingResultSchema:
    svc = _get_service()
    try:
        req = _convert_request(request)
        result = svc.calculate(req)
        return _convert_result(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Position sizing failed: {e}")


@router.get("/current", response_model=PositionCurrentResponse)
def get_current_result() -> PositionCurrentResponse:
    svc = _get_service()
    current = svc.get_current()
    if current is None:
        raise HTTPException(status_code=404, detail="No position sizing result available")
    return PositionCurrentResponse(
        result=_convert_result(current),
        execution_time_ms=current.execution_time_ms,
    )


@router.get("/report/{report_type}", response_model=PositionReportResponse)
def get_report(report_type: str) -> PositionReportResponse:
    svc = _get_service()
    try:
        rt = ReportType(report_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid report type: {report_type}")
    data = svc.generate_report(rt)
    return PositionReportResponse(
        report_type=report_type,
        data=data,
    )


@router.get("/exposure", response_model=PositionExposureResponse)
def get_exposure() -> PositionExposureResponse:
    svc = _get_service()
    exposure = svc.get_exposure()
    if exposure is None:
        raise HTTPException(status_code=404, detail="No exposure data available")
    return PositionExposureResponse(exposure=_convert_exposure(exposure))


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
