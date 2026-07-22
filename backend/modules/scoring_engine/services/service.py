from __future__ import annotations

import time
from modules.scoring_engine.core.types import (
    ScoreType, WeightProfile, InvestmentHorizon, MarketRegime, ScoringMethod,
    ScoreResult, ScoreBreakdown, ScoreWeight, WeightConfig,
)
from modules.scoring_engine.weights.manager import get_weight_manager
from modules.scoring_engine.calculators.base import BaseScoreCalculator
from modules.scoring_engine.calculators.financial_calculators import (
    FinancialScoreCalculator, ValueScoreCalculator, GrowthScoreCalculator,
    QualityScoreCalculator, RiskScoreCalculator, LiquidityScoreCalculator,
)
from modules.scoring_engine.calculators.technical_calculators import (
    TechnicalScoreCalculator, MomentumScoreCalculator, TrendScoreCalculator,
    VolumeScoreCalculator, SmartMoneyScoreCalculator, PatternScoreCalculator,
    TimingScoreCalculator, SectorStrengthScoreCalculator, ProbabilityScoreCalculator,
    CompositeScoreCalculator,
)
from modules.scoring_engine.optimizers.optimizer import WeightOptimizer
from modules.scoring_engine.validators.validator import ScoringValidator
from modules.scoring_engine.cache.cache import get_cache
from modules.scoring_engine.schemas.schemas import (
    CalculateScoreRequest, ScoreResultResponse, ScoreBreakdownSchema,
    ScoreDetailResponse, ScoreListResponse, ScoreHistoryEntry, ScoreHistoryResponse,
    WeightInfo, WeightsResponse, ProfileInfo, ProfilesResponse, ProfileCreateRequest,
    CacheStatsResponse, BenchmarkResponse, OptimizationRequest, OptimizationResponse,
    ValidateRequest, ValidateResponse,
)


class ScoringService:

    def __init__(self) -> None:
        self._weight_manager = get_weight_manager()
        self._cache = get_cache()
        self._optimizer = WeightOptimizer()
        self._validator = ScoringValidator()
        self._history: list[dict] = []
        self._calculators = self._build_calculators()

    def _build_calculators(self) -> dict[ScoreType, BaseScoreCalculator]:
        calcs = [
            FinancialScoreCalculator(), ValueScoreCalculator(), GrowthScoreCalculator(),
            QualityScoreCalculator(), RiskScoreCalculator(), LiquidityScoreCalculator(),
            TechnicalScoreCalculator(), MomentumScoreCalculator(), TrendScoreCalculator(),
            VolumeScoreCalculator(), SmartMoneyScoreCalculator(), PatternScoreCalculator(),
            TimingScoreCalculator(), SectorStrengthScoreCalculator(), ProbabilityScoreCalculator(),
            CompositeScoreCalculator(),
        ]
        return {c.score_type: c for c in calcs}

    def calculate(self, request: CalculateScoreRequest) -> ScoreResultResponse:
        profile = self._parse_profile(request.profile)
        horizon = self._parse_horizon(request.horizon)
        regime = self._parse_regime(request.regime)

        cached = self._cache.get(request.symbol, profile, horizon, regime)
        if cached and not request.score_types:
            return self._result_to_response(cached)

        start = time.perf_counter()
        config = self._weight_manager.get_config(profile, horizon, regime)

        requested_types = None
        if request.score_types:
            requested_types = [self._parse_score_type(t) for t in request.score_types]

        scores: dict[str, float] = {}
        breakdowns: dict[str, ScoreBreakdown] = {}
        total_weighted = 0.0
        total_weight = 0.0

        for st, calculator in self._calculators.items():
            if requested_types and st not in requested_types:
                if st != ScoreType.COMPOSITE:
                    continue

            sw = config.weights.get(st, ScoreWeight(score_type=st, weight=0.0))
            if sw.weight <= 0 and st != ScoreType.COMPOSITE:
                continue

            breakdown = calculator.calculate(request.symbol, request.metrics)
            breakdown.weight = sw.weight
            breakdown.contribution = breakdown.normalized_score * sw.weight

            penalty = 0.0
            if breakdown.normalized_score < sw.min_threshold:
                penalty = sw.penalty_factor * breakdown.contribution
            breakdown.penalty = penalty

            bonus = 0.0
            if breakdown.normalized_score > sw.max_threshold:
                bonus = sw.bonus_factor * breakdown.contribution
            breakdown.bonus = bonus

            breakdown.final_contribution = max(0.0, breakdown.contribution - penalty + bonus)
            scores[st.value] = breakdown.normalized_score
            breakdowns[st.value] = breakdown
            total_weighted += breakdown.final_contribution
            total_weight += sw.weight

        composite = total_weighted / max(0.001, total_weight) if total_weight > 0 else 50.0
        composite = max(0.0, min(100.0, composite))
        scores[ScoreType.COMPOSITE.value] = composite

        elapsed = (time.perf_counter() - start) * 1000
        result = ScoreResult(
            symbol=request.symbol, scores=scores, breakdowns=breakdowns,
            profile=profile, horizon=horizon, regime=regime,
            composite_score=composite, method=ScoringMethod.WEIGHTED,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            calculation_time_ms=elapsed,
        )

        if not request.score_types:
            self._cache.set(request.symbol, profile, horizon, regime, result)

        self._history.append({
            "symbol": result.symbol, "composite_score": result.composite_score,
            "profile": profile.value, "horizon": horizon.value, "regime": regime.value,
            "timestamp": result.timestamp, "calculation_time_ms": result.calculation_time_ms,
        })

        return self._result_to_response(result)

    def get_list(self, symbols: list[str], profile: str = "balanced",
                 horizon: str = "one_month", regime: str = "sideways") -> list[ScoreListResponse]:
        results = []
        for sym in symbols:
            req = CalculateScoreRequest(symbol=sym, metrics={}, profile=profile, horizon=horizon, regime=regime)
            resp = self.calculate(req)
            results.append(ScoreListResponse(
                symbol=resp.symbol, scores=resp.scores,
                composite_score=resp.composite_score,
                profile=resp.profile, horizon=resp.horizon, regime=resp.regime,
                timestamp=resp.timestamp,
            ))
        return results

    def get_details(self, symbol: str, score_type: str, metrics: dict,
                    profile: str = "balanced", horizon: str = "one_month",
                    regime: str = "sideways") -> ScoreDetailResponse:
        req = CalculateScoreRequest(
            symbol=symbol, metrics=metrics, profile=profile,
            horizon=horizon, regime=regime, score_types=[score_type],
        )
        resp = self.calculate(req)
        breakdown = resp.breakdowns.get(score_type)
        return ScoreDetailResponse(
            symbol=symbol, score_type=score_type,
            score=resp.scores.get(score_type, 0.0),
            breakdown=breakdown,
        )

    def get_history(self, symbol: str, limit: int = 100) -> ScoreHistoryResponse:
        entries = [e for e in self._history if e["symbol"] == symbol][-limit:]
        return ScoreHistoryResponse(
            symbol=symbol,
            history=[ScoreHistoryEntry(
                score_type="composite", score=e["composite_score"],
                timestamp=e["timestamp"], profile=e["profile"],
                horizon=e["horizon"], regime=e["regime"],
            ) for e in entries],
            total=len(entries),
        )

    def get_weights(self, profile: str = "balanced", horizon: str = "one_month",
                    regime: str = "sideways") -> WeightsResponse:
        p = self._parse_profile(profile)
        h = self._parse_horizon(horizon)
        r = self._parse_regime(regime)
        config = self._weight_manager.get_config(p, h, r)
        weights = [
            WeightInfo(score_type=st.value, weight=sw.weight,
                       min_threshold=sw.min_threshold, max_threshold=sw.max_threshold)
            for st, sw in config.weights.items()
        ]
        return WeightsResponse(
            profile=p.value, horizon=h.value, regime=r.value,
            weights=weights, total_weight=sum(w.weight for w in weights),
        )

    def get_profiles(self) -> ProfilesResponse:
        from modules.scoring_engine.profiles.manager import get_profile_manager
        mgr = get_profile_manager()
        profiles = mgr.list_profiles()
        return ProfilesResponse(
            profiles=[ProfileInfo(
                name=p.name, profile=p.profile.value,
                description=p.description, is_active=p.is_active,
            ) for p in profiles],
            total=len(profiles),
        )

    def optimize(self, request: OptimizationRequest) -> OptimizationResponse:
        p = self._parse_profile(request.profile)
        h = self._parse_horizon(request.horizon)
        r = self._parse_regime(request.regime)
        config = self._weight_manager.get_config(p, h, r)
        result = self._optimizer.optimize(config, request.historical_data, request.iterations)
        return OptimizationResponse(
            original_weights=result.original_weights,
            optimized_weights=result.optimized_weights,
            improvement_pct=result.improvement_pct,
            iterations=result.iterations,
            method=result.method,
            timestamp=result.timestamp,
        )

    def validate(self, request: ValidateRequest) -> ValidateResponse:
        errors = self._validator.validate_metrics(request.metrics)
        return ValidateResponse(
            valid=len(errors) == 0,
            errors=errors,
            message="Valid" if not errors else "; ".join(errors),
        )

    def cache_stats(self) -> CacheStatsResponse:
        return CacheStatsResponse(**self._cache.stats())

    def clear_cache(self) -> int:
        count = self._cache.size
        self._cache.clear()
        return count

    def _result_to_response(self, r: ScoreResult) -> ScoreResultResponse:
        breakdowns = {}
        for k, v in r.breakdowns.items():
            breakdowns[k] = ScoreBreakdownSchema(
                score_type=v.score_type.value, raw_score=v.raw_score,
                normalized_score=v.normalized_score, weight=v.weight,
                contribution=v.contribution, penalty=v.penalty,
                bonus=v.bonus, final_contribution=v.final_contribution,
                confidence=v.confidence, direction=v.direction.value,
                evidence_count=v.evidence_count, calculation_time_ms=v.calculation_time_ms,
            )
        return ScoreResultResponse(
            symbol=r.symbol, scores=r.scores, breakdowns=breakdowns,
            profile=r.profile.value, horizon=r.horizon.value, regime=r.regime.value,
            composite_score=r.composite_score, confidence=r.confidence,
            method=r.method.value, timestamp=r.timestamp,
            calculation_time_ms=r.calculation_time_ms,
        )

    def _parse_profile(self, v: str) -> WeightProfile:
        try:
            return WeightProfile(v)
        except ValueError:
            return WeightProfile.BALANCED

    def _parse_horizon(self, v: str) -> InvestmentHorizon:
        try:
            return InvestmentHorizon(v)
        except ValueError:
            return InvestmentHorizon.ONE_MONTH

    def _parse_regime(self, v: str) -> MarketRegime:
        try:
            return MarketRegime(v)
        except ValueError:
            return MarketRegime.SIDEWAYS

    def _parse_score_type(self, v: str) -> ScoreType:
        try:
            return ScoreType(v)
        except ValueError:
            return ScoreType.COMPOSITE
