from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from modules.multi_factor_engine.benchmark.benchmark import BenchmarkRunner
from modules.multi_factor_engine.cache.cache import FactorCache
from modules.multi_factor_engine.core.types import (
    FACTOR_GROUP_MAP,
    GROUP_FACTORS,
    DEFAULT_WEIGHTS,
    HORIZON_WEIGHT_ADJUSTMENTS,
    REGIME_WEIGHT_ADJUSTMENTS,
    FactorAnalysisRequest,
    FactorAnalysisResult,
    FactorGroup,
    FactorName,
    FactorProfile,
    FactorRanking,
    FactorScore,
    GroupScore,
    InvestmentHorizon,
    MarketRegime,
    ReportType,
    _clamp,
    _mean,
    compute_weighted_score,
    score_to_strength,
)
from modules.multi_factor_engine.factors.calculators import ALL_CALCULATORS
from modules.multi_factor_engine.profiles.generator import FactorProfileGenerator
from modules.multi_factor_engine.ranking.ranker import FactorRanker
from modules.multi_factor_engine.validators.validator import RequestValidator, ResultValidator


class MultiFactorService:
    def __init__(self) -> None:
        self._calculators = dict(ALL_CALCULATORS)
        self._ranker = FactorRanker()
        self._profile_generator = FactorProfileGenerator()
        self._request_validator = RequestValidator()
        self._result_validator = ResultValidator()
        self._cache = FactorCache()
        self._benchmark = BenchmarkRunner()
        self._history: Dict[str, List[Dict[str, Any]]] = {}
        self._all_results: List[FactorAnalysisResult] = []

    def analyze(self, request: FactorAnalysisRequest) -> FactorAnalysisResult:
        errors = self._request_validator.validate(request)
        if errors:
            raise ValueError(f"Validation failed: {'; '.join(errors)}")

        cache_key = self._cache.make_key(
            request.symbol,
            request.reference_date,
            horizon=request.horizon.value,
            regime=request.regime.value if request.regime else "",
            sector=request.sector or "",
        )

        cached = self._cache.get(cache_key)
        if cached is not None:
            self._record_history(request.symbol, cached)
            self._all_results.append(cached)
            return cached

        start = time.perf_counter()

        factor_scores = self._calculate_factors(request)

        weights = self._compute_dynamic_weights(request)

        group_scores = self._aggregate_groups(factor_scores, weights)

        overall = self._compute_overall_score(group_scores, weights)

        profile = None
        if request.include_profile:
            profile = self._profile_generator.generate(
                symbol=request.symbol,
                reference_date=request.reference_date,
                group_scores=group_scores,
                factor_scores=factor_scores,
                horizon=request.horizon,
                regime=request.regime,
                sector=request.sector,
            )

        ranking = None
        if request.include_ranking:
            ranking = self._ranker.rank(
                group_scores=group_scores,
                factor_scores=factor_scores,
                symbol=request.symbol,
            )

        elapsed = (time.perf_counter() - start) * 1000

        result = FactorAnalysisResult(
            request=request,
            profile=profile,
            ranking=ranking,
            execution_time_ms=elapsed,
            metadata={
                "overall_score": overall,
                "weights_used": {k.value: v for k, v in weights.items()},
            },
        )

        self._cache.put(cache_key, result)
        self._record_history(request.symbol, result)
        self._all_results.append(result)

        return result

    def get_factor_list(self) -> Dict[str, Any]:
        groups = [g.value for g in FactorGroup]
        factors = [f.value for f in FactorName]
        group_details = {}
        for grp, f_list in GROUP_FACTORS.items():
            group_details[grp.value] = [f.value for f in f_list]
        return {
            "groups": groups,
            "total_groups": len(groups),
            "factors": factors,
            "total_factors": len(factors),
            "group_details": group_details,
        }

    def get_factor_details(self, group_name: str) -> Dict[str, Any]:
        try:
            grp = FactorGroup(group_name)
        except ValueError:
            raise ValueError(f"Invalid factor group: {group_name}")
        f_list = GROUP_FACTORS.get(grp, [])
        return {
            "group": grp.value,
            "factors": [f.value for f in f_list],
            "total_factors": len(f_list),
            "description": f"{grp.value} factor analysis",
        }

    def get_history(self, symbol: str) -> List[Dict[str, Any]]:
        return self._history.get(symbol, [])

    def generate_report(self, report_type: ReportType, symbol: str = "") -> Dict[str, Any]:
        if report_type == ReportType.FULL:
            return self._full_report(symbol)
        elif report_type == ReportType.SUMMARY:
            return self._summary_report(symbol)
        elif report_type == ReportType.FACTOR_BREAKDOWN:
            return self._breakdown_report(symbol)
        elif report_type == ReportType.RANKING:
            return self._ranking_report()
        elif report_type == ReportType.COMPARISON:
            return self._comparison_report()
        elif report_type == ReportType.REGIME_ADAPTED:
            return self._regime_report()
        return {"type": report_type.value, "data": []}

    def clear_cache(self) -> None:
        self._cache.clear()

    def get_cache_stats(self) -> Dict[str, Any]:
        return self._cache.stats()

    def get_benchmark_results(self) -> Dict[str, Any]:
        return self._benchmark.summary()

    def _calculate_factors(self, request: FactorAnalysisRequest) -> List[FactorScore]:
        all_scores: List[FactorScore] = []
        requested_factors = set(request.factors) if request.factors else None

        for grp, calc in self._calculators.items():
            scores = calc.calculate(
                market_data=request.market_data,
                financial_data=request.financial_data,
                indicator_data=request.indicator_data,
                sector_data=request.sector_data,
            )
            if requested_factors:
                scores = [s for s in scores if s.factor in requested_factors]
            all_scores.extend(scores)

        return all_scores

    def _compute_dynamic_weights(
        self,
        request: FactorAnalysisRequest,
    ) -> Dict[FactorGroup, float]:
        weights = dict(DEFAULT_WEIGHTS)

        if request.horizon in HORIZON_WEIGHT_ADJUSTMENTS:
            for grp, mult in HORIZON_WEIGHT_ADJUSTMENTS[request.horizon].items():
                if grp in weights:
                    weights[grp] *= mult

        if request.regime and request.regime in REGIME_WEIGHT_ADJUSTMENTS:
            for grp, mult in REGIME_WEIGHT_ADJUSTMENTS[request.regime].items():
                if grp in weights:
                    weights[grp] *= mult

        return weights

    def _aggregate_groups(
        self,
        factor_scores: List[FactorScore],
        weights: Dict[FactorGroup, float],
    ) -> List[GroupScore]:
        group_map: Dict[FactorGroup, List[FactorScore]] = {}
        for fs in factor_scores:
            grp = FACTOR_GROUP_MAP.get(fs.factor)
            if grp:
                group_map.setdefault(grp, []).append(fs)

        group_scores: List[GroupScore] = []
        for grp, scores in group_map.items():
            avg = _mean([s.score for s in scores])
            w = weights.get(grp, 1.0)
            group_scores.append(GroupScore(
                group=grp,
                score=avg,
                weight=w,
                factors=scores,
                strength=score_to_strength(avg),
            ))

        return group_scores

    def _compute_overall_score(
        self,
        group_scores: List[GroupScore],
        weights: Dict[FactorGroup, float],
    ) -> float:
        if not group_scores:
            return 0.0
        total_weight = 0.0
        weighted_sum = 0.0
        for gs in group_scores:
            w = weights.get(gs.group, 1.0)
            weighted_sum += gs.score * w
            total_weight += w
        return _clamp(weighted_sum / total_weight) if total_weight > 0 else 0.0

    def _record_history(self, symbol: str, result: FactorAnalysisResult) -> None:
        entry = {
            "date": result.request.reference_date,
            "overall_score": result.metadata.get("overall_score", 0.0),
            "execution_time_ms": result.execution_time_ms,
        }
        if symbol not in self._history:
            self._history[symbol] = []
        self._history[symbol].append(entry)

    def _full_report(self, symbol: str) -> Dict[str, Any]:
        results = [r for r in self._all_results if r.request.symbol == symbol]
        if not results:
            return {"type": "full", "symbol": symbol, "data": []}
        latest = results[-1]
        return {
            "type": "full",
            "symbol": symbol,
            "overall_score": latest.metadata.get("overall_score", 0),
            "profile": latest.profile,
            "ranking": latest.ranking,
        }

    def _summary_report(self, symbol: str) -> Dict[str, Any]:
        results = [r for r in self._all_results if r.request.symbol == symbol]
        if not results:
            return {"type": "summary", "symbol": symbol, "data": []}
        latest = results[-1]
        return {
            "type": "summary",
            "symbol": symbol,
            "overall_score": latest.metadata.get("overall_score", 0),
        }

    def _breakdown_report(self, symbol: str) -> Dict[str, Any]:
        results = [r for r in self._all_results if r.request.symbol == symbol]
        if not results:
            return {"type": "factor_breakdown", "symbol": symbol, "data": []}
        latest = results[-1]
        breakdown = {}
        if latest.profile:
            for gs in latest.profile.group_scores:
                breakdown[gs.group.value] = {
                    "score": gs.score,
                    "factors": [
                        {"name": f.factor.value, "score": f.score}
                        for f in gs.factors
                    ],
                }
        return {"type": "factor_breakdown", "symbol": symbol, "breakdown": breakdown}

    def _ranking_report(self) -> Dict[str, Any]:
        rankings = []
        for r in self._all_results:
            if r.ranking:
                rankings.append({
                    "symbol": r.ranking.symbol,
                    "rank": r.ranking.overall_rank,
                    "percentile": r.ranking.percentile,
                })
        return {"type": "ranking", "rankings": rankings}

    def _comparison_report(self) -> Dict[str, Any]:
        symbols = {}
        for r in self._all_results:
            if r.request.symbol not in symbols:
                symbols[r.request.symbol] = r.metadata.get("overall_score", 0)
        return {"type": "comparison", "symbols": symbols}

    def _regime_report(self) -> Dict[str, Any]:
        regime_scores: Dict[str, List[float]] = {}
        for r in self._all_results:
            regime = r.request.regime.value if r.request.regime else "unknown"
            regime_scores.setdefault(regime, []).append(
                r.metadata.get("overall_score", 0)
            )
        regime_avg = {
            k: _mean(v) for k, v in regime_scores.items()
        }
        return {"type": "regime_adapted", "regime_averages": regime_avg}
