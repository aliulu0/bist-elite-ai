from __future__ import annotations

from typing import Dict, List, Optional
import datetime

from modules.elite_score_engine.core.types import (
    EliteScoreResult,
    EliteRankingEntry,
    EliteCategory,
    EliteLabel,
    EliteTrend,
    InvestmentHorizon,
    MarketRegime,
    RankingPeriod,
    SectorType,
)


class EliteRankingManager:
    def __init__(self) -> None:
        self._rankings: Dict[str, Dict[RankingPeriod, List[EliteRankingEntry]]] = {}
        self._history: Dict[str, List[EliteRankingEntry]] = {}

    def update_ranking(
        self,
        results: List[EliteScoreResult],
        period: RankingPeriod = RankingPeriod.DAILY,
    ) -> List[EliteRankingEntry]:
        sorted_results = sorted(results, key=lambda r: r.elite_score, reverse=True)
        entries: List[EliteRankingEntry] = []
        for i, result in enumerate(sorted_results, start=1):
            previous_rank = self._get_previous_rank(result.symbol, period)
            rank_change = 0
            if previous_rank is not None:
                rank_change = previous_rank - i

            entry = EliteRankingEntry(
                symbol=result.symbol,
                elite_score=result.elite_score,
                elite_category=result.elite_category,
                label=result.label,
                rank=i,
                previous_rank=previous_rank,
                rank_change=rank_change,
                trend=self._compute_trend(result.symbol, result.elite_score),
                sector=result.sector,
                horizon=result.horizon,
                period=period,
            )
            entries.append(entry)

        if not entries:
            return entries

        horizon = entries[0].horizon
        key = f"{horizon.value}:{period.value}"
        self._rankings[key] = entries

        for entry in entries:
            history_key = f"{entry.symbol}:{horizon.value}"
            if history_key not in self._history:
                self._history[history_key] = []
            self._history[history_key].append(entry)

        return entries

    def get_ranking(
        self,
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        period: RankingPeriod = RankingPeriod.DAILY,
        limit: int = 50,
    ) -> List[EliteRankingEntry]:
        key = f"{horizon.value}:{period.value}"
        entries = self._rankings.get(key, [])
        return entries[:limit]

    def get_symbol_rank(
        self,
        symbol: str,
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        period: RankingPeriod = RankingPeriod.DAILY,
    ) -> Optional[EliteRankingEntry]:
        key = f"{horizon.value}:{period.value}"
        entries = self._rankings.get(key, [])
        for entry in entries:
            if entry.symbol == symbol:
                return entry
        return None

    def get_top_n(
        self,
        n: int = 10,
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        period: RankingPeriod = RankingPeriod.DAILY,
    ) -> List[EliteRankingEntry]:
        return self.get_ranking(horizon, period, limit=n)

    def get_sector_rankings(
        self,
        sector: SectorType,
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        period: RankingPeriod = RankingPeriod.DAILY,
    ) -> List[EliteRankingEntry]:
        entries = self.get_ranking(horizon, period, limit=1000)
        return [e for e in entries if e.sector == sector]

    def get_category_distribution(
        self,
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        period: RankingPeriod = RankingPeriod.DAILY,
    ) -> Dict[EliteCategory, int]:
        entries = self.get_ranking(horizon, period, limit=1000)
        dist: Dict[EliteCategory, int] = {}
        for entry in entries:
            dist[entry.elite_category] = dist.get(entry.elite_category, 0) + 1
        return dist

    def get_history(
        self,
        symbol: str,
        horizon: InvestmentHorizon = InvestmentHorizon.ONE_MONTH,
        limit: int = 30,
    ) -> List[EliteRankingEntry]:
        history_key = f"{symbol}:{horizon.value}"
        return self._history.get(history_key, [])[-limit:]

    def clear(self) -> None:
        self._rankings.clear()
        self._history.clear()

    def _get_previous_rank(self, symbol: str, period: RankingPeriod) -> Optional[int]:
        for existing_entries in self._rankings.values():
            for entry in existing_entries:
                if entry.symbol == symbol and entry.period == period:
                    return entry.rank
        return None

    def _compute_trend(self, symbol: str, current_score: float) -> EliteTrend:
        history_key = f"{symbol}:{InvestmentHorizon.ONE_MONTH.value}"
        history = self._history.get(history_key, [])
        if len(history) < 2:
            return EliteTrend.STABLE
        recent = [h.elite_score for h in history[-5:]]
        if len(recent) < 2:
            return EliteTrend.STABLE
        deltas = [recent[i + 1] - recent[i] for i in range(len(recent) - 1)]
        avg_delta = sum(deltas) / len(deltas)
        volatility = sum(abs(d - avg_delta) for d in deltas) / len(deltas)
        if volatility > 10:
            return EliteTrend.VOLATILE
        if avg_delta > 2:
            return EliteTrend.IMPROVING
        if avg_delta < -2:
            return EliteTrend.DECLINING
        return EliteTrend.STABLE


def reset_ranking_manager() -> None:
    pass
