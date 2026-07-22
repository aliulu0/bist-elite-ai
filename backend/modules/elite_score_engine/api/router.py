from __future__ import annotations

from typing import Dict, Any

from fastapi import APIRouter, HTTPException

from modules.elite_score_engine.schemas.schemas import (
    CalculateEliteRequest,
    EliteScoreResponse,
    DimensionContributionResponse,
    BonusResponse,
    PenaltyResponse,
    EliteListRequest,
    EliteListResponse,
    EliteTopRequest,
    EliteRankingResponse,
    EliteRankingEntryResponse,
    EliteHistoryResponse,
    EliteDetailsResponse,
    ProfileResponse,
    ProfileListResponse,
    CacheStatsResponse,
    BenchmarkRequest,
    BenchmarkResponse,
    ValidateRequest,
    ValidateResponse,
)
from modules.elite_score_engine.services.service import EliteScoreService
from modules.elite_score_engine.core.types import (
    InvestmentHorizon,
    MarketRegime,
    SectorType,
    RankingPeriod,
    EliteCalculationRequest,
)

router = APIRouter(prefix="/api/v1/elite-score", tags=["Elite Score"])

_service = EliteScoreService()


def _parse_horizon(h: str) -> InvestmentHorizon:
    try:
        return InvestmentHorizon(h)
    except ValueError:
        return InvestmentHorizon.ONE_MONTH


def _parse_regime(r: str) -> MarketRegime:
    try:
        return MarketRegime(r)
    except ValueError:
        return MarketRegime.SIDEWAYS


def _parse_sector(s: str) -> SectorType:
    try:
        return SectorType(s)
    except ValueError:
        return SectorType.OTHER


def _parse_period(p: str) -> RankingPeriod:
    try:
        return RankingPeriod(p)
    except ValueError:
        return RankingPeriod.DAILY


def _to_response(result) -> EliteScoreResponse:
    dim_resp: Dict[str, DimensionContributionResponse] = {}
    for dim, contrib in result.dimension_contributions.items():
        dim_resp[dim.value] = DimensionContributionResponse(
            dimension=dim.value,
            raw_score=contrib.raw_score,
            normalized_score=contrib.normalized_score,
            weighted_score=contrib.weighted_score,
            contribution=contrib.contribution,
            direction=contrib.direction.value,
            weight=contrib.weight,
            confidence=contrib.confidence,
            evidence_count=contrib.evidence_count,
        )

    bonuses = [
        BonusResponse(
            factor=b.factor.value,
            points=b.points,
            condition=b.condition,
            applied_count=b.applied_count,
        )
        for b in result.bonuses
    ]

    penalties = [
        PenaltyResponse(
            factor=p.factor.value,
            points=p.points,
            condition=p.condition,
            applied_count=p.applied_count,
        )
        for p in result.penalties
    ]

    return EliteScoreResponse(
        symbol=result.symbol,
        elite_score=result.elite_score,
        elite_category=result.elite_category.value,
        label=result.label.value,
        dimension_contributions=dim_resp,
        bonuses=bonuses,
        penalties=penalties,
        raw_score=result.raw_score,
        total_weight=result.total_weight,
        confidence=result.confidence,
        evidence_count=result.evidence_count,
        horizon=result.horizon.value,
        regime=result.regime.value,
        sector=result.sector.value,
        calculated_at=result.calculated_at.isoformat(),
        calculation_id=result.calculation_id,
    )


@router.post("/calculate", response_model=EliteScoreResponse)
def calculate_elite_score(request: CalculateEliteRequest) -> EliteScoreResponse:
    horizon = _parse_horizon(request.horizon)
    regime = _parse_regime(request.regime)
    sector = _parse_sector(request.sector)

    dim_scores: Dict[str, float] = {}
    for k, v in request.dimension_scores.items():
        dim_scores[k] = v

    calc_request = EliteCalculationRequest(
        symbol=request.symbol,
        scores=request.scores,
        dimension_scores=dim_scores,
        breakdowns=request.breakdowns,
        profile_name=request.profile_name,
        horizon=horizon,
        regime=regime,
        sector=sector,
    )
    result = _service.calculate(calc_request)
    return _to_response(result)


@router.post("/list", response_model=EliteListResponse)
def list_elite_scores(request: EliteListRequest) -> EliteListResponse:
    horizon = _parse_horizon(request.horizon)
    regime = _parse_regime(request.regime)
    sector = _parse_sector(request.sector)

    results = _service.calculate_list(
        symbols=request.symbols,
        scores_map=request.scores,
        profile_name=request.profile_name,
        horizon=horizon,
        regime=regime,
        sector=sector,
    )
    return EliteListResponse(
        results=[_to_response(r) for r in results],
        count=len(results),
        total_requested=len(request.symbols),
    )


@router.get("/top")
def get_top_scores(
    n: int = 10,
    horizon: str = "one_month",
    regime: str = "sideways",
    sector: str = None,
) -> Dict[str, Any]:
    h = _parse_horizon(horizon)
    entries = _service.get_top_n(n=n, horizon=h)
    return {
        "entries": [
            {
                "symbol": e.symbol,
                "elite_score": e.elite_score,
                "elite_category": e.elite_category.value,
                "label": e.label.value,
                "rank": e.rank,
                "previous_rank": e.previous_rank,
                "rank_change": e.rank_change,
                "trend": e.trend.value,
                "sector": e.sector.value,
                "horizon": e.horizon.value,
                "period": e.period.value,
                "calculated_at": e.calculated_at.isoformat(),
            }
            for e in entries
        ],
        "count": len(entries),
    }


@router.get("/details")
def get_details(symbol: str) -> Dict[str, Any]:
    details = _service.get_details(symbol)
    if details is None:
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")
    trend_val = details["trend"]
    ranking = details["ranking"]
    return {
        "symbol": symbol,
        "trend": trend_val.value if trend_val else None,
        "ranking": {
            "symbol": ranking.symbol,
            "elite_score": ranking.elite_score,
            "elite_category": ranking.elite_category.value,
            "label": ranking.label.value,
            "rank": ranking.rank,
            "previous_rank": ranking.previous_rank,
            "rank_change": ranking.rank_change,
            "trend": ranking.trend.value,
            "sector": ranking.sector.value,
            "horizon": ranking.horizon.value,
            "period": ranking.period.value,
            "calculated_at": ranking.calculated_at.isoformat(),
        } if ranking else None,
        "history_count": details["history_count"],
    }


@router.get("/history")
def get_history(
    symbol: str,
    horizon: str = "one_month",
    limit: int = 30,
) -> Dict[str, Any]:
    h = _parse_horizon(horizon)
    history = _service.get_history(symbol, h, limit)
    return {
        "symbol": symbol,
        "history": [
            {
                "symbol": he.symbol,
                "elite_score": he.elite_score,
                "elite_category": he.elite_category.value,
                "label": he.label.value,
                "ranking": he.ranking,
                "horizon": he.horizon.value,
                "calculated_at": he.calculated_at.isoformat(),
                "delta": he.delta,
                "trend": he.trend.value,
            }
            for he in history
        ],
        "count": len(history),
    }


@router.get("/ranking")
def get_ranking(
    horizon: str = "one_month",
    period: str = "daily",
    limit: int = 50,
) -> Dict[str, Any]:
    h = _parse_horizon(horizon)
    p = _parse_period(period)
    entries = _service.get_ranking(h, p, limit)
    return {
        "entries": [
            {
                "symbol": e.symbol,
                "elite_score": e.elite_score,
                "elite_category": e.elite_category.value,
                "label": e.label.value,
                "rank": e.rank,
                "previous_rank": e.previous_rank,
                "rank_change": e.rank_change,
                "trend": e.trend.value,
                "sector": e.sector.value,
                "horizon": e.horizon.value,
                "period": e.period.value,
                "calculated_at": e.calculated_at.isoformat(),
            }
            for e in entries
        ],
        "count": len(entries),
    }


@router.get("/profiles")
def get_profiles() -> Dict[str, Any]:
    profiles = _service.get_profiles()
    return {
        "profiles": [
            {
                "name": p.name,
                "description": p.description,
                "dimensions": {d.value: dw.weight for d, dw in p.dimension_weights.items()},
                "bonus_count": len(p.bonus_rules),
                "penalty_count": len(p.penalty_rules),
                "is_active": p.is_active,
            }
            for p in profiles.values()
        ],
        "count": len(profiles),
    }


@router.get("/weights")
def get_weights(
    profile_name: str = "balanced",
    horizon: str = "one_month",
    regime: str = "sideways",
    sector: str = "other",
) -> Dict[str, Any]:
    h = _parse_horizon(horizon)
    r = _parse_regime(regime)
    s = _parse_sector(sector)
    config = _service.get_weight_config(profile_name, h, r, s)
    return {
        "profile_name": config.profile_name,
        "horizon": config.horizon.value,
        "regime": config.regime.value,
        "sector": config.sector.value,
        "dimensions": {
            dim.value: {"weight": dw.weight, "direction": dw.direction.value}
            for dim, dw in config.dimensions.items()
        },
        "bonus_rules": [
            {"factor": br.factor.value, "points": br.points, "condition": br.condition}
            for br in config.bonus_rules
        ],
        "penalty_rules": [
            {"factor": pr.factor.value, "points": pr.points, "condition": pr.condition}
            for pr in config.penalty_rules
        ],
        "total_weight": config.total_weight,
    }


@router.post("/validate")
def validate(request: ValidateRequest) -> Dict[str, Any]:
    from modules.elite_score_engine.core.types import ScoringDimension

    dim_scores = None
    if request.dimension_scores:
        dim_scores = {}
        for k, v in request.dimension_scores.items():
            try:
                dim_scores[ScoringDimension(k)] = v
            except ValueError:
                pass

    errors = _service.validate(
        scores=request.scores,
        dimension_scores=dim_scores,
    )
    return {"is_valid": len(errors) == 0, "errors": errors}


@router.get("/cache/stats")
def cache_stats() -> Dict[str, Any]:
    return _service.cache_stats()


@router.post("/cache/clear")
def clear_cache() -> Dict[str, int]:
    cleared = _service.clear_cache()
    return {"cleared": cleared}


@router.post("/benchmark")
def run_benchmark(request: BenchmarkRequest) -> Dict[str, Any]:
    horizon = _parse_horizon(request.horizon)
    regime = _parse_regime(request.regime)
    sector = _parse_sector(request.sector)
    result = _service.run_benchmark(
        iterations=request.iterations,
        warmup=request.warmup,
        symbol=request.symbol,
        profile_name=request.profile_name,
        horizon=horizon,
        regime=regime,
        sector=sector,
    )
    return {
        "operation": result.operation,
        "execution_time_ms": result.execution_time_ms,
        "memory_mb": result.memory_mb,
        "iterations": result.iterations,
        "avg_time_ms": result.avg_time_ms,
        "min_time_ms": result.min_time_ms,
        "max_time_ms": result.max_time_ms,
        "p95_time_ms": result.p95_time_ms,
        "success": result.success,
        "error_message": result.error_message,
    }
