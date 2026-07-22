import pytest
from modules.confidence_engine.core.types import (
    ConfidenceLabel,
    ConfidenceDimension,
    ConfidenceTrend,
    BonusFactor,
    PenaltyFactor,
    ReportType,
    DimensionWeight,
    BonusRule,
    PenaltyRule,
    ConfidenceWeightConfig,
    DimensionContribution,
    BonusApplied,
    PenaltyApplied,
    ConfidenceWarning,
    ConfidenceResult,
    ConfidenceHistoryEntry,
    ConfidenceTrendResult,
    ConfidenceProfile,
    ConfidenceCalculationRequest,
    BenchmarkResult,
    ConfidenceReport,
    LABEL_RANGES,
    LABEL_DESCRIPTIONS,
    DIMENSION_DESCRIPTIONS,
    classify_confidence,
    normalize_score,
)


class TestConfidenceLabel:
    def test_values(self):
        assert ConfidenceLabel.VERY_LOW.value == "very_low"
        assert ConfidenceLabel.LOW.value == "low"
        assert ConfidenceLabel.MEDIUM.value == "medium"
        assert ConfidenceLabel.HIGH.value == "high"
        assert ConfidenceLabel.VERY_HIGH.value == "very_high"
        assert ConfidenceLabel.EXCEPTIONAL.value == "exceptional"

    def test_count(self):
        assert len(ConfidenceLabel) == 6


class TestConfidenceDimension:
    def test_count(self):
        assert len(ConfidenceDimension) == 11

    def test_all_present(self):
        expected = [
            "data", "signal", "evidence", "model", "historical",
            "pattern", "risk", "market", "sector", "execution", "liquidity",
        ]
        for e in expected:
            assert ConfidenceDimension(e) is not None


class TestConfidenceTrend:
    def test_values(self):
        assert ConfidenceTrend.IMPROVING.value == "improving"
        assert ConfidenceTrend.STABLE.value == "stable"
        assert ConfidenceTrend.DECLINING.value == "declining"
        assert ConfidenceTrend.VOLATILE.value == "volatile"


class TestBonusFactor:
    def test_count(self):
        assert len(BonusFactor) == 5


class TestPenaltyFactor:
    def test_count(self):
        assert len(PenaltyFactor) == 6


class TestReportType:
    def test_count(self):
        assert len(ReportType) == 4


class TestDimensionWeight:
    def test_creation(self):
        dw = DimensionWeight(
            dimension=ConfidenceDimension.DATA,
            weight=0.1,
            min_value=0.0,
            max_value=100.0,
            description="Test",
        )
        assert dw.dimension == ConfidenceDimension.DATA
        assert dw.weight == 0.1


class TestBonusRule:
    def test_creation(self):
        br = BonusRule(factor=BonusFactor.STRONG_CONFIRMATION, points=5.0, condition="signal > 75")
        assert br.factor == BonusFactor.STRONG_CONFIRMATION
        assert br.points == 5.0


class TestPenaltyRule:
    def test_creation(self):
        pr = PenaltyRule(factor=PenaltyFactor.WEAK_DATA, points=-5.0, condition="data < 35")
        assert pr.factor == PenaltyFactor.WEAK_DATA
        assert pr.points == -5.0


class TestConfidenceWeightConfig:
    def test_creation(self):
        config = ConfidenceWeightConfig(profile_name="test", dimensions={})
        assert config.profile_name == "test"
        assert config.total_weight == 1.0


class TestDimensionContribution:
    def test_creation(self):
        dc = DimensionContribution(
            dimension=ConfidenceDimension.DATA,
            raw_score=70.0,
            normalized_score=70.0,
            weighted_score=7.0,
            contribution=7.0,
            weight=0.1,
        )
        assert dc.evidence_count == 0
        assert dc.details == {}


class TestBonusApplied:
    def test_creation(self):
        ba = BonusApplied(factor=BonusFactor.STRONG_CONFIRMATION, points=5.0, condition="strong")
        assert ba.applied_count == 1


class TestPenaltyApplied:
    def test_creation(self):
        pa = PenaltyApplied(factor=PenaltyFactor.WEAK_DATA, points=-5.0, condition="weak")
        assert pa.applied_count == 1


class TestConfidenceWarning:
    def test_creation(self):
        w = ConfidenceWarning(dimension="data", message="Low quality", severity="high")
        assert w.severity == "high"


class TestConfidenceResult:
    def test_creation(self):
        result = ConfidenceResult(
            symbol="TUPRS",
            confidence_score=75.0,
            confidence_label=ConfidenceLabel.HIGH,
            dimension_contributions={},
            bonuses=[],
            penalties=[],
            warnings=[],
            raw_score=70.0,
            total_weight=1.0,
        )
        assert result.symbol == "TUPRS"
        assert result.calculation_id is not None
        assert result.calculated_at is not None


class TestConfidenceHistoryEntry:
    def test_creation(self):
        entry = ConfidenceHistoryEntry(
            symbol="TUPRS",
            confidence_score=75.0,
            confidence_label=ConfidenceLabel.HIGH,
        )
        assert entry.delta == 0.0
        assert entry.trend == ConfidenceTrend.STABLE


class TestConfidenceCalculationRequest:
    def test_creation(self):
        req = ConfidenceCalculationRequest(symbol="TUPRS", scores={"financial": 70.0})
        assert req.profile_name == "standard"


class TestBenchmarkResult:
    def test_creation(self):
        result = BenchmarkResult(
            operation="test", execution_time_ms=10.0, memory_mb=1.0,
            iterations=10, avg_time_ms=10.0, min_time_ms=8.0,
            max_time_ms=12.0, p95_time_ms=11.0,
        )
        assert result.success is True


class TestClassifyConfidence:
    def test_very_low(self):
        assert classify_confidence(10.0) == ConfidenceLabel.VERY_LOW
        assert classify_confidence(0.0) == ConfidenceLabel.VERY_LOW

    def test_low(self):
        assert classify_confidence(25.0) == ConfidenceLabel.LOW
        assert classify_confidence(40.0) == ConfidenceLabel.LOW

    def test_medium(self):
        assert classify_confidence(45.0) == ConfidenceLabel.MEDIUM
        assert classify_confidence(60.0) == ConfidenceLabel.MEDIUM

    def test_high(self):
        assert classify_confidence(65.0) == ConfidenceLabel.HIGH
        assert classify_confidence(80.0) == ConfidenceLabel.HIGH

    def test_very_high(self):
        assert classify_confidence(85.0) == ConfidenceLabel.VERY_HIGH
        assert classify_confidence(95.0) == ConfidenceLabel.VERY_HIGH

    def test_exceptional(self):
        assert classify_confidence(96.0) == ConfidenceLabel.EXCEPTIONAL
        assert classify_confidence(100.0) == ConfidenceLabel.EXCEPTIONAL


class TestNormalizeScore:
    def test_normal(self):
        assert normalize_score(50.0) == 50.0

    def test_below_min(self):
        assert normalize_score(-10.0) == 0.0

    def test_above_max(self):
        assert normalize_score(110.0) == 100.0

    def test_equal_bounds(self):
        assert normalize_score(50.0, 50.0, 50.0) == 0.0


class TestLabelRanges:
    def test_all_labels_covered(self):
        assert len(LABEL_RANGES) == 6

    def test_ranges_correct(self):
        assert LABEL_RANGES[ConfidenceLabel.VERY_LOW] == (0.0, 20.0)
        assert LABEL_RANGES[ConfidenceLabel.EXCEPTIONAL] == (96.0, 100.0)


class TestLabelDescriptions:
    def test_all_descriptions(self):
        assert len(LABEL_DESCRIPTIONS) == 6
        for label in ConfidenceLabel:
            assert label in LABEL_DESCRIPTIONS


class TestDimensionDescriptions:
    def test_all_descriptions(self):
        assert len(DIMENSION_DESCRIPTIONS) == 11
        for dim in ConfidenceDimension:
            assert dim in DIMENSION_DESCRIPTIONS
