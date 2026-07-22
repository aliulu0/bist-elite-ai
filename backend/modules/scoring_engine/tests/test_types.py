from modules.scoring_engine.core.types import (
    ScoreType, WeightProfile, InvestmentHorizon, MarketRegime,
    ScoringMethod, ScoreDirection, ScoreWeight, ScoreBreakdown,
    ScoreHistoryEntry, ScoreTrend, ScoreResult, WeightConfig,
    PenaltyRule, BonusRule, OptimizationResult, ScoringProfile,
)


class TestScoreType:
    def test_all_values(self):
        assert len(ScoreType) == 19

    def test_from_string(self):
        assert ScoreType("elite") == ScoreType.ELITE
        assert ScoreType("composite") == ScoreType.COMPOSITE

    def test_values(self):
        assert ScoreType.FINANCIAL.value == "financial"
        assert ScoreType.MOMENTUM.value == "momentum"
        assert ScoreType.RISK.value == "risk"


class TestWeightProfile:
    def test_all_values(self):
        assert len(WeightProfile) == 6
    def test_values(self):
        assert WeightProfile.BALANCED.value == "balanced"
        assert WeightProfile.AGGRESSIVE.value == "aggressive"


class TestInvestmentHorizon:
    def test_all_values(self):
        assert len(InvestmentHorizon) == 5


class TestMarketRegime:
    def test_all_values(self):
        assert len(MarketRegime) == 5


class TestScoringMethod:
    def test_all_values(self):
        assert ScoringMethod.WEIGHTED.value == "weighted"


class TestScoreWeight:
    def test_clamp(self):
        sw = ScoreWeight(score_type=ScoreType.FINANCIAL, weight=1.5, min_threshold=-5)
        clamped = sw.clamp()
        assert clamped.weight == 1.0
        assert clamped.min_threshold == 0.0

    def test_valid_weight(self):
        sw = ScoreWeight(score_type=ScoreType.FINANCIAL, weight=0.5)
        assert sw.clamp().weight == 0.5


class TestScoreBreakdown:
    def test_weighted_score(self):
        bd = ScoreBreakdown(
            score_type=ScoreType.FINANCIAL, raw_score=80.0,
            normalized_score=80.0, weight=0.2, contribution=16.0,
            penalty=0.0, bonus=0.0, final_contribution=16.0,
        )
        assert bd.weighted_score == 3.2


class TestScoreResult:
    def test_get_score(self):
        r = ScoreResult(symbol="TEST", scores={"financial": 75.0, "momentum": 60.0})
        assert r.get_score(ScoreType.FINANCIAL) == 75.0
        assert r.get_score(ScoreType.RISK) == 0.0

    def test_top_scores(self):
        r = ScoreResult(symbol="TEST", scores={
            "financial": 75.0, "momentum": 90.0, "risk": 60.0, "value": 85.0,
        })
        top = r.top_scores(2)
        assert top[0][0] == "momentum"
        assert top[1][0] == "value"


class TestWeightConfig:
    def test_get_weight(self):
        config = WeightConfig(
            profile=WeightProfile.BALANCED,
            horizon=InvestmentHorizon.ONE_MONTH,
            regime=MarketRegime.SIDEWAYS,
        )
        config.weights[ScoreType.FINANCIAL] = ScoreWeight(
            score_type=ScoreType.FINANCIAL, weight=0.15,
        )
        assert config.get_weight(ScoreType.FINANCIAL).weight == 0.15
        assert config.get_weight(ScoreType.RISK).weight == 0.0

    def test_total_weight(self):
        config = WeightConfig(
            profile=WeightProfile.BALANCED,
            horizon=InvestmentHorizon.ONE_MONTH,
            regime=MarketRegime.SIDEWAYS,
            weights={
                ScoreType.FINANCIAL: ScoreWeight(score_type=ScoreType.FINANCIAL, weight=0.5),
                ScoreType.MOMENTUM: ScoreWeight(score_type=ScoreType.MOMENTUM, weight=0.3),
            },
        )
        assert abs(config.total_weight() - 0.8) < 0.001


class TestPenaltyRule:
    def test_rule(self):
        rule = PenaltyRule(name="low_pe", condition="pe < 5", penalty_factor=0.2,
                          applies_to=[ScoreType.FINANCIAL])
        assert rule.enabled is True


class TestBonusRule:
    def test_rule(self):
        rule = BonusRule(name="high_momentum", condition="mom > 10", bonus_factor=0.15,
                        applies_to=[ScoreType.MOMENTUM])
        assert rule.enabled is True


class TestScoringProfile:
    def test_default(self):
        p = ScoringProfile(name="Test", profile=WeightProfile.BALANCED, description="Test profile")
        assert p.is_active is True
