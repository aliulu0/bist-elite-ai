import pytest
from modules.decision_engine.core.types import (
    DecisionType,
    EntryTiming,
    ExitAction,
    DecisionDimension,
    InvestmentHorizon,
    ConflictSeverity,
    DecisionUrgency,
    ReportType,
    DataSource,
    EngineOutput,
    DimensionScore,
    Conflict,
    DecisionBonus,
    DecisionPenalty,
    EntryGuidance,
    ExitGuidance,
    PortfolioImpact,
    HorizonRecommendation,
    RecommendationPackage,
    DecisionResult,
    classify_decision,
    classify_urgency,
    classify_stability,
    classify_confidence_score,
)


class TestDecisionType:
    def test_all_values(self):
        values = [d.value for d in DecisionType]
        assert len(values) == 11
        assert "strong_buy" in values
        assert "distribution_risk" in values


class TestEntryTiming:
    def test_all_values(self):
        values = [e.value for e in EntryTiming]
        assert len(values) == 5
        assert "immediate_entry" in values
        assert "no_entry" in values


class TestExitAction:
    def test_all_values(self):
        values = [e.value for e in ExitAction]
        assert len(values) == 4
        assert "hold" in values
        assert "exit" in values


class TestDecisionDimension:
    def test_all_values(self):
        values = [d.value for d in DecisionDimension]
        assert len(values) == 13
        assert "financial_quality" in values
        assert "historical_similarity" in values


class TestInvestmentHorizon:
    def test_all_values(self):
        values = [h.value for h in InvestmentHorizon]
        assert len(values) == 5
        assert "weekly" in values
        assert "12_months" in values


class TestConflictSeverity:
    def test_all_values(self):
        values = [c.value for c in ConflictSeverity]
        assert len(values) == 4
        assert "low" in values
        assert "critical" in values


class TestDecisionUrgency:
    def test_all_values(self):
        values = [u.value for u in DecisionUrgency]
        assert len(values) == 5
        assert "immediate" in values
        assert "none" in values


class TestReportType:
    def test_all_values(self):
        values = [r.value for r in ReportType]
        assert len(values) == 6
        assert "executive" in values
        assert "telegram" in values


class TestDataSource:
    def test_all_values(self):
        values = [d.value for d in DataSource]
        assert len(values) == 12
        assert "unified_scoring" in values
        assert "market_regime" in values


class TestEngineOutput:
    def test_creation(self):
        eo = EngineOutput(
            source=DataSource.FINANCIAL,
            score=75.0,
            confidence=80.0,
            signals={"pe_ratio": 15.0},
            metadata={"provider": "test"},
        )
        assert eo.source == DataSource.FINANCIAL
        assert eo.score == 75.0
        assert eo.signals["pe_ratio"] == 15.0


class TestDimensionScore:
    def test_creation(self):
        ds = DimensionScore(
            dimension=DecisionDimension.MOMENTUM,
            raw_score=70.0,
            normalized_score=70.0,
            weight=0.1,
            contribution=7.0,
            confidence=75.0,
            evidence=["Strong RSI"],
        )
        assert ds.dimension == DecisionDimension.MOMENTUM
        assert ds.contribution == 7.0


class TestConflict:
    def test_creation(self):
        c = Conflict(
            dimension_a=DecisionDimension.CONFIDENCE,
            dimension_b=DecisionDimension.TECHNICAL_TREND,
            severity=ConflictSeverity.HIGH,
            description="Test conflict",
            explanation="Test explanation",
        )
        assert c.severity == ConflictSeverity.HIGH


class TestClassifyDecision:
    def test_strong_buy(self):
        assert classify_decision(95) == DecisionType.STRONG_BUY
        assert classify_decision(90) == DecisionType.STRONG_BUY

    def test_buy(self):
        assert classify_decision(85) == DecisionType.BUY
        assert classify_decision(80) == DecisionType.BUY

    def test_early_accumulation(self):
        assert classify_decision(75) == DecisionType.EARLY_ACCUMULATION

    def test_accumulate(self):
        assert classify_decision(65) == DecisionType.ACCUMULATE

    def test_watch(self):
        assert classify_decision(55) == DecisionType.WATCH

    def test_wait_confirmation(self):
        assert classify_decision(45) == DecisionType.WAIT_CONFIRMATION

    def test_neutral(self):
        assert classify_decision(35) == DecisionType.NEUTRAL

    def test_reduce(self):
        assert classify_decision(25) == DecisionType.REDUCE

    def test_take_profit(self):
        assert classify_decision(15) == DecisionType.TAKE_PROFIT

    def test_avoid(self):
        assert classify_decision(7) == DecisionType.AVOID

    def test_distribution_risk(self):
        assert classify_decision(2) == DecisionType.DISTRIBUTION_RISK
        assert classify_decision(0) == DecisionType.DISTRIBUTION_RISK

    def test_boundary_90(self):
        assert classify_decision(90) == DecisionType.STRONG_BUY

    def test_boundary_80(self):
        assert classify_decision(80) == DecisionType.BUY

    def test_boundary_100(self):
        assert classify_decision(100) == DecisionType.STRONG_BUY


class TestClassifyUrgency:
    def test_immediate(self):
        assert classify_urgency(90, 80) == DecisionUrgency.IMMEDIATE

    def test_high(self):
        assert classify_urgency(80, 65) == DecisionUrgency.HIGH

    def test_medium(self):
        assert classify_urgency(60, 50) == DecisionUrgency.MEDIUM

    def test_low(self):
        assert classify_urgency(40, 30) == DecisionUrgency.LOW

    def test_none(self):
        assert classify_urgency(20, 10) == DecisionUrgency.NONE


class TestClassifyStability:
    def test_empty(self):
        assert classify_stability({}) == 0.0

    def test_single(self):
        ds = DimensionScore(
            dimension=DecisionDimension.MOMENTUM,
            raw_score=70.0, normalized_score=70.0,
            weight=0.1, contribution=7.0, confidence=75.0,
        )
        assert classify_stability({DecisionDimension.MOMENTUM: ds}) == 100.0

    def test_identical_scores(self):
        ds1 = DimensionScore(DecisionDimension.MOMENTUM, 70.0, 70.0, 0.1, 7.0, 75.0)
        ds2 = DimensionScore(DecisionDimension.RISK, 70.0, 70.0, 0.1, 7.0, 75.0)
        result = classify_stability({
            DecisionDimension.MOMENTUM: ds1,
            DecisionDimension.RISK: ds2,
        })
        assert result == 100.0

    def test_divergent_scores(self):
        ds1 = DimensionScore(DecisionDimension.MOMENTUM, 90.0, 90.0, 0.1, 9.0, 75.0)
        ds2 = DimensionScore(DecisionDimension.RISK, 10.0, 10.0, 0.1, 1.0, 75.0)
        result = classify_stability({
            DecisionDimension.MOMENTUM: ds1,
            DecisionDimension.RISK: ds2,
        })
        assert result < 80.0


class TestClassifyConfidenceScore:
    def test_high(self):
        assert classify_confidence_score(85) == "high"

    def test_medium_high(self):
        assert classify_confidence_score(65) == "medium_high"

    def test_medium(self):
        assert classify_confidence_score(45) == "medium"

    def test_low(self):
        assert classify_confidence_score(25) == "low"

    def test_very_low(self):
        assert classify_confidence_score(5) == "very_low"


class TestDecisionBonus:
    def test_creation(self):
        b = DecisionBonus(factor="test", value=5.0, description="Test bonus")
        assert b.factor == "test"
        assert b.value == 5.0


class TestDecisionPenalty:
    def test_creation(self):
        p = DecisionPenalty(factor="test", value=3.0, description="Test penalty")
        assert p.factor == "test"


class TestEntryGuidance:
    def test_creation(self):
        eg = EntryGuidance(timing=EntryTiming.IMMEDIATE, max_position_pct=15.0)
        assert eg.timing == EntryTiming.IMMEDIATE


class TestExitGuidance:
    def test_creation(self):
        xg = ExitGuidance(action=ExitAction.HOLD, review_days=30)
        assert xg.action == ExitAction.HOLD


class TestPortfolioImpact:
    def test_creation(self):
        pi = PortfolioImpact(position_size_suggestion=10.0)
        assert pi.position_size_suggestion == 10.0
