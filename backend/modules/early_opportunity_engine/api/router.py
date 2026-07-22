from fastapi import APIRouter, HTTPException, Query

from modules.early_opportunity_engine.schemas.opportunity_schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    BatchAnalyzeRequest,
    BatchAnalyzeResponse,
    OpportunityListResponse,
    OpportunityDetailResponse,
    OpportunityHistoryResponse,
    OpportunitySummaryResponse,
    ValidateRequest,
    ValidateResponse,
    CacheStatsResponse,
)
from modules.early_opportunity_engine.services.opportunity_service import OpportunityService


router = APIRouter(prefix="/api/v1/opportunity", tags=["opportunity"])

_service: OpportunityService | None = None


def _get_service() -> OpportunityService:
    global _service
    if _service is None:
        _service = OpportunityService()
    return _service


@router.get("/top", response_model=OpportunityListResponse)
async def get_top_opportunities(
    limit: int = Query(default=50, ge=1, le=500),
    min_score: float = Query(default=0.0, ge=0, le=100),
):
    svc = _get_service()
    return svc.get_top([], limit=limit, min_score=min_score)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_symbol(request: AnalyzeRequest):
    svc = _get_service()
    try:
        return svc.analyze(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", response_model=BatchAnalyzeResponse)
async def batch_analyze(request: BatchAnalyzeRequest):
    svc = _get_service()
    try:
        return svc.batch_analyze(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=OpportunityHistoryResponse)
async def get_history(
    limit: int = Query(default=100, ge=1, le=1000),
    symbol: str | None = Query(default=None),
):
    svc = _get_service()
    return svc.get_history(limit=limit, symbol=symbol)


@router.post("/validate", response_model=ValidateResponse)
async def validate_metrics(request: ValidateRequest):
    svc = _get_service()
    return svc.validate(request)


@router.get("/cache/stats", response_model=CacheStatsResponse)
async def get_cache_stats():
    svc = _get_service()
    return svc.cache_stats()


@router.post("/cache/clear")
async def clear_cache():
    svc = _get_service()
    count = svc.clear_cache()
    return {"cleared": count, "message": "Cache cleared"}


@router.get("/summary", response_model=OpportunitySummaryResponse)
async def get_summary():
    svc = _get_service()
    return svc.get_summary([])
