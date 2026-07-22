from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.similarity_engine.core.types import (
    FeatureVector,
    HistoricalOutcome,
    MarketRegime,
    PatternMemory,
    PatternOutcome,
    SimilarityLabel,
    SimilarityMethod,
    SimilarityResult,
    ValidationPeriod,
    _mean,
)


class RankingEngine:
    """Ranks similarity results by multiple criteria."""

    def __init__(self) -> None:
        self._all_results: List[SimilarityResult] = []
        self._rankings: Dict[str, List[SimilarityResult]] = {}

    def rank_by_score(
        self,
        results: List[SimilarityResult],
        top_n: int = 5,
    ) -> List[SimilarityResult]:
        sorted_results = sorted(results, key=lambda r: r.similarity_score, reverse=True)
        return sorted_results[:top_n]

    def rank_by_consistency(
        self,
        results: List[SimilarityResult],
        outcomes: Dict[str, HistoricalOutcome],
        top_n: int = 5,
    ) -> List[SimilarityResult]:
        scored = []
        for r in results:
            outcome = outcomes.get(f"{r.target_symbol}_{r.target_date}")
            consistency = outcome.win_rate if outcome else 0.0
            scored.append((r, consistency))
        scored.sort(key=lambda x: x[1], reverse=True)
        return [r for r, _ in scored[:top_n]]

    def rank_by_return(
        self,
        results: List[SimilarityResult],
        outcomes: Dict[str, HistoricalOutcome],
        period: ValidationPeriod = ValidationPeriod.ONE_MONTH,
        top_n: int = 5,
    ) -> List[SimilarityResult]:
        scored = []
        for r in results:
            outcome = outcomes.get(f"{r.target_symbol}_{r.target_date}")
            ret = outcome.period_return.get(period.value, 0.0) if outcome else 0.0
            scored.append((r, ret))
        scored.sort(key=lambda x: x[1], reverse=True)
        return [r for r, _ in scored[:top_n]]

    def rank_by_risk(
        self,
        results: List[SimilarityResult],
        outcomes: Dict[str, HistoricalOutcome],
        top_n: int = 5,
    ) -> List[SimilarityResult]:
        scored = []
        for r in results:
            outcome = outcomes.get(f"{r.target_symbol}_{r.target_date}")
            dd = abs(outcome.max_drawdown) if outcome else 100.0
            scored.append((r, dd))
        scored.sort(key=lambda x: x[1])
        return [r for r, _ in scored[:top_n]]

    def composite_rank(
        self,
        results: List[SimilarityResult],
        outcomes: Optional[Dict[str, HistoricalOutcome]] = None,
        weights: Optional[Dict[str, float]] = None,
        top_n: int = 5,
    ) -> List[SimilarityResult]:
        outcomes = outcomes or {}
        weights = weights or {
            "similarity": 0.4,
            "return": 0.3,
            "consistency": 0.2,
            "risk": 0.1,
        }
        scored = []
        for r in results:
            outcome = outcomes.get(f"{r.target_symbol}_{r.target_date}")
            ret_score = 0.0
            cons_score = 0.0
            risk_score = 0.0
            if outcome:
                avg_ret = outcome.period_return.get("1m", 0.0) if outcome.period_return else 0.0
                ret_score = min(1.0, max(0.0, (avg_ret + 10.0) / 20.0))
                cons_score = outcome.win_rate / 100.0 if outcome.win_rate else 0.0
                risk_score = max(0.0, 1.0 - abs(outcome.max_drawdown) / 50.0)
            composite = (
                weights.get("similarity", 0.4) * r.similarity_score
                + weights.get("return", 0.3) * ret_score
                + weights.get("consistency", 0.2) * cons_score
                + weights.get("risk", 0.1) * risk_score
            )
            scored.append((r, composite))
        scored.sort(key=lambda x: x[1], reverse=True)
        return [r for r, _ in scored[:top_n]]

    def rank_by_regime(
        self,
        results: List[SimilarityResult],
        target_regime: MarketRegime,
        top_n: int = 5,
    ) -> List[SimilarityResult]:
        regime_filtered = [r for r in results if r.market_regime == target_regime]
        if not regime_filtered:
            return results[:top_n]
        return self.rank_by_score(regime_filtered, top_n)

    def rank_by_pattern_outcome(
        self,
        results: List[SimilarityResult],
        target_outcome: PatternOutcome,
        top_n: int = 5,
    ) -> List[SimilarityResult]:
        filtered = [r for r in results if r.pattern_outcome == target_outcome]
        if not filtered:
            return results[:top_n]
        return self.rank_by_score(filtered, top_n)

    def deduplicate(
        self,
        results: List[SimilarityResult],
    ) -> List[SimilarityResult]:
        seen: Dict[str, SimilarityResult] = {}
        for r in results:
            key = f"{r.target_symbol}_{r.target_date}"
            if key not in seen or r.similarity_score > seen[key].similarity_score:
                seen[key] = r
        return list(seen.values())

    def filter_by_label(
        self,
        results: List[SimilarityResult],
        min_label: SimilarityLabel = SimilarityLabel.MODERATE,
    ) -> List[SimilarityResult]:
        label_order = [
            SimilarityLabel.VERY_WEAK,
            SimilarityLabel.WEAK,
            SimilarityLabel.MODERATE,
            SimilarityLabel.STRONG,
            SimilarityLabel.VERY_STRONG,
            SimilarityLabel.EXCEPTIONAL,
        ]
        min_idx = label_order.index(min_label)
        return [r for r in results if label_order.index(r.similarity_label) >= min_idx]

    def store_results(self, results: List[SimilarityResult], key: str = "default") -> None:
        self._all_results.extend(results)
        if key not in self._rankings:
            self._rankings[key] = []
        self._rankings[key].extend(results)

    def get_rankings(self, key: str = "default") -> List[SimilarityResult]:
        return list(self._rankings.get(key, []))

    def clear(self) -> None:
        self._all_results.clear()
        self._rankings.clear()
