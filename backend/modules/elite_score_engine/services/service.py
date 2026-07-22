from __future__ import annotations

from typing import Dict, List, Optional, Any
import datetime

from modules.elite_score_engine.core.types import (
    ScoringDimension,
    DimensionWeight,
    DimensionContribution,
    EliteScoreResult,
    EliteScoreHistoryEntry,
    EliteRankingEntry,
    EliteScoreTrend,
    EliteWeightConfig,
    EliteProfile,
    EliteCalculationRequest,
    InvestmentHorizon,
    MarketRegime,
    SectorType,
    RankingPeriod,
    EliteCategory,
    EliteLabel,
    EliteTrend,
    classify_elite,
    classify_label,
)
from modules.elite_score_engine.calculators.elite_calculator import (
    EliteScoreCalculator,
    EliteScoreTrendTracker,
)
from modules.elite_score_engine.weights.manager import WeightManager
from modules.elite_score_engine.profiles.manager import ProfileManager
from modules.elite_score_engine.ranking.ranking import EliteRankingManager
from modules.elite_score_engine.validators.validator import EliteValidator
from modules.elite_score_engine.registry.registry import EliteRegistry
from modules.elite_score_engine.cache.cache import EliteCache
from modules.elite_score_engine.benchmark.benchmark import EliteBenchmark


class EliteScoreService:
    def __init__(self) -> None:
        self._weight_manager = WeightManager()
        self._profile_manager = ProfileManager()
        self._ranking_manager = EliteRankingManager()
        self._trend_tracker = EliteScoreTrendTracker()
        self._validator = EliteValidator()
        self._registry = EliteRegistry()
        self._cache = EliteCache()
        self._benchmark = EliteBenchmark()

    def calculate(
        self,
        request: EliteCalculationRequest,
    ) -> EliteScoreResult:
        cache_key = (
            f"{request.symbol}:{request.profile_name}:"
            f"{request.horizon.value}:{request.regime.value}:{request.sector.value}:"
            f"{hash(frozenset(request.scores.items()))}"
        )
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        config = self._weight_manager.get_config(
            profile_name=request.profile_name,
            horizon=request.horizon,
            regime=request.regime,
            sector=request.sector,
        )
        calculator = EliteScoreCalculator(config)

        dimension_scores = self._map_scores_to_dimensions(request.scores)
        if request.dimension_scores:
            for dim_str, val in request.dimension_scores.items():
                try:
                    dim = ScoringDimension(dim_str)
                    dimension_scores[dim] = val
                except ValueError:
                    pass

        calc_result = calculator.calculate(
            symbol=request.symbol,
            scores=request.scores,
            dimension_scores=dimension_scores,
            source_scores=request.source_scores,
            source_breakdowns=request.source_breakdowns,
        )

        elite_score = calc_result["elite_score"]
        elite_category = classify_elite(elite_score)
        label = classify_label(elite_score, calc_result["bonuses"], calc_result["penalties"])

        result = EliteScoreResult(
            symbol=request.symbol,
            elite_score=elite_score,
            elite_category=elite_category,
            label=label,
            dimension_contributions=calc_result["dimension_contributions"],
            bonuses=calc_result["bonuses"],
            penalties=calc_result["penalties"],
            raw_score=calc_result["raw_score"],
            total_weight=calc_result["total_weight"],
            confidence=calc_result["confidence"],
            evidence_count=calc_result["evidence_count"],
            horizon=request.horizon,
            regime=request.regime,
            sector=request.sector,
            source_scores=request.source_scores,
            source_breakdowns=request.source_breakdowns,
        )

        self._trend_tracker.record(
            symbol=request.symbol,
            elite_score=elite_score,
            elite_category=elite_category,
            label=label,
            horizon=request.horizon,
        )

        self._cache.set(cache_key, result)
        return result

    def calculate_list(
        self,
        symbols: List[str],
        scores_map: Dict[str, Dict[str, float]],
        profile_name: str = "balanced",
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        regime: MarketRegime = MarketRegime.SIDEWAYS,
        sector: SectorType = SectorType.OTHER,
    ) -> List[EliteScoreResult]:
        results: List[EliteScoreResult] = []
        for symbol in symbols:
            symbol_scores = scores_map.get(symbol, {})
            request = EliteCalculationRequest(
                symbol=symbol,
                scores=symbol_scores,
                profile_name=profile_name,
                horizon=horizon,
                regime=regime,
                sector=sector,
            )
            results.append(self.calculate(request))
        return results

    def get_details(self, symbol: str) -> Optional[Dict[str, Any]]:
        history = self._trend_tracker.get_history(
            symbol, InvestmentHorizon.ONE_MONTH, limit=1
        )
        if not history:
            return None

        trend = self._trend_tracker.get_trend(symbol, InvestmentHorizon.ONE_MONTH)
        ranking = self._ranking_manager.get_symbol_rank(symbol)

        return {
            "symbol": symbol,
            "history": history,
            "trend": trend,
            "ranking": ranking,
            "history_count": len(
                self._trend_tracker.get_history(symbol, InvestmentHorizon.ONE_MONTH, limit=1000)
            ),
        }

    def get_history(
        self,
        symbol: str,
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        limit: int = 30,
    ) -> List[EliteScoreHistoryEntry]:
        return self._trend_tracker.get_history(symbol, horizon, limit)

    def get_trend(
        self,
        symbol: str,
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
    ) -> Optional[EliteTrend]:
        return self._trend_tracker.get_trend(symbol, horizon)

    def update_ranking(
        self,
        results: List[EliteScoreResult],
        period: RankingPeriod = RankingPeriod.DAILY,
    ) -> List[EliteRankingEntry]:
        return self._ranking_manager.update_ranking(results, period)

    def get_ranking(
        self,
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        period: RankingPeriod = RankingPeriod.DAILY,
        limit: int = 50,
    ) -> List[EliteRankingEntry]:
        return self._ranking_manager.get_ranking(horizon, period, limit)

    def get_top_n(
        self,
        n: int = 10,
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        period: RankingPeriod = RankingPeriod.DAILY,
    ) -> List[EliteRankingEntry]:
        return self._ranking_manager.get_top_n(n, horizon, period)

    def get_profiles(self) -> Dict[str, EliteProfile]:
        return self._profile_manager.get_all_profiles()

    def get_weight_config(
        self,
        profile_name: str = "balanced",
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        regime: MarketRegime = MarketRegime.SIDEWAYS,
        sector: SectorType = SectorType.OTHER,
    ) -> EliteWeightConfig:
        return self._weight_manager.get_config(profile_name, horizon, regime, sector)

    def validate(
        self,
        scores: Optional[Dict[str, float]] = None,
        dimension_scores: Optional[Dict[ScoringDimension, float]] = None,
        config: Optional[EliteWeightConfig] = None,
    ) -> List[str]:
        errors: List[str] = []
        if scores is not None:
            errors.extend(self._validator.validate_input_scores(scores))
        if dimension_scores is not None:
            errors.extend(self._validator.validate_dimension_scores(dimension_scores))
        if config is not None:
            errors.extend(self._validator.validate_config(config))
        return errors

    def cache_stats(self) -> Dict[str, Any]:
        return self._cache.stats()

    def clear_cache(self) -> int:
        return self._cache.clear()

    def run_benchmark(
        self,
        iterations: int = 10,
        warmup: int = 3,
        symbol: str = "TUPRS",
        profile_name: str = "balanced",
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        regime: MarketRegime = MarketRegime.SIDEWAYS,
        sector: SectorType = SectorType.OTHER,
    ) -> Any:
        request = EliteCalculationRequest(
            symbol=symbol,
            scores={"financial": 70, "momentum": 65, "technical": 60},
            profile_name=profile_name,
            horizon=horizon,
            regime=regime,
            sector=sector,
        )

        def run_calc() -> EliteScoreResult:
            return self.calculate(request)

        return self._benchmark.run(
            operation="elite_score_calculate",
            func=run_calc,
            iterations=iterations,
            warmup=warmup,
        )

    def _map_scores_to_dimensions(
        self, scores: Dict[str, float]
    ) -> Dict[ScoringDimension, float]:
        mapping: Dict[str, ScoringDimension] = {
            "financial": ScoringDimension.FINANCIAL_QUALITY,
            "financial_quality": ScoringDimension.FINANCIAL_QUALITY,
            "value": ScoringDimension.VALUATION,
            "valuation": ScoringDimension.VALUATION,
            "growth": ScoringDimension.GROWTH,
            "profitability": ScoringDimension.PROFITABILITY,
            "technical": ScoringDimension.TECHNICAL_STRUCTURE,
            "technical_structure": ScoringDimension.TECHNICAL_STRUCTURE,
            "trend": ScoringDimension.TREND_QUALITY,
            "trend_quality": ScoringDimension.TREND_QUALITY,
            "momentum": ScoringDimension.MOMENTUM,
            "volume": ScoringDimension.VOLUME,
            "liquidity": ScoringDimension.LIQUIDITY,
            "smart_money": ScoringDimension.SMART_MONEY,
            "smartmoney": ScoringDimension.SMART_MONEY,
            "pattern": ScoringDimension.PATTERN_QUALITY,
            "pattern_quality": ScoringDimension.PATTERN_QUALITY,
            "risk": ScoringDimension.RISK,
            "sector_strength": ScoringDimension.SECTOR_STRENGTH,
            "sector": ScoringDimension.SECTOR_STRENGTH,
            "market_regime": ScoringDimension.MARKET_REGIME,
            "regime": ScoringDimension.MARKET_REGIME,
            "timing": ScoringDimension.TIMING,
            "historical_similarity": ScoringDimension.HISTORICAL_SIMILARITY,
            "similarity": ScoringDimension.HISTORICAL_SIMILARITY,
            "confidence": ScoringDimension.CONFIDENCE,
            "elite": ScoringDimension.CONFIDENCE,
            "composite": ScoringDimension.CONFIDENCE,
        }

        result: Dict[ScoringDimension, float] = {}
        for key, value in scores.items():
            dim = mapping.get(key.lower())
            if dim is not None:
                result[dim] = value
        return result
