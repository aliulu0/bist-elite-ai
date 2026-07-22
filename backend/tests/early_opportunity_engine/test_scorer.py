import pytest
from modules.early_opportunity_engine.scoring.opportunity_scorer import OpportunityScorer
from modules.early_opportunity_engine.core.types import (
    AnalysisCategory, MarketRegimeType, OpportunityRating, OpportunityStage,
    RiskAssessment, StageResult,
)


class TestOpportunityScorer:
    def setup_method(self):
        self.scorer = OpportunityScorer()

    def test_empty_stages(self):
        result = self.scorer.compute_opportunity_score([], MarketRegimeType.SIDEWAYS)
        assert result.overall == 0.0

    def test_high_financial_score(self):
        sr = StageResult(
            category=AnalysisCategory.FINANCIAL, score=1.0, signals=[], warnings=[],
        )
        result = self.scorer.compute_opportunity_score([sr])
        assert result.financial == 100.0
        assert result.overall > 0.0

    def test_high_technical_score(self):
        sr = StageResult(
            category=AnalysisCategory.TECHNICAL, score=1.0, signals=[], warnings=[],
        )
        result = self.scorer.compute_opportunity_score([sr])
        assert result.technical == 100.0
        assert result.overall > 0.0

    def test_bull_regime_multiplier(self):
        sr = StageResult(
            category=AnalysisCategory.FINANCIAL, score=1.0, signals=[], warnings=[],
        )
        bull = self.scorer.compute_opportunity_score([sr], MarketRegimeType.BULL)
        sideways = self.scorer.compute_opportunity_score([sr], MarketRegimeType.SIDEWAYS)
        assert bull.overall > sideways.overall

    def test_bear_regime_penalty(self):
        sr = StageResult(
            category=AnalysisCategory.FINANCIAL, score=1.0, signals=[], warnings=[],
        )
        bear = self.scorer.compute_opportunity_score([sr], MarketRegimeType.BEAR)
        sideways = self.scorer.compute_opportunity_score([sr], MarketRegimeType.SIDEWAYS)
        assert bear.overall < sideways.overall

    def test_score_capped_at_100(self):
        stages = [
            StageResult(category=c, score=1.0, signals=[], warnings=[])
            for c in AnalysisCategory
        ]
        result = self.scorer.compute_opportunity_score(stages, MarketRegimeType.BULL)
        assert result.overall <= 100.0

    def test_determine_stage_low_score(self):
        stage = self.scorer.determine_stage(10.0, [])
        assert stage == OpportunityStage.STAGE_0_IGNORE

    def test_determine_stage_high_score(self):
        sr = StageResult(
            category=AnalysisCategory.SMART_MONEY, score=0.8, signals=[], warnings=[],
        )
        stage = self.scorer.determine_stage(95.0, [sr])
        assert stage == OpportunityStage.STAGE_7_LATE_OPPORTUNITY

    def test_determine_stage_mid_score(self):
        stage = self.scorer.determine_stage(50.0, [])
        assert stage.value.startswith("stage_")

    def test_determine_rating_exceptional(self):
        assert self.scorer.determine_rating(90.0) == OpportunityRating.EXCEPTIONAL

    def test_determine_rating_very_low(self):
        assert self.scorer.determine_rating(10.0) == OpportunityRating.VERY_LOW

    def test_determine_rating_medium(self):
        assert self.scorer.determine_rating(45.0) == OpportunityRating.MEDIUM

    def test_compute_confidence_no_signals(self):
        risk = RiskAssessment(
            score=0.3, drawdown_probability=0.2, liquidity_risk=0.1,
            volatility_risk=0.3, sector_risk=0.2,
        )
        assert self.scorer.compute_confidence([], risk) == 0.0

    def test_compute_confidence_with_signals(self):
        sr = StageResult(
            category=AnalysisCategory.FINANCIAL, score=0.8,
            signals=[None] * 5, warnings=[],
        )
        risk = RiskAssessment(
            score=0.2, drawdown_probability=0.1, liquidity_risk=0.1,
            volatility_risk=0.1, sector_risk=0.1,
        )
        conf = self.scorer.compute_confidence([sr], risk)
        assert conf > 0.0

    def test_expected_return(self):
        ret = self.scorer.compute_expected_return(
            OpportunityStage.STAGE_5_BREAKOUT, 80.0,
        )
        assert ret.expected > 0.0
        assert ret.optimistic >= ret.expected >= ret.conservative

    def test_expected_return_ignore(self):
        ret = self.scorer.compute_expected_return(
            OpportunityStage.STAGE_0_IGNORE, 10.0,
        )
        assert ret.expected == 0.0

    def test_determine_market_regime_high_vol(self):
        regime = self.scorer.determine_market_regime({"market_volatility": 35.0, "vix": 30.0})
        assert regime == MarketRegimeType.HIGH_VOLATILITY

    def test_determine_market_regime_low_vol(self):
        regime = self.scorer.determine_market_regime({"market_volatility": 10.0, "vix": 12.0})
        assert regime == MarketRegimeType.LOW_VOLATILITY

    def test_determine_market_regime_bull(self):
        regime = self.scorer.determine_market_regime({"market_trend": 1.0, "market_volatility": 20.0, "vix": 15.0})
        assert regime == MarketRegimeType.BULL

    def test_determine_market_regime_bear(self):
        regime = self.scorer.determine_market_regime({"market_trend": -1.0, "market_volatility": 20.0, "vix": 15.0})
        assert regime == MarketRegimeType.BEAR
