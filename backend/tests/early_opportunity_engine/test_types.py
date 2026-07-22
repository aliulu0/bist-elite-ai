from modules.early_opportunity_engine.core.types import (
    OpportunityStage, OpportunityRating, MarketRegimeType, SignalType,
    AlertType, RedFlagType, ExpectedWindow, AnalysisCategory,
    AnalysisSignal, StageResult, RiskAssessment, SimilarityAnalysis,
    MarketRegime, EvidenceItem, EvidencePackage, EarlyWarning, RedFlag,
    OpportunityScore, ExpectedReturn, OpportunityResult, RankedOpportunity,
    OpportunityMetadata, BenchmarkResult,
)


class TestOpportunityStage:
    def test_stage_0_ignore(self):
        assert OpportunityStage.STAGE_0_IGNORE.value == "stage_0_ignore"

    def test_stage_1_silent(self):
        assert OpportunityStage.STAGE_1_SILENT_ACCUMULATION.value == "stage_1_silent_accumulation"

    def test_stage_2_early(self):
        assert OpportunityStage.STAGE_2_EARLY_SMART_MONEY.value == "stage_2_early_smart_money"

    def test_stage_3_institutional(self):
        assert OpportunityStage.STAGE_3_INSTITUTIONAL_ACCUMULATION.value == "stage_3_institutional_accumulation"

    def test_stage_4_breakout_prep(self):
        assert OpportunityStage.STAGE_4_BREAKOUT_PREPARATION.value == "stage_4_breakout_preparation"

    def test_stage_5_breakout(self):
        assert OpportunityStage.STAGE_5_BREAKOUT.value == "stage_5_breakout"

    def test_stage_6_trend(self):
        assert OpportunityStage.STAGE_6_TREND_EXPANSION.value == "stage_6_trend_expansion"

    def test_stage_7_late(self):
        assert OpportunityStage.STAGE_7_LATE_OPPORTUNITY.value == "stage_7_late_opportunity"

    def test_stage_count(self):
        assert len(OpportunityStage) == 8


class TestOpportunityRating:
    def test_values(self):
        assert OpportunityRating.VERY_LOW.value == "Very Low"
        assert OpportunityRating.LOW.value == "Low"
        assert OpportunityRating.MEDIUM.value == "Medium"
        assert OpportunityRating.HIGH.value == "High"
        assert OpportunityRating.VERY_HIGH.value == "Very High"
        assert OpportunityRating.EXCEPTIONAL.value == "Exceptional"

    def test_count(self):
        assert len(OpportunityRating) == 6


class TestMarketRegime:
    def test_values(self):
        assert MarketRegimeType.BULL.value == "bull"
        assert MarketRegimeType.BEAR.value == "bear"
        assert MarketRegimeType.SIDEWAYS.value == "sideways"
        assert MarketRegimeType.HIGH_VOLATILITY.value == "high_volatility"
        assert MarketRegimeType.LOW_VOLATILITY.value == "low_volatility"

    def test_count(self):
        assert len(MarketRegimeType) == 5


class TestOtherEnums:
    def test_signal_type(self):
        assert SignalType.BUY.value == "BUY"

    def test_alert_type(self):
        assert AlertType.OPPORTUNITY.value == "opportunity"

    def test_red_flag_type(self):
        assert RedFlagType.WEAK_VOLUME.value == "weak_volume"

    def test_expected_window(self):
        assert ExpectedWindow.ONE_WEEK.value == "1 week"

    def test_analysis_category(self):
        assert AnalysisCategory.FINANCIAL.value == "financial"
        assert len(AnalysisCategory) == 7


class TestDataclasses:
    def test_analysis_signal(self, analysis_signal):
        assert analysis_signal.name == "test_signal"
        assert analysis_signal.strength == 0.8

    def test_stage_result(self, stage_result):
        assert stage_result.score == 0.75
        assert len(stage_result.signals) == 1

    def test_risk_assessment(self, risk_assessment):
        assert risk_assessment.score == 0.3

    def test_opportunity_score(self):
        s = OpportunityScore(
            overall=75.0, financial=80.0, technical=70.0,
            volume=60.0, smart_money=85.0, pattern=50.0,
            risk=90.0, similarity=65.0, regime_adjustment=1.1,
        )
        assert s.overall == 75.0

    def test_expected_return(self, expected_return):
        assert expected_return.expected == 25.0

    def test_opportunity_result(self, full_result):
        assert full_result.symbol == "TEST"
        assert full_result.opportunity_score == 75.0

    def test_ranked_opportunity(self):
        r = RankedOpportunity(
            symbol="TST", opportunity_score=80.0,
            rating="High", stage="stage_5_breakout",
            confidence=75.0, risk_score=0.3, expected_return=20.0,
        )
        assert r.symbol == "TST"

    def test_benchmark_result(self):
        b = BenchmarkResult(
            iterations=1000, total_seconds=1.5, avg_ms=1.5,
            ops_per_second=666.7, memory_bytes=1024,
        )
        assert b.iterations == 1000
        assert b.ops_per_second == 666.7
