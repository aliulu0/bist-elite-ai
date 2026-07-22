from fastapi import APIRouter, HTTPException, Query
from modules.scoring_engine.schemas.schemas import (
    CalculateScoreRequest, ScoreResultResponse, ScoreDetailResponse,
    ScoreListResponse, ScoreHistoryResponse, WeightsResponse,
    ProfilesResponse, ProfileCreateRequest, CacheStatsResponse,
    BenchmarkResponse, OptimizationRequest, OptimizationResponse,
    ValidateRequest, ValidateResponse,
)
from modules.scoring_engine.services.service import ScoringService


router = APIRouter(prefix="/api/v1/scoring", tags=["scoring"])

_service: ScoringService | None = None


def _get_service() -> ScoringService:
    global _service
    if _service is None:
        _service = ScoringService()
    return _service


@router.post("/calculate", response_model=ScoreResultResponse)
async def calculate_score(request: CalculateScoreRequest):
    svc = _get_service()
    try:
        return svc.calculate(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list", response_model=list[ScoreListResponse])
async def get_score_list(
    symbols: str = Query(..., description="Comma-separated symbols"),
    profile: str = Query(default="balanced"),
    horizon: str = Query(default="one_month"),
    regime: str = Query(default="sideways"),
):
    svc = _get_service()
    symbol_list = [s.strip() for s in symbols.split(",") if s.strip()]
    return svc.get_list(symbol_list, profile, horizon, regime)


@router.get("/details", response_model=ScoreDetailResponse)
async def get_score_details(
    symbol: str = Query(...),
    score_type: str = Query(...),
    metrics: str = Query(default="{}"),
    profile: str = Query(default="balanced"),
    horizon: str = Query(default="one_month"),
    regime: str = Query(default="sideways"),
):
    import json
    svc = _get_service()
    try:
        metrics_dict = json.loads(metrics)
    except json.JSONDecodeError:
        metrics_dict = {}
    return svc.get_details(symbol, score_type, metrics_dict, profile, horizon, regime)


@router.get("/history", response_model=ScoreHistoryResponse)
async def get_score_history(
    symbol: str = Query(...),
    limit: int = Query(default=100, ge=1, le=1000),
):
    svc = _get_service()
    return svc.get_history(symbol, limit=limit)


@router.get("/weights", response_model=WeightsResponse)
async def get_weights(
    profile: str = Query(default="balanced"),
    horizon: str = Query(default="one_month"),
    regime: str = Query(default="sideways"),
):
    svc = _get_service()
    return svc.get_weights(profile, horizon, regime)


@router.get("/profiles", response_model=ProfilesResponse)
async def get_profiles():
    svc = _get_service()
    return svc.get_profiles()


@router.post("/profile")
async def create_profile(request: ProfileCreateRequest):
    from modules.scoring_engine.profiles.manager import get_profile_manager
    from modules.scoring_engine.core.types import ScoringProfile, WeightProfile as WP
    mgr = get_profile_manager()
    try:
        wp = WP(request.profile)
    except ValueError:
        wp = WP.BALANCED
    profile = ScoringProfile(
        name=request.name, profile=wp,
        description=request.description, is_active=True,
    )
    mgr.register_profile(profile)
    return {"message": f"Profile '{request.name}' created", "name": request.name}


@router.post("/optimize", response_model=OptimizationResponse)
async def optimize_weights(request: OptimizationRequest):
    svc = _get_service()
    return svc.optimize(request)


@router.post("/validate", response_model=ValidateResponse)
async def validate_input(request: ValidateRequest):
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
    from modules.scoring_engine.benchmark.benchmark import ScoringBenchmark
    from modules.scoring_engine.calculators.financial_calculators import FinancialScoreCalculator
    bench = ScoringBenchmark()
    calc = FinancialScoreCalculator()
    def fn():
        calc.calculate("TEST", {"pe_ratio": 15.0, "roe": 12.0})
    result = bench.run(fn, iterations=iterations)
    return BenchmarkResponse(
        iterations=result.iterations, avg_ms=result.avg_ms,
        ops_per_second=result.ops_per_second, total_seconds=result.total_seconds,
        memory_bytes=result.memory_bytes, summary=bench.get_summary(),
    )
