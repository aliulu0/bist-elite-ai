from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException

from modules.multi_factor_engine.core.types import (
    FactorAnalysisRequest,
    FactorGroup,
    FactorName,
    InvestmentHorizon,
    MarketRegime,
    ReportType,
)
from modules.multi_factor_engine.schemas.schemas import (
    CacheStatsSchema,
    FactorAnalysisRequestSchema,
    FactorAnalysisResultSchema,
    FactorDetailsResponse,
    FactorHistoryResponse,
    FactorListResponse,
    FactorProfileSchema,
    FactorRankingSchema,
    FactorScoreSchema,
    GroupScoreSchema,
)
from modules.multi_factor_engine.services.service import MultiFactorService

router = APIRouter(prefix="/factors", tags=["Multi-Factor Engine"])

_service: Optional[MultiFactorService] = None


def _get_service() -> MultiFactorService:
    global _service
    if _service is None:
        _service = MultiFactorService()
    return _service


def _convert_request(schema: FactorAnalysisRequestSchema) -> FactorAnalysisRequest:
    horizon = InvestmentHorizon(schema.horizon)
    regime = MarketRegime(schema.regime) if schema.regime else None
    factors = [FactorName(f) for f in schema.factors] if schema.factors else None
    return FactorAnalysisRequest(
        symbol=schema.symbol,
        reference_date=schema.reference_date,
        horizon=horizon,
        regime=regime,
        sector=schema.sector,
        factors=factors,
        market_data=schema.market_data,
        financial_data=schema.financial_data,
        indicator_data=schema.indicator_data,
        sector_data=schema.sector_data,
        include_history=schema.include_history,
        include_ranking=schema.include_ranking,
        include_profile=schema.include_profile,
        seed=schema.seed,
        metadata=schema.metadata,
    )


def _convert_result(result: Any) -> FactorAnalysisResultSchema:
    profile_schema = None
    if result.profile:
        p = result.profile
        group_schemas = [
            GroupScoreSchema(
                group=gs.group.value,
                score=gs.score,
                weight=gs.weight,
                strength=gs.strength.value if hasattr(gs.strength, "value") else str(gs.strength),
                rank=gs.rank,
                factors=[
                    FactorScoreSchema(
                        factor=f.factor.value,
                        score=f.score,
                        weight=f.weight,
                        contribution=f.contribution,
                        strength=f.strength.value if hasattr(f.strength, "value") else str(f.strength),
                        raw_value=f.raw_value,
                        normalized_value=f.normalized_value,
                        metadata=f.metadata,
                    )
                    for f in gs.factors
                ],
            )
            for gs in p.group_scores
        ]
        factor_schemas = [
            FactorScoreSchema(
                factor=fs.factor.value,
                score=fs.score,
                weight=fs.weight,
                strength=fs.strength.value if hasattr(fs.strength, "value") else str(fs.strength),
                raw_value=fs.raw_value,
            )
            for fs in p.factor_scores
        ]
        profile_schema = FactorProfileSchema(
            symbol=p.symbol,
            reference_date=p.reference_date,
            overall_score=p.overall_score,
            overall_strength=p.overall_strength.value if hasattr(p.overall_strength, "value") else str(p.overall_strength),
            group_scores=group_schemas,
            factor_scores=factor_schemas,
            radar_data=p.radar_data,
            strengths=p.strengths,
            weaknesses=p.weaknesses,
            top_factors=p.top_factors,
            bottom_factors=p.bottom_factors,
            horizon=p.horizon.value,
            regime=p.regime.value if p.regime else None,
            sector=p.sector,
        )

    ranking_schema = None
    if result.ranking:
        r = result.ranking
        ranking_schema = FactorRankingSchema(
            symbol=r.symbol,
            overall_rank=r.overall_rank,
            group_ranks=r.group_ranks,
            factor_ranks=r.factor_ranks,
            strength_factors=r.strength_factors,
            weakness_factors=r.weakness_factors,
            percentile=r.percentile,
        )

    return FactorAnalysisResultSchema(
        symbol=result.request.symbol,
        reference_date=result.request.reference_date,
        profile=profile_schema,
        ranking=ranking_schema,
        execution_time_ms=result.execution_time_ms,
        metadata=result.metadata,
    )


@router.post("/analyze", response_model=FactorAnalysisResultSchema)
def analyze_factors(request: FactorAnalysisRequestSchema) -> FactorAnalysisResultSchema:
    svc = _get_service()
    try:
        req = _convert_request(request)
        result = svc.analyze(req)
        return _convert_result(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")


@router.get("/list", response_model=FactorListResponse)
def get_factor_list() -> FactorListResponse:
    svc = _get_service()
    data = svc.get_factor_list()
    return FactorListResponse(**data)


@router.get("/details/{group_name}", response_model=FactorDetailsResponse)
def get_factor_details(group_name: str) -> FactorDetailsResponse:
    svc = _get_service()
    try:
        data = svc.get_factor_details(group_name)
        return FactorDetailsResponse(**data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/history/{symbol}", response_model=FactorHistoryResponse)
def get_factor_history(symbol: str) -> FactorHistoryResponse:
    svc = _get_service()
    history = svc.get_history(symbol)
    return FactorHistoryResponse(
        symbol=symbol,
        entries=history,
        total_entries=len(history),
    )


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


@router.get("/report/{report_type}")
def get_report(report_type: str, symbol: str = "") -> Dict[str, Any]:
    svc = _get_service()
    try:
        rt = ReportType(report_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid report type: {report_type}")
    return svc.generate_report(rt, symbol)
