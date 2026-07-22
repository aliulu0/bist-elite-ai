from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from modules.market_regime_engine.core.types import (
    DetectionSignal,
    InvestmentHorizon,
    MarketRegime,
    RegimeAnalysisRequest,
    ReportType,
)
from modules.market_regime_engine.schemas.schemas import (
    CacheStatsSchema,
    RegimeAnalysisRequestSchema,
    RegimeAnalysisResultSchema,
    RegimeClassificationSchema,
    RegimeCurrentResponse,
    RegimeHistoryEntrySchema,
    RegimeHistoryResponse,
    RegimeReportResponse,
    RegimeSectorsResponse,
    RegimeTransitionsResponse,
    RegimeTransitionSchema,
    SectorAnalysisSchema,
)
from modules.market_regime_engine.services.service import MarketRegimeService

router = APIRouter(prefix="/market-regime", tags=["Market Regime Engine"])

_service: Optional[MarketRegimeService] = None


def _get_service() -> MarketRegimeService:
    global _service
    if _service is None:
        _service = MarketRegimeService()
    return _service


def _convert_request(schema: RegimeAnalysisRequestSchema) -> RegimeAnalysisRequest:
    signals = [DetectionSignal(s) for s in schema.signals] if schema.signals else []
    horizon = InvestmentHorizon(schema.horizon)
    return RegimeAnalysisRequest(
        reference_date=schema.reference_date,
        horizon=horizon,
        signals=signals,
        market_data=schema.market_data,
        sector_data=schema.sector_data,
        lookback_days=schema.lookback_days,
        min_confidence=schema.min_confidence,
        include_transitions=schema.include_transitions,
        include_sectors=schema.include_sectors,
        seed=schema.seed,
        metadata=schema.metadata,
    )


def _convert_result(result: Any) -> RegimeAnalysisResultSchema:
    c = result.classification
    classification_schema = RegimeClassificationSchema(
        regime=c.regime.value,
        confidence=c.confidence,
        score=c.score,
        stability=c.stability,
        transition_probabilities=c.transition_probabilities,
        contributing_signals=c.contributing_signals,
    )

    sectors_schema = [
        SectorAnalysisSchema(
            sector_name=s.sector_name,
            strength=s.strength.value,
            score=s.score,
            relative_performance=s.relative_performance,
            momentum=s.momentum,
            volume_trend=s.volume_trend,
        )
        for s in result.sectors
    ]

    transitions_schema = [
        RegimeTransitionSchema(
            from_regime=t.from_regime.value,
            to_regime=t.to_regime.value,
            transition_type=t.transition_type.value,
            probability=t.probability,
        )
        for t in result.transitions
    ]

    history_schema = [
        RegimeHistoryEntrySchema(
            date=h.date,
            regime=h.regime.value,
            confidence=h.confidence,
            score=h.score,
            stability=h.stability,
            duration_days=h.duration_days,
        )
        for h in result.history
    ]

    next_pred_schema = None
    if result.next_regime_prediction:
        np = result.next_regime_prediction
        next_pred_schema = RegimeClassificationSchema(
            regime=np.regime.value,
            confidence=np.confidence,
            score=np.score,
            stability=np.stability,
        )

    return RegimeAnalysisResultSchema(
        reference_date=result.request.reference_date,
        classification=classification_schema,
        sectors=sectors_schema,
        transitions=transitions_schema,
        history=history_schema,
        strategy_profile=result.strategy_profile.value,
        risk_implications=result.risk_implications,
        next_regime_prediction=next_pred_schema,
        execution_time_ms=result.execution_time_ms,
    )


@router.post("/analyze", response_model=RegimeAnalysisResultSchema)
def analyze_regime(request: RegimeAnalysisRequestSchema) -> RegimeAnalysisResultSchema:
    svc = _get_service()
    try:
        req = _convert_request(request)
        result = svc.analyze(req)
        return _convert_result(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")


@router.get("/current", response_model=RegimeCurrentResponse)
def get_current_regime() -> RegimeCurrentResponse:
    svc = _get_service()
    result = svc.get_current()
    if result is None:
        raise HTTPException(status_code=404, detail="No regime analysis available")
    c = result.classification
    from modules.market_regime_engine.core.types import get_risk_level
    return RegimeCurrentResponse(
        regime=c.regime.value,
        confidence=c.confidence,
        score=c.score,
        stability=c.stability,
        strategy_profile=result.strategy_profile.value,
        risk_level=get_risk_level(c.regime),
        contributing_signals=c.contributing_signals,
        reference_date=result.request.reference_date,
    )


@router.get("/history", response_model=RegimeHistoryResponse)
def get_history() -> RegimeHistoryResponse:
    svc = _get_service()
    history = svc.get_history()
    entries = [
        RegimeHistoryEntrySchema(
            date=h["date"],
            regime=h["regime"],
            confidence=h["confidence"],
            score=h["score"],
            duration_days=h["duration_days"],
        )
        for h in history
    ]
    return RegimeHistoryResponse(history=entries, total_entries=len(entries))


@router.get("/sectors", response_model=RegimeSectorsResponse)
def get_sectors() -> RegimeSectorsResponse:
    svc = _get_service()
    sectors = svc.get_sectors()
    sector_schemas = [
        SectorAnalysisSchema(
            sector_name=s["sector"],
            strength=s["strength"],
            score=s["score"],
            relative_performance=s["relative_performance"],
            momentum=s["momentum"],
        )
        for s in sectors
    ]
    leading = [s["sector"] for s in sectors if s["strength"] == "leading"]
    weak = [s["sector"] for s in sectors if s["strength"] == "weak"]
    return RegimeSectorsResponse(
        sectors=sector_schemas,
        leading_sectors=leading,
        weak_sectors=weak,
    )


@router.get("/transitions", response_model=RegimeTransitionsResponse)
def get_transitions() -> RegimeTransitionsResponse:
    svc = _get_service()
    data = svc.get_transitions()
    transitions = [
        RegimeTransitionSchema(
            from_regime=t["from"],
            to_regime=t["to"],
            probability=t["probability"],
        )
        for t in data.get("transitions", [])
    ]
    return RegimeTransitionsResponse(
        transitions=transitions,
        current_regime=data.get("current_regime", ""),
        predicted_next=data.get("predicted_next"),
    )


@router.get("/report/{report_type}", response_model=Dict[str, Any])
def get_report(report_type: str) -> Dict[str, Any]:
    svc = _get_service()
    try:
        rt = ReportType(report_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid report type: {report_type}")
    return svc.generate_report(rt)


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
