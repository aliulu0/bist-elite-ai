import pytest
from modules.elite_score_engine.core.types import (
    EliteCategory,
    EliteLabel,
    ScoringDimension,
    SectorType,
    BonusFactor,
    PenaltyFactor,
    EliteTrend,
    InvestmentHorizon,
    MarketRegime,
    RankingPeriod,
    ScoreDirection,
    DimensionWeight,
    BonusRule,
    PenaltyRule,
    EliteWeightConfig,
    DimensionContribution,
    BonusApplied,
    PenaltyApplied,
    EliteScoreResult,
    EliteScoreHistoryEntry,
    EliteRankingEntry,
    EliteScoreTrend,
    EliteProfile,
    EliteCalculationRequest,
    BenchmarkResult,
    classify_elite,
    classify_label,
    CATEGORY_RANGES,
    CATEGORY_DESCRIPTIONS,
    LABEL_DESCRIPTIONS,
)
import datetime


class TestEliteCategory:
    def test_values(self):
        assert EliteCategory.AVOID.value == "avoid"
        assert EliteCategory.WEAK.value == "weak"
        assert EliteCategory.WATCH.value == "watch"
        assert EliteCategory.GOOD.value == "good"
        assert EliteCategory.STRONG.value == "strong"
        assert EliteCategory.ELITE.value == "elite"
        assert EliteCategory.EXCEPTIONAL.value == "exceptional"

    def test_count(self):
        assert len(EliteCategory) == 7

    def test_members(self):
        members = list(EliteCategory)
        assert EliteCategory.AVOID in members
        assert EliteCategory.EXCEPTIONAL in members


class TestEliteLabel:
    def test_values(self):
        assert EliteLabel.UNDERVALUED.value == "undervalued"
        assert EliteLabel.HIGH_CONVICTION.value == "high_conviction"
        assert EliteLabel.EARLY_OPPORTUNITY.value == "early_opportunity"
        assert EliteLabel.BREAKOUT_CANDIDATE.value == "breakout_candidate"
        assert EliteLabel.WATCHLIST.value == "watchlist"
        assert EliteLabel.HIGH_RISK.value == "high_risk"

    def test_count(self):
        assert len(EliteLabel) == 6


class TestScoringDimension:
    def test_count(self):
        assert len(ScoringDimension) == 17

    def test_all_present(self):
        expected = [
            "financial_quality", "valuation", "growth", "profitability",
            "technical_structure", "trend_quality", "momentum", "volume",
            "liquidity", "smart_money", "pattern_quality", "risk",
            "sector_strength", "market_regime", "timing",
            "historical_similarity", "confidence",
        ]
        for e in expected:
            assert ScoringDimension(e) is not None


class TestSectorType:
    def test_count(self):
        assert len(SectorType) == 12


class TestBonusFactor:
    def test_count(self):
        assert len(BonusFactor) == 8


class TestPenaltyFactor:
    def test_count(self):
        assert len(PenaltyFactor) == 8


class TestEliteTrend:
    def test_values(self):
        assert EliteTrend.IMPROVING.value == "improving"
        assert EliteTrend.STABLE.value == "stable"
        assert EliteTrend.DECLINING.value == "declining"
        assert EliteTrend.VOLATILE.value == "volatile"


class TestInvestmentHorizon:
    def test_count(self):
        assert len(InvestmentHorizon) == 5


class TestMarketRegime:
    def test_count(self):
        assert len(MarketRegime) == 5


class TestRankingPeriod:
    def test_values(self):
        assert RankingPeriod.DAILY.value == "daily"
        assert RankingPeriod.WEEKLY.value == "weekly"
        assert RankingPeriod.MONTHLY.value == "monthly"


class TestScoreDirection:
    def test_values(self):
        assert ScoreDirection.HIGHER_IS_BETTER.value == "higher_is_better"
        assert ScoreDirection.LOWER_IS_BETTER.value == "lower_is_better"


class TestDimensionWeight:
    def test_creation(self):
        dw = DimensionWeight(
            dimension=ScoringDimension.MOMENTUM,
            weight=0.1,
            direction=ScoreDirection.HIGHER_IS_BETTER,
            min_value=0.0,
            max_value=100.0,
            description="Test",
        )
        assert dw.dimension == ScoringDimension.MOMENTUM
        assert dw.weight == 0.1
        assert dw.description == "Test"

    def test_frozen(self):
        dw = DimensionWeight(
            dimension=ScoringDimension.MOMENTUM,
            weight=0.1,
        )
        with pytest.raises(AttributeError):
            dw.weight = 0.2


class TestBonusRule:
    def test_creation(self):
        br = BonusRule(
            factor=BonusFactor.GOLDEN_CROSS,
            points=5.0,
            condition="trend > 70",
            max_applications=1,
            description="Golden cross",
        )
        assert br.factor == BonusFactor.GOLDEN_CROSS
        assert br.points == 5.0


class TestPenaltyRule:
    def test_creation(self):
        pr = PenaltyRule(
            factor=PenaltyFactor.WEAK_LIQUIDITY,
            points=-5.0,
            condition="liquidity < 30",
            description="Weak liquidity",
        )
        assert pr.factor == PenaltyFactor.WEAK_LIQUIDITY
        assert pr.points == -5.0


class TestEliteWeightConfig:
    def test_creation(self):
        config = EliteWeightConfig(
            profile_name="test",
            dimensions={},
        )
        assert config.profile_name == "test"
        assert config.total_weight == 1.0
        assert config.horizon == InvestmentHorizon.ONE_MONTH


class TestDimensionContribution:
    def test_creation(self):
        dc = DimensionContribution(
            dimension=ScoringDimension.MOMENTUM,
            raw_score=70.0,
            normalized_score=70.0,
            weighted_score=7.0,
            contribution=7.0,
            direction=ScoreDirection.HIGHER_IS_BETTER,
            weight=0.1,
        )
        assert dc.evidence_count == 0
        assert dc.confidence == 1.0


class TestBonusApplied:
    def test_creation(self):
        ba = BonusApplied(
            factor=BonusFactor.GOLDEN_CROSS,
            points=5.0,
            condition="golden cross",
        )
        assert ba.applied_count == 1


class TestPenaltyApplied:
    def test_creation(self):
        pa = PenaltyApplied(
            factor=PenaltyFactor.WEAK_LIQUIDITY,
            points=-5.0,
            condition="weak liquidity",
        )
        assert pa.applied_count == 1


class TestEliteScoreResult:
    def test_creation(self):
        result = EliteScoreResult(
            symbol="TUPRS",
            elite_score=75.0,
            elite_category=EliteCategory.GOOD,
            label=EliteLabel.EARLY_OPPORTUNITY,
            dimension_contributions={},
            bonuses=[],
            penalties=[],
            raw_score=70.0,
            total_weight=1.0,
            confidence=0.85,
            evidence_count=10,
            horizon=InvestmentHorizon.ONE_MONTH,
            regime=MarketRegime.SIDEWAYS,
            sector=SectorType.OTHER,
        )
        assert result.symbol == "TUPRS"
        assert result.elite_score == 75.0
        assert result.calculation_id is not None
        assert result.calculated_at is not None


class TestEliteScoreHistoryEntry:
    def test_creation(self):
        entry = EliteScoreHistoryEntry(
            symbol="TUPRS",
            elite_score=75.0,
            elite_category=EliteCategory.GOOD,
            label=EliteLabel.EARLY_OPPORTUNITY,
        )
        assert entry.delta == 0.0
        assert entry.trend == EliteTrend.STABLE


class TestEliteRankingEntry:
    def test_creation(self):
        entry = EliteRankingEntry(
            symbol="TUPRS",
            elite_score=75.0,
            elite_category=EliteCategory.GOOD,
            label=EliteLabel.EARLY_OPPORTUNITY,
            rank=1,
        )
        assert entry.previous_rank is None
        assert entry.rank_change == 0


class TestEliteProfile:
    def test_creation(self):
        profile = EliteProfile(
            name="test",
            description="Test profile",
            dimension_weights={},
        )
        assert profile.is_active is True


class TestEliteCalculationRequest:
    def test_creation(self):
        request = EliteCalculationRequest(
            symbol="TUPRS",
            scores={"financial": 70.0},
        )
        assert request.profile_name == "balanced"
        assert request.horizon == InvestmentHorizon.ONE_MONTH


class TestBenchmarkResult:
    def test_creation(self):
        result = BenchmarkResult(
            operation="test",
            execution_time_ms=10.0,
            memory_mb=1.0,
            iterations=10,
            avg_time_ms=10.0,
            min_time_ms=8.0,
            max_time_ms=12.0,
            p95_time_ms=11.0,
        )
        assert result.success is True
        assert result.error_message is None


class TestClassifyElite:
    def test_avoid(self):
        assert classify_elite(10.0) == EliteCategory.AVOID
        assert classify_elite(0.0) == EliteCategory.AVOID
        assert classify_elite(20.0) == EliteCategory.AVOID

    def test_weak(self):
        assert classify_elite(21.0) == EliteCategory.WEAK
        assert classify_elite(30.0) == EliteCategory.WEAK
        assert classify_elite(40.0) == EliteCategory.WEAK

    def test_watch(self):
        assert classify_elite(41.0) == EliteCategory.WATCH
        assert classify_elite(50.0) == EliteCategory.WATCH
        assert classify_elite(60.0) == EliteCategory.WATCH

    def test_good(self):
        assert classify_elite(61.0) == EliteCategory.GOOD
        assert classify_elite(68.0) == EliteCategory.GOOD
        assert classify_elite(75.0) == EliteCategory.GOOD

    def test_strong(self):
        assert classify_elite(76.0) == EliteCategory.STRONG
        assert classify_elite(82.0) == EliteCategory.STRONG
        assert classify_elite(89.0) == EliteCategory.STRONG

    def test_elite(self):
        assert classify_elite(90.0) == EliteCategory.ELITE
        assert classify_elite(93.0) == EliteCategory.ELITE
        assert classify_elite(95.0) == EliteCategory.ELITE

    def test_exceptional(self):
        assert classify_elite(96.0) == EliteCategory.EXCEPTIONAL
        assert classify_elite(100.0) == EliteCategory.EXCEPTIONAL
        assert classify_elite(105.0) == EliteCategory.EXCEPTIONAL


class TestClassifyLabel:
    def test_high_conviction(self):
        bonuses = [
            BonusApplied(factor=BonusFactor.GOLDEN_CROSS, points=5.0, condition=""),
            BonusApplied(factor=BonusFactor.STRONG_EARNINGS, points=3.0, condition=""),
        ]
        assert classify_label(92.0, bonuses, []) == EliteLabel.HIGH_CONVICTION

    def test_breakout_candidate(self):
        bonuses = [
            BonusApplied(factor=BonusFactor.EARLY_BREAKOUT, points=5.0, condition=""),
        ]
        assert classify_label(80.0, bonuses, []) == EliteLabel.BREAKOUT_CANDIDATE

    def test_undervalued(self):
        bonuses = [
            BonusApplied(factor=BonusFactor.LOW_VALUATION, points=3.0, condition=""),
        ]
        assert classify_label(70.0, bonuses, []) == EliteLabel.UNDERVALUED

    def test_early_opportunity(self):
        assert classify_label(70.0, [], []) == EliteLabel.EARLY_OPPORTUNITY

    def test_high_risk_many_penalties(self):
        penalties = [
            PenaltyApplied(factor=PenaltyFactor.WEAK_LIQUIDITY, points=-5.0, condition=""),
            PenaltyApplied(factor=PenaltyFactor.HIGH_DEBT, points=-5.0, condition=""),
            PenaltyApplied(factor=PenaltyFactor.WEAK_EARNINGS, points=-4.0, condition=""),
        ]
        assert classify_label(50.0, [], penalties) == EliteLabel.HIGH_RISK

    def test_high_risk_low_score(self):
        assert classify_label(25.0, [], []) == EliteLabel.HIGH_RISK

    def test_watchlist(self):
        assert classify_label(45.0, [], []) == EliteLabel.WATCHLIST


class TestCategoryRanges:
    def test_all_categories_covered(self):
        assert len(CATEGORY_RANGES) == 7

    def test_ranges_correct(self):
        assert CATEGORY_RANGES[EliteCategory.AVOID] == (0.0, 20.0)
        assert CATEGORY_RANGES[EliteCategory.EXCEPTIONAL] == (96.0, 100.0)


class TestCategoryDescriptions:
    def test_all_descriptions(self):
        assert len(CATEGORY_DESCRIPTIONS) == 7
        for cat in EliteCategory:
            assert cat in CATEGORY_DESCRIPTIONS
            assert len(CATEGORY_DESCRIPTIONS[cat]) > 0


class TestLabelDescriptions:
    def test_all_descriptions(self):
        assert len(LABEL_DESCRIPTIONS) == 6
        for label in EliteLabel:
            assert label in LABEL_DESCRIPTIONS
            assert len(LABEL_DESCRIPTIONS[label]) > 0
