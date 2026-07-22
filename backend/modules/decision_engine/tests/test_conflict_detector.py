import pytest
from modules.decision_engine.decision_pipeline.conflict_detector import ConflictDetector
from modules.decision_engine.core.types import (
    ConflictSeverity,
    DecisionDimension,
    DimensionScore,
)


class TestConflictDetector:
    def setup_method(self):
        self.detector = ConflictDetector()

    def _make_ds(self, dim, score, conf=70.0):
        return DimensionScore(dim, score, score, 0.1, score * 0.1, conf)

    def test_no_conflicts(self):
        scores = {
            DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 70.0),
            DecisionDimension.RISK: self._make_ds(DecisionDimension.RISK, 65.0),
            DecisionDimension.CONFIDENCE: self._make_ds(DecisionDimension.CONFIDENCE, 72.0),
        }
        conflicts = self.detector.detect(scores)
        assert len(conflicts) == 0

    def test_confidence_vs_trend(self):
        scores = {
            DecisionDimension.CONFIDENCE: self._make_ds(DecisionDimension.CONFIDENCE, 90.0),
            DecisionDimension.TECHNICAL_TREND: self._make_ds(DecisionDimension.TECHNICAL_TREND, 20.0),
        }
        conflicts = self.detector.detect(scores)
        assert len(conflicts) >= 1
        assert any("confidence" in c.description.lower() or "technical" in c.description.lower() for c in conflicts)

    def test_financial_vs_momentum(self):
        scores = {
            DecisionDimension.FINANCIAL_QUALITY: self._make_ds(DecisionDimension.FINANCIAL_QUALITY, 85.0),
            DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 15.0),
        }
        conflicts = self.detector.detect(scores)
        assert len(conflicts) >= 1

    def test_pattern_vs_smart_money(self):
        scores = {
            DecisionDimension.PATTERN_QUALITY: self._make_ds(DecisionDimension.PATTERN_QUALITY, 88.0),
            DecisionDimension.SMART_MONEY: self._make_ds(DecisionDimension.SMART_MONEY, 25.0),
        }
        conflicts = self.detector.detect(scores)
        assert len(conflicts) >= 1

    def test_extreme_spread(self):
        scores = {
            DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 95.0),
            DecisionDimension.RISK: self._make_ds(DecisionDimension.RISK, 10.0),
            DecisionDimension.CONFIDENCE: self._make_ds(DecisionDimension.CONFIDENCE, 90.0),
        }
        conflicts = self.detector.detect(scores)
        assert any(c.severity in (ConflictSeverity.HIGH, ConflictSeverity.CRITICAL) for c in conflicts)

    def test_has_critical(self):
        scores = {
            DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 98.0),
            DecisionDimension.RISK: self._make_ds(DecisionDimension.RISK, 2.0),
            DecisionDimension.CONFIDENCE: self._make_ds(DecisionDimension.CONFIDENCE, 95.0),
        }
        conflicts = self.detector.detect(scores)
        assert self.detector.has_critical_conflicts(conflicts) is True

    def test_has_high(self):
        scores = {
            DecisionDimension.CONFIDENCE: self._make_ds(DecisionDimension.CONFIDENCE, 90.0),
            DecisionDimension.TECHNICAL_TREND: self._make_ds(DecisionDimension.TECHNICAL_TREND, 20.0),
        }
        conflicts = self.detector.detect(scores)
        assert self.detector.has_high_conflicts(conflicts) is True

    def test_severity_score_empty(self):
        assert self.detector.severity_score([]) == 0.0

    def test_severity_score(self):
        from modules.decision_engine.core.types import Conflict
        conflicts = [
            Conflict(DecisionDimension.MOMENTUM, DecisionDimension.RISK, ConflictSeverity.HIGH, "a", "b"),
            Conflict(DecisionDimension.CONFIDENCE, DecisionDimension.RISK, ConflictSeverity.MEDIUM, "c", "d"),
        ]
        score = self.detector.severity_score(conflicts)
        assert score > 0
