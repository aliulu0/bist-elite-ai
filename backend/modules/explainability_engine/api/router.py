from fastapi import APIRouter, HTTPException, Query

from modules.explainability_engine.schemas.schemas import (
    GenerateExplanationRequest, GenerateComprehensiveRequest,
    ExplanationSummaryResponse, ExplanationDetailResponse,
    ExplanationHistoryResponse, ValidateExplanationRequest,
    ValidateExplanationResponse, CacheStatsResponse, BenchmarkResponse,
    ExplanationListResponse,
)
from modules.explainability_engine.services.service import ExplanationService


router = APIRouter(prefix="/api/v1/explainability", tags=["explainability"])

_service: ExplanationService | None = None


def _get_service() -> ExplanationService:
    global _service
    if _service is None:
        _service = ExplanationService()
    return _service


@router.post("/generate", response_model=ExplanationDetailResponse)
async def generate_explanation(request: GenerateExplanationRequest):
    svc = _get_service()
    try:
        return svc.generate(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/comprehensive", response_model=ExplanationDetailResponse)
async def generate_comprehensive(request: GenerateComprehensiveRequest):
    svc = _get_service()
    try:
        return svc.generate_comprehensive(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary", response_model=ExplanationSummaryResponse)
async def get_summary(
    symbol: str = Query(...),
    metrics: str = Query(default="{}"),
    explanation_type: str = Query(default="elite_score"),
):
    import json
    svc = _get_service()
    try:
        metrics_dict = json.loads(metrics)
    except json.JSONDecodeError:
        metrics_dict = {}
    return svc.get_summary(symbol, metrics_dict, explanation_type)


@router.get("/history", response_model=ExplanationHistoryResponse)
async def get_history(limit: int = Query(default=100, ge=1, le=1000)):
    svc = _get_service()
    return svc.get_history(limit=limit)


@router.post("/validate", response_model=ValidateExplanationResponse)
async def validate_explanation(request: ValidateExplanationRequest):
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


@router.post("/benchmark", response_model=BenchmarkResponse)
async def run_benchmark(iterations: int = Query(default=100, ge=10, le=1000)):
    svc = _get_service()
    return svc.run_benchmark(iterations=iterations)


@router.get("/templates")
async def get_templates():
    svc = _get_service()
    return {"templates": svc.get_templates()}


@router.get("/localization/keys")
async def get_localization_keys(language: str = Query(default="en")):
    svc = _get_service()
    return {"language": language, "keys": svc.get_localization_keys(language)}
