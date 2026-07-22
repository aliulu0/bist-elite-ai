import pytest
from modules.decision_engine.decision_pipeline.confidence_calculator import DecisionConfidenceCalculator
from modules.decision_engine.core.types import (
    Conflict,
    ConflictSeverity,
    DecisionDimension,
    DimensionScore,
)


class TestDecisionConfidenceCalculator:
    def setup_method(self):
        self.calc = DecisionConfidenceCalculator()

    def _make_ds(self, dim, score, conf=70.0):
        return DimensionScore(dim, score, score, 0.1, score * 0.1, conf)

    def test_empty(self):
        assert self.calc.calculate({}, []) == 0.0

    def test_coherency_high(self):
        scores = {
            DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 70.0, 80.0),
            DecisionDimension.RISK: self._make_ds(DecisionDimension.RISK, 72.0, 80.0),
            DecisionDimension.CONFIDENCE: self._make_ds(DecisionDimension.CONFIDENCE, 68.0, 80.0),
        }
        result = self.calc.calculate(scores, [])
        assert result >= 60

    def test_coherency_low(self):
        scores = {
            DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 95.0, 80.0),
            DecisionDimension.RISK: self._make_ds(DecisionDimension.RISK, 10.0, 80.0),
        }
        result = self.calc.calculate(scores, [])
        assert result < 70

    def test_conflict_penalty(self):
        scores = {
            DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 70.0, 80.0),
            DecisionDimension.RISK: self._make_ds(DecisionDimension.RISK, 70.0, 80.0),
        }
        conflicts = [
            Conflict(DecisionDimension.MOMENTUM, DecisionDimension.RISK, ConflictSeverity.CRITICAL, "a", "b"),
        ]
        result_with = self.calc.calculate(scores, conflicts)
        result_without = self.calc.calculate(scores, [])
        assert result_with < result_without

    def test_coverage(self):
        scores = {DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 70.0, 80.0)}
        result = self.calc.calculate(scores, [])
        assert result > 0

    def test_label(self):
        assert self.calc.label(85) == "high"
        assert self.calc.label(45) == "medium"
        assert self.calc.label(5) == "very_low"

    def test_bounded(self):
        scores = {DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 100.0, 100.0)}
        result = self.calc.calculate(scores, [])
        assert 0 <= result <= 100
