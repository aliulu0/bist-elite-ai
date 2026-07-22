import pytest
from modules.elite_score_engine.calculators.elite_calculator import (
    EliteScoreCalculator,
    EliteScoreTrendTracker,
    normalize_score,
    compute_dimension_contributions,
    compute_raw_score,
    evaluate_bonuses,
    evaluate_penalties,
    apply_bonuses_penalties,
)
from modules.elite_score_engine.core.types import (
    ScoringDimension,
    DimensionWeight,
    ScoreDirection,
    BonusFactor,
    BonusRule,
    PenaltyFactor,
    PenaltyRule,
    EliteWeightConfig,
    InvestmentHorizon,
    MarketRegime,
    SectorType,
    EliteCategory,
    EliteLabel,
    EliteTrend,
)
from modules.elite_score_engine.weights.profiles import get_profile_weights


class TestNormalizeScore:
    def test_normal(self):
        assert normalize_score(50.0) == 50.0

    def test_below_min(self):
        assert normalize_score(-10.0) == 0.0

    def test_above_max(self):
        assert normalize_score(110.0) == 100.0

    def test_equal_min_max(self):
        assert normalize_score(50.0, 50.0, 50.0) == 0.0


class TestComputeDimensionContributions:
    def test_basic(self):
        config = get_profile_weights("balanced")
        scores = {dim: 50.0 for dim in ScoringDimension}
        result = compute_dimension_contributions(scores, config)
        assert len(result) == 17
        for dim, contrib in result.items():
            assert contrib.normalized_score == 50.0

    def test_lower_is_better(self):
        config = get_profile_weights("balanced")
        scores = {ScoringDimension.RISK: 80.0}
        result = compute_dimension_contributions(scores, config)
        assert result[ScoringDimension.RISK].normalized_score == 20.0

    def test_missing_score_zero(self):
        config = get_profile_weights("balanced")
        result = compute_dimension_contributions({}, config)
        for dim, contrib in result.items():
            assert contrib.raw_score == 0.0
            if contrib.direction == ScoreDirection.LOWER_IS_BETTER:
                assert contrib.normalized_score == 100.0
            else:
                assert contrib.normalized_score == 0.0


class TestComputeRawScore:
    def test_basic(self):
        from modules.elite_score_engine.core.types import DimensionContribution
        contribs = {
            ScoringDimension.MOMENTUM: DimensionContribution(
                dimension=ScoringDimension.MOMENTUM,
                raw_score=50.0,
                normalized_score=50.0,
                weighted_score=3.5,
                contribution=3.5,
                direction=ScoreDirection.HIGHER_IS_BETTER,
                weight=0.07,
            ),
        }
        raw = compute_raw_score(contribs)
        assert raw == pytest.approx(50.0)

    def test_empty(self):
        assert compute_raw_score({}) == 0.0


class TestEvaluateBonuses:
    def test_golden_cross(self):
        dim_scores = {
            ScoringDimension.TREND_QUALITY: 75.0,
            ScoringDimension.MOMENTUM: 65.0,
        }
        rules = [BonusRule(factor=BonusFactor.GOLDEN_CROSS, points=5.0)]
        result = evaluate_bonuses({}, dim_scores, rules)
        assert len(result) == 1
        assert result[0].factor == BonusFactor.GOLDEN_CROSS

    def test_no_trigger(self):
        dim_scores = {
            ScoringDimension.TREND_QUALITY: 50.0,
            ScoringDimension.MOMENTUM: 50.0,
        }
        rules = [BonusRule(factor=BonusFactor.GOLDEN_CROSS, points=5.0)]
        result = evaluate_bonuses({}, dim_scores, rules)
        assert len(result) == 0

    def test_volume_explosion(self):
        dim_scores = {ScoringDimension.VOLUME: 85.0}
        rules = [BonusRule(factor=BonusFactor.VOLUME_EXPLOSION, points=3.0)]
        result = evaluate_bonuses({}, dim_scores, rules)
        assert len(result) == 1

    def test_low_valuation(self):
        dim_scores = {ScoringDimension.VALUATION: 75.0}
        rules = [BonusRule(factor=BonusFactor.LOW_VALUATION, points=2.0)]
        result = evaluate_bonuses({}, dim_scores, rules)
        assert len(result) == 1

    def test_smart_money(self):
        dim_scores = {ScoringDimension.SMART_MONEY: 70.0}
        rules = [BonusRule(factor=BonusFactor.SMART_MONEY_CONFIRMATION, points=2.0)]
        result = evaluate_bonuses({}, dim_scores, rules)
        assert len(result) == 1

    def test_institutional(self):
        dim_scores = {ScoringDimension.SMART_MONEY: 75.0}
        rules = [BonusRule(factor=BonusFactor.INSTITUTIONAL_ACCUMULATION, points=3.0)]
        result = evaluate_bonuses({}, dim_scores, rules)
        assert len(result) == 1

    def test_sector_rotation(self):
        dim_scores = {ScoringDimension.SECTOR_STRENGTH: 75.0}
        rules = [BonusRule(factor=BonusFactor.POSITIVE_SECTOR_ROTATION, points=2.0)]
        result = evaluate_bonuses({}, dim_scores, rules)
        assert len(result) == 1

    def test_strong_earnings(self):
        dim_scores = {ScoringDimension.GROWTH: 75.0}
        rules = [BonusRule(factor=BonusFactor.STRONG_EARNINGS, points=3.0)]
        result = evaluate_bonuses({}, dim_scores, rules)
        assert len(result) == 1

    def test_early_breakout(self):
        dim_scores = {
            ScoringDimension.TECHNICAL_STRUCTURE: 70.0,
            ScoringDimension.VOLUME: 65.0,
            ScoringDimension.MOMENTUM: 60.0,
        }
        rules = [BonusRule(factor=BonusFactor.EARLY_BREAKOUT, points=4.0)]
        result = evaluate_bonuses({}, dim_scores, rules)
        assert len(result) == 1


class TestEvaluatePenalties:
    def test_weak_liquidity(self):
        dim_scores = {ScoringDimension.LIQUIDITY: 20.0}
        rules = [PenaltyRule(factor=PenaltyFactor.WEAK_LIQUIDITY, points=-5.0)]
        result = evaluate_penalties({}, dim_scores, rules)
        assert len(result) == 1

    def test_high_debt(self):
        dim_scores = {ScoringDimension.FINANCIAL_QUALITY: 20.0}
        rules = [PenaltyRule(factor=PenaltyFactor.HIGH_DEBT, points=-5.0)]
        result = evaluate_penalties({}, dim_scores, rules)
        assert len(result) == 1

    def test_overbought(self):
        dim_scores = {ScoringDimension.TECHNICAL_STRUCTURE: 90.0}
        rules = [PenaltyRule(factor=PenaltyFactor.OVERBOUGHT, points=-3.0)]
        result = evaluate_penalties({}, dim_scores, rules)
        assert len(result) == 1

    def test_weak_earnings(self):
        dim_scores = {ScoringDimension.GROWTH: 20.0}
        rules = [PenaltyRule(factor=PenaltyFactor.WEAK_EARNINGS, points=-4.0)]
        result = evaluate_penalties({}, dim_scores, rules)
        assert len(result) == 1

    def test_distribution(self):
        dim_scores = {
            ScoringDimension.TREND_QUALITY: 20.0,
            ScoringDimension.MOMENTUM: 30.0,
        }
        rules = [PenaltyRule(factor=PenaltyFactor.DISTRIBUTION, points=-4.0)]
        result = evaluate_penalties({}, dim_scores, rules)
        assert len(result) == 1

    def test_late_trend(self):
        dim_scores = {
            ScoringDimension.TREND_QUALITY: 85.0,
            ScoringDimension.MOMENTUM: 30.0,
        }
        rules = [PenaltyRule(factor=PenaltyFactor.LATE_TREND, points=-3.0)]
        result = evaluate_penalties({}, dim_scores, rules)
        assert len(result) == 1

    def test_negative_divergence(self):
        dim_scores = {
            ScoringDimension.MOMENTUM: 75.0,
            ScoringDimension.TREND_QUALITY: 30.0,
        }
        rules = [PenaltyRule(factor=PenaltyFactor.NEGATIVE_DIVERGENCE, points=-4.0)]
        result = evaluate_penalties({}, dim_scores, rules)
        assert len(result) == 1

    def test_corporate_governance_always_false(self):
        dim_scores = {}
        rules = [PenaltyRule(factor=PenaltyFactor.CORPORATE_GOVERNANCE, points=-8.0)]
        result = evaluate_penalties({}, dim_scores, rules)
        assert len(result) == 0

    def test_no_trigger(self):
        dim_scores = {ScoringDimension.LIQUIDITY: 60.0}
        rules = [PenaltyRule(factor=PenaltyFactor.WEAK_LIQUIDITY, points=-5.0)]
        result = evaluate_penalties({}, dim_scores, rules)
        assert len(result) == 0


class TestApplyBonusesPenalties:
    def test_bonuses_increase(self):
        from modules.elite_score_engine.core.types import BonusApplied
        bonuses = [BonusApplied(factor=BonusFactor.GOLDEN_CROSS, points=5.0, condition="")]
        result = apply_bonuses_penalties(60.0, bonuses, [])
        assert result == 65.0

    def test_penalties_decrease(self):
        from modules.elite_score_engine.core.types import PenaltyApplied
        penalties = [PenaltyApplied(factor=PenaltyFactor.WEAK_LIQUIDITY, points=-5.0, condition="")]
        result = apply_bonuses_penalties(60.0, [], penalties)
        assert result == 55.0

    def test_clamp_max(self):
        from modules.elite_score_engine.core.types import BonusApplied
        bonuses = [BonusApplied(factor=BonusFactor.GOLDEN_CROSS, points=50.0, condition="")]
        result = apply_bonuses_penalties(90.0, bonuses, [])
        assert result == 100.0

    def test_clamp_min(self):
        from modules.elite_score_engine.core.types import PenaltyApplied
        penalties = [PenaltyApplied(factor=PenaltyFactor.WEAK_LIQUIDITY, points=-50.0, condition="")]
        result = apply_bonuses_penalties(10.0, [], penalties)
        assert result == 0.0


class TestEliteScoreCalculator:
    def test_basic(self):
        config = get_profile_weights("balanced")
        calc = EliteScoreCalculator(config)
        dim_scores = {dim: 50.0 for dim in ScoringDimension}
        result = calc.calculate("TUPRS", {"financial": 50.0}, dim_scores)
        assert result["symbol"] == "TUPRS"
        assert 0 <= result["elite_score"] <= 100
        assert result["raw_score"] > 0

    def test_high_scores_high_elite(self):
        config = get_profile_weights("balanced")
        calc = EliteScoreCalculator(config)
        dim_scores = {dim: 90.0 for dim in ScoringDimension}
        result = calc.calculate("TUPRS", {}, dim_scores)
        assert result["elite_score"] > 70

    def test_low_scores_low_elite(self):
        config = get_profile_weights("balanced")
        calc = EliteScoreCalculator(config)
        dim_scores = {dim: 10.0 for dim in ScoringDimension}
        result = calc.calculate("TUPRS", {}, dim_scores)
        assert result["elite_score"] < 40

    def test_bonuses_applied(self):
        config = get_profile_weights("balanced")
        calc = EliteScoreCalculator(config)
        dim_scores = {
            ScoringDimension.VOLUME: 85.0,
            ScoringDimension.TREND_QUALITY: 75.0,
            ScoringDimension.MOMENTUM: 65.0,
            ScoringDimension.GROWTH: 75.0,
        }
        result = calc.calculate("TUPRS", {}, dim_scores)
        assert len(result["bonuses"]) > 0

    def test_penalties_applied(self):
        config = get_profile_weights("balanced")
        calc = EliteScoreCalculator(config)
        dim_scores = {
            ScoringDimension.LIQUIDITY: 20.0,
            ScoringDimension.FINANCIAL_QUALITY: 20.0,
            ScoringDimension.GROWTH: 20.0,
        }
        result = calc.calculate("TUPRS", {}, dim_scores)
        assert len(result["penalties"]) > 0

    def test_evidence_count(self):
        config = get_profile_weights("balanced")
        calc = EliteScoreCalculator(config)
        dim_scores = {dim: 50.0 for dim in ScoringDimension}
        result = calc.calculate("TUPRS", {}, dim_scores)
        assert result["evidence_count"] == 17

    def test_config_property(self):
        config = get_profile_weights("balanced")
        calc = EliteScoreCalculator(config)
        assert calc.config is config


class TestEliteScoreTrendTracker:
    def test_record(self):
        tracker = EliteScoreTrendTracker()
        entry = tracker.record("TUPRS", 75.0, EliteCategory.GOOD, EliteLabel.EARLY_OPPORTUNITY, InvestmentHorizon.ONE_MONTH)
        assert entry.elite_score == 75.0

    def test_history(self):
        tracker = EliteScoreTrendTracker()
        tracker.record("TUPRS", 70.0, EliteCategory.WATCH, EliteLabel.WATCHLIST, InvestmentHorizon.ONE_MONTH)
        tracker.record("TUPRS", 75.0, EliteCategory.GOOD, EliteLabel.EARLY_OPPORTUNITY, InvestmentHorizon.ONE_MONTH)
        history = tracker.get_history("TUPRS", InvestmentHorizon.ONE_MONTH)
        assert len(history) == 2

    def test_trend_stable(self):
        tracker = EliteScoreTrendTracker()
        for _ in range(5):
            tracker.record("TUPRS", 50.0, EliteCategory.WATCH, EliteLabel.WATCHLIST, InvestmentHorizon.ONE_MONTH)
        trend = tracker.get_trend("TUPRS", InvestmentHorizon.ONE_MONTH)
        assert trend == EliteTrend.STABLE

    def test_trend_improving(self):
        tracker = EliteScoreTrendTracker()
        for score in [40, 45, 50, 55, 60]:
            tracker.record("TUPRS", float(score), EliteCategory.WATCH, EliteLabel.WATCHLIST, InvestmentHorizon.ONE_MONTH)
        trend = tracker.get_trend("TUPRS", InvestmentHorizon.ONE_MONTH)
        assert trend == EliteTrend.IMPROVING

    def test_trend_declining(self):
        tracker = EliteScoreTrendTracker()
        for score in [80, 75, 70, 65, 60]:
            tracker.record("TUPRS", float(score), EliteCategory.STRONG, EliteLabel.HIGH_CONVICTION, InvestmentHorizon.ONE_MONTH)
        trend = tracker.get_trend("TUPRS", InvestmentHorizon.ONE_MONTH)
        assert trend == EliteTrend.DECLINING

    def test_trend_volatile(self):
        tracker = EliteScoreTrendTracker()
        for score in [40, 80, 30, 90, 20]:
            tracker.record("TUPRS", float(score), EliteCategory.WATCH, EliteLabel.WATCHLIST, InvestmentHorizon.ONE_MONTH)
        trend = tracker.get_trend("TUPRS", InvestmentHorizon.ONE_MONTH)
        assert trend == EliteTrend.VOLATILE

    def test_no_history(self):
        tracker = EliteScoreTrendTracker()
        trend = tracker.get_trend("NONEXIST", InvestmentHorizon.ONE_MONTH)
        assert trend is None

    def test_clear(self):
        tracker = EliteScoreTrendTracker()
        tracker.record("TUPRS", 50.0, EliteCategory.WATCH, EliteLabel.WATCHLIST, InvestmentHorizon.ONE_MONTH)
        tracker.clear()
        assert tracker.get_history("TUPRS", InvestmentHorizon.ONE_MONTH) == []

    def test_max_history(self):
        tracker = EliteScoreTrendTracker(max_history=5)
        for i in range(10):
            tracker.record("TUPRS", float(50 + i), EliteCategory.WATCH, EliteLabel.WATCHLIST, InvestmentHorizon.ONE_MONTH)
        history = tracker.get_history("TUPRS", InvestmentHorizon.ONE_MONTH, limit=100)
        assert len(history) == 5

    def test_delta_computed(self):
        tracker = EliteScoreTrendTracker()
        tracker.record("TUPRS", 50.0, EliteCategory.WATCH, EliteLabel.WATCHLIST, InvestmentHorizon.ONE_MONTH)
        entry = tracker.record("TUPRS", 55.0, EliteCategory.WATCH, EliteLabel.WATCHLIST, InvestmentHorizon.ONE_MONTH)
        assert entry.delta == 5.0

    def test_first_entry_no_delta(self):
        tracker = EliteScoreTrendTracker()
        entry = tracker.record("TUPRS", 50.0, EliteCategory.WATCH, EliteLabel.WATCHLIST, InvestmentHorizon.ONE_MONTH)
        assert entry.delta == 0.0
