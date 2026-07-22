from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.similarity_engine.core.types import (
    FeatureVector,
    HistoricalOutcome,
    MarketRegime,
    PatternMemory,
    PatternOutcome,
    SimilarityResult,
    ValidationPeriod,
    VALIDATION_PERIOD_DAYS,
    _mean,
)


class TimelineAnalyzer:
    """Analyzes historical timelines and outcomes of similar stocks."""

    def __init__(self) -> None:
        self._outcomes: Dict[str, HistoricalOutcome] = {}
        self._memories: List[PatternMemory] = []

    def compute_historical_outcomes(
        self,
        results: List[SimilarityResult],
        price_data: Optional[Dict[str, List[float]]] = None,
    ) -> Dict[str, HistoricalOutcome]:
        price_data = price_data or {}
        outcomes: Dict[str, HistoricalOutcome] = {}
        for r in results:
            key = f"{r.target_symbol}_{r.target_date}"
            prices = price_data.get(r.target_symbol, [])
            if prices:
                outcome = self._compute_outcome_from_prices(prices, r)
            else:
                outcome = self._generate_synthetic_outcome(r)
            outcomes[key] = outcome
            self._outcomes[key] = outcome
        return outcomes

    def analyze_period_returns(
        self,
        outcomes: Dict[str, HistoricalOutcome],
        periods: Optional[List[ValidationPeriod]] = None,
    ) -> Dict[str, Dict[str, float]]:
        periods = periods or list(ValidationPeriod)
        analysis: Dict[str, Dict[str, float]] = {}
        for period in periods:
            returns = []
            for outcome in outcomes.values():
                ret = outcome.period_return.get(period.value, 0.0)
                returns.append(ret)
            analysis[period.value] = {
                "mean": _mean(returns),
                "min": min(returns) if returns else 0.0,
                "max": max(returns) if returns else 0.0,
                "count": len(returns),
            }
        return analysis

    def compute_regime_distribution(
        self,
        results: List[SimilarityResult],
    ) -> Dict[str, int]:
        dist: Dict[str, int] = {}
        for r in results:
            regime = r.market_regime.value
            dist[regime] = dist.get(regime, 0) + 1
        return dist

    def compute_pattern_distribution(
        self,
        results: List[SimilarityResult],
    ) -> Dict[str, int]:
        dist: Dict[str, int] = {}
        for r in results:
            outcome = r.pattern_outcome.value
            dist[outcome] = dist.get(outcome, 0) + 1
        return dist

    def analyze_confidence(
        self,
        results: List[SimilarityResult],
        outcomes: Dict[str, HistoricalOutcome],
    ) -> float:
        if not results:
            return 0.0
        scores = [r.similarity_score for r in results]
        avg_score = _mean(scores)
        win_rates = []
        for r in results:
            key = f"{r.target_symbol}_{r.target_date}"
            outcome = outcomes.get(key)
            if outcome and outcome.total_cases > 0:
                win_rates.append(outcome.win_rate)
        avg_wr = _mean(win_rates) if win_rates else 50.0
        confidence = (avg_score * 0.6 + (avg_wr / 100.0) * 0.4)
        return round(min(1.0, confidence), 6)

    def build_pattern_memory(
        self,
        results: List[SimilarityResult],
        outcomes: Dict[str, HistoricalOutcome],
    ) -> List[PatternMemory]:
        memories: List[PatternMemory] = []
        for r in results:
            key = f"{r.target_symbol}_{r.target_date}"
            outcome = outcomes.get(key)
            avg_ret = 0.0
            if outcome and outcome.period_return:
                avg_ret = _mean(list(outcome.period_return.values()))
            if avg_ret > 2.0:
                pat_outcome = PatternOutcome.SUCCESSFUL
            elif avg_ret < -2.0:
                pat_outcome = PatternOutcome.FAILED
            else:
                pat_outcome = PatternOutcome.NEUTRAL
            memories.append(PatternMemory(
                symbol=r.target_symbol,
                date=r.target_date,
                outcome=pat_outcome,
                return_pct=avg_ret,
                holding_period_days=VALIDATION_PERIOD_DAYS.get(ValidationPeriod.ONE_MONTH, 21),
                market_regime=r.market_regime,
                similarity_score=r.similarity_score,
            ))
            self._memories.append(memories[-1])
        return memories

    def get_successful_patterns(
        self,
        memories: Optional[List[PatternMemory]] = None,
    ) -> List[PatternMemory]:
        mems = memories or self._memories
        return [m for m in mems if m.outcome == PatternOutcome.SUCCESSFUL]

    def get_failed_patterns(
        self,
        memories: Optional[List[PatternMemory]] = None,
    ) -> List[PatternMemory]:
        mems = memories or self._memories
        return [m for m in mems if m.outcome == PatternOutcome.FAILED]

    def get_neutral_patterns(
        self,
        memories: Optional[List[PatternMemory]] = None,
    ) -> List[PatternMemory]:
        mems = memories or self._memories
        return [m for m in mems if m.outcome == PatternOutcome.NEUTRAL]

    def summarize_timeline(
        self,
        results: List[SimilarityResult],
        outcomes: Dict[str, HistoricalOutcome],
    ) -> Dict[str, Any]:
        avg_score = _mean([r.similarity_score for r in results]) if results else 0.0
        returns = []
        drawdowns = []
        win_rates = []
        for r in results:
            key = f"{r.target_symbol}_{r.target_date}"
            outcome = outcomes.get(key)
            if outcome:
                if outcome.period_return:
                    returns.append(_mean(list(outcome.period_return.values())))
                drawdowns.append(abs(outcome.max_drawdown))
                if outcome.total_cases > 0:
                    win_rates.append(outcome.win_rate)
        return {
            "total_results": len(results),
            "avg_similarity_score": round(avg_score, 6),
            "avg_return": round(_mean(returns), 4) if returns else 0.0,
            "avg_drawdown": round(_mean(drawdowns), 4) if drawdowns else 0.0,
            "avg_win_rate": round(_mean(win_rates), 2) if win_rates else 50.0,
            "regime_distribution": self.compute_regime_distribution(results),
            "pattern_distribution": self.compute_pattern_distribution(results),
        }

    def _compute_outcome_from_prices(
        self,
        prices: List[float],
        result: SimilarityResult,
    ) -> HistoricalOutcome:
        if len(prices) < 2:
            return HistoricalOutcome()
        start = prices[0]
        period_returns: Dict[str, float] = {}
        max_dd = 0.0
        peak = prices[0]
        for p in prices:
            if p > peak:
                peak = p
            dd = (peak - p) / peak * 100 if peak > 0 else 0.0
            max_dd = max(max_dd, dd)
        for period, days in VALIDATION_PERIOD_DAYS.items():
            if days < len(prices):
                period_returns[period.value] = ((prices[days] - start) / start * 100) if start > 0 else 0.0
        total_return = ((prices[-1] - start) / start * 100) if start > 0 else 0.0
        win_rate = 60.0 if total_return > 0 else 40.0
        return HistoricalOutcome(
            period_return=period_returns,
            max_drawdown=max_dd,
            win_rate=win_rate,
            holding_period_days=len(prices),
            avg_return=total_return / len(prices) if prices else 0.0,
            total_cases=1,
            successful_cases=1 if total_return > 0 else 0,
            failed_cases=1 if total_return <= 0 else 0,
        )

    def _generate_synthetic_outcome(
        self,
        result: SimilarityResult,
    ) -> HistoricalOutcome:
        import hashlib
        h = hashlib.md5(f"{result.target_symbol}_{result.target_date}".encode()).digest()
        seed_val = h[0] / 255.0
        factor = seed_val * 2.0 - 1.0
        base_return = factor * 10.0
        period_returns = {
            "1w": base_return * 0.2,
            "1m": base_return * 0.5,
            "3m": base_return * 0.8,
            "6m": base_return * 1.0,
            "12m": base_return * 1.2,
        }
        dd = abs(factor) * 20.0
        return HistoricalOutcome(
            period_return=period_returns,
            max_drawdown=dd,
            win_rate=50.0 + factor * 20.0,
            holding_period_days=252,
            avg_return=base_return / 12.0,
            total_cases=1,
            successful_cases=1 if base_return > 0 else 0,
            failed_cases=1 if base_return <= 0 else 0,
        )

    def clear(self) -> None:
        self._outcomes.clear()
        self._memories.clear()
