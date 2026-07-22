import pytest
from modules.early_opportunity_engine.ranking.opportunity_ranker import OpportunityRanker
from modules.early_opportunity_engine.core.types import (
    OpportunityResult, OpportunityRating, OpportunityStage,
    RiskAssessment, ExpectedReturn, ExpectedWindow, MarketRegimeType,
    EvidencePackage, SimilarityAnalysis,
)


def _make_result(symbol: str, score: float, risk_score: float = 0.3) -> OpportunityResult:
    return OpportunityResult(
        symbol=symbol,
        opportunity_score=score,
        rating=OpportunityRating.HIGH,
        stage=OpportunityStage.STAGE_5_BREAKOUT,
        confidence=75.0,
        risk=RiskAssessment(
            score=risk_score, drawdown_probability=0.2,
            liquidity_risk=0.1, volatility_risk=0.3, sector_risk=0.2,
        ),
        expected_window=ExpectedWindow.ONE_WEEK,
        expected_return=ExpectedReturn(conservative=5.0, expected=15.0, optimistic=30.0),
        evidence=EvidencePackage(items=[], score=0, summary=""),
        similarity=SimilarityAnalysis(score=0.5, similar_symbols=[], historical_success_rate=0.6, timeline_match="", details=""),
        market_regime=MarketRegimeType.SIDEWAYS,
        stage_results=[], warnings=[], red_flags=[], early_warnings=[], explanations=[],
    )


class TestOpportunityRanker:
    def setup_method(self):
        self.ranker = OpportunityRanker()

    def test_rank_empty(self):
        assert self.ranker.rank([]) == []

    def test_rank_single(self):
        results = [_make_result("A", 75.0)]
        ranked = self.ranker.rank(results)
        assert len(ranked) == 1
        assert ranked[0].symbol == "A"

    def test_rank_order(self):
        results = [
            _make_result("A", 50.0),
            _make_result("B", 90.0),
            _make_result("C", 70.0),
        ]
        ranked = self.ranker.rank(results)
        assert ranked[0].symbol == "B"
        assert ranked[1].symbol == "C"
        assert ranked[2].symbol == "A"

    def test_rank_limit(self):
        results = [_make_result(f"S{i}", float(i * 10)) for i in range(20)]
        ranked = self.ranker.rank(results, limit=5)
        assert len(ranked) == 5

    def test_rank_by_risk(self):
        results = [
            _make_result("A", 75.0, risk_score=0.5),
            _make_result("B", 75.0, risk_score=0.1),
        ]
        ranked = self.ranker.rank(results, sort_by="risk_score")
        assert ranked[0].symbol == "B"

    def test_filter_by_min_score(self):
        results = [_make_result("A", 30.0), _make_result("B", 80.0)]
        filtered = self.ranker.filter_by_min_score(results, min_score=50.0)
        assert len(filtered) == 1
        assert filtered[0].symbol == "B"

    def test_filter_by_confidence(self):
        results = [_make_result("A", 80.0), _make_result("B", 80.0)]
        results[0].confidence = 30.0
        results[1].confidence = 80.0
        filtered = self.ranker.filter_by_confidence(results, min_confidence=50.0)
        assert len(filtered) == 1

    def test_get_top_opportunities(self):
        results = [_make_result(f"S{i}", float(i * 10)) for i in range(10)]
        top = self.ranker.get_top_opportunities(results, limit=3)
        assert len(top) == 3
        assert top[0].opportunity_score >= top[1].opportunity_score

    def test_aggregate_empty(self):
        agg = self.ranker.aggregate([])
        assert agg["total"] == 0

    def test_aggregate_with_results(self):
        results = [_make_result("A", 80.0), _make_result("B", 60.0)]
        agg = self.ranker.aggregate(results)
        assert agg["total"] == 2
        assert agg["avg_score"] == 70.0
