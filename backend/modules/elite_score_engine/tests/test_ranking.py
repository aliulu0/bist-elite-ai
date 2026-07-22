import pytest
from modules.elite_score_engine.ranking.ranking import EliteRankingManager
from modules.elite_score_engine.core.types import (
    EliteScoreResult,
    EliteCategory,
    EliteLabel,
    InvestmentHorizon,
    MarketRegime,
    SectorType,
    RankingPeriod,
    EliteTrend,
)
import datetime


def _make_result(symbol: str, score: float, sector: SectorType = SectorType.OTHER) -> EliteScoreResult:
    from modules.elite_score_engine.core.types import classify_elite, classify_label
    category = classify_elite(score)
    return EliteScoreResult(
        symbol=symbol,
        elite_score=score,
        elite_category=category,
        label=classify_label(score, [], []),
        dimension_contributions={},
        bonuses=[],
        penalties=[],
        raw_score=score,
        total_weight=1.0,
        confidence=0.8,
        evidence_count=10,
        horizon=InvestmentHorizon.ONE_MONTH,
        regime=MarketRegime.SIDEWAYS,
        sector=sector,
    )


class TestEliteRankingManager:
    def test_update_ranking(self):
        mgr = EliteRankingManager()
        results = [_make_result("A", 80.0), _make_result("B", 60.0)]
        entries = mgr.update_ranking(results)
        assert len(entries) == 2
        assert entries[0].rank == 1
        assert entries[0].symbol == "A"
        assert entries[1].rank == 2

    def test_get_ranking(self):
        mgr = EliteRankingManager()
        results = [_make_result("A", 80.0), _make_result("B", 60.0)]
        mgr.update_ranking(results)
        ranking = mgr.get_ranking()
        assert len(ranking) == 2

    def test_get_top_n(self):
        mgr = EliteRankingManager()
        results = [_make_result(f"S{i}", float(90 - i * 5)) for i in range(10)]
        mgr.update_ranking(results)
        top = mgr.get_top_n(3)
        assert len(top) == 3
        assert top[0].rank == 1

    def test_get_symbol_rank(self):
        mgr = EliteRankingManager()
        results = [_make_result("A", 80.0), _make_result("B", 60.0)]
        mgr.update_ranking(results)
        rank = mgr.get_symbol_rank("A")
        assert rank is not None
        assert rank.rank == 1

    def test_get_symbol_rank_not_found(self):
        mgr = EliteRankingManager()
        assert mgr.get_symbol_rank("NONEXIST") is None

    def test_sector_rankings(self):
        mgr = EliteRankingManager()
        results = [
            _make_result("A", 80.0, SectorType.BANKS),
            _make_result("B", 60.0, SectorType.TECHNOLOGY),
            _make_result("C", 70.0, SectorType.BANKS),
        ]
        mgr.update_ranking(results)
        bank_entries = mgr.get_sector_rankings(SectorType.BANKS)
        assert len(bank_entries) == 2

    def test_category_distribution(self):
        mgr = EliteRankingManager()
        results = [_make_result("A", 80.0), _make_result("B", 30.0)]
        mgr.update_ranking(results)
        dist = mgr.get_category_distribution()
        assert len(dist) >= 1

    def test_rank_change(self):
        mgr = EliteRankingManager()
        results1 = [_make_result("A", 80.0), _make_result("B", 60.0)]
        mgr.update_ranking(results1)
        results2 = [_make_result("A", 60.0), _make_result("B", 80.0)]
        entries = mgr.update_ranking(results2)
        a_entry = next(e for e in entries if e.symbol == "A")
        assert a_entry.rank_change != 0

    def test_clear(self):
        mgr = EliteRankingManager()
        mgr.update_ranking([_make_result("A", 80.0)])
        mgr.clear()
        assert mgr.get_ranking() == []

    def test_history(self):
        mgr = EliteRankingManager()
        mgr.update_ranking([_make_result("A", 80.0)])
        mgr.update_ranking([_make_result("A", 75.0)])
        history = mgr.get_history("A")
        assert len(history) == 2

    def test_empty_results(self):
        mgr = EliteRankingManager()
        entries = mgr.update_ranking([])
        assert entries == []

    def test_limit(self):
        mgr = EliteRankingManager()
        results = [_make_result(f"S{i}", float(90 - i)) for i in range(20)]
        mgr.update_ranking(results)
        ranking = mgr.get_ranking(limit=5)
        assert len(ranking) == 5
