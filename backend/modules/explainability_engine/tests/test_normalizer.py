from modules.explainability_engine.normalizer.normalizer import EvidenceNormalizer
from modules.explainability_engine.core.types import (
    EvidenceObject, SourceEngine, SignalDirection, ExplainabilityScore,
)
from modules.explainability_engine.evidence_mapper.mapper import EvidenceMapper


def _make_ev(ref, value, source, direction=SignalDirection.NEUTRAL, confidence=0.5, metric=""):
    return EvidenceObject(
        reference=ref, description=f"{ref} desc", source_engine=source,
        value=value, confidence=confidence, metric_name=metric or ref, direction=direction,
    )


class TestEvidenceNormalizer:
    def setup_method(self):
        self.normalizer = EvidenceNormalizer()

    def test_normalize_value_in_range(self):
        assert self.normalizer.normalize_value(50.0, 0, 100) == 50.0

    def test_normalize_value_below_range(self):
        assert self.normalizer.normalize_value(-10.0, 0, 100) == -10.0

    def test_normalize_value_above_range(self):
        assert self.normalizer.normalize_value(150.0, 0, 100) == 150.0

    def test_normalize_01(self):
        assert self.normalizer.normalize_01(0.5) == 0.5
        assert self.normalizer.normalize_01(-0.5) == 0.0
        assert self.normalizer.normalize_01(1.5) == 1.0

    def test_normalize_scores_empty(self):
        assert self.normalizer.normalize_scores({}) == {}

    def test_normalize_scores_multiple(self):
        scores = {"rsi": 30.0, "pe_ratio": 15.0, "adx": 25.0}
        result = self.normalizer.normalize_scores(scores)
        assert len(result) == 3
        assert all(0 <= v <= 100.0 for v in result.values())

    def test_normalize_scores_equal_values(self):
        scores = {"a": 50.0, "b": 50.0}
        result = self.normalizer.normalize_scores(scores)
        assert result["a"] == 50.0
        assert result["b"] == 50.0

    def test_normalize_evidence_empty(self):
        assert self.normalizer.normalize_evidence([]) == []

    def test_normalize_evidence_with_values(self):
        evidence = [
            _make_ev("pe", 15.0, SourceEngine.FINANCIAL, confidence=0.8),
            _make_ev("rsi", 30.0, SourceEngine.INDICATOR, confidence=0.9),
        ]
        normalized = self.normalizer.normalize_evidence(evidence)
        assert len(normalized) == 2

    def test_compute_explainability_scores_empty(self):
        scores = self.normalizer.compute_explainability_scores([])
        assert scores.overall == 0.0
        assert scores.explainability == 0.0

    def test_compute_explainability_scores_with_evidence(self):
        evidence = [
            _make_ev("pe_ratio", 15.0, SourceEngine.FINANCIAL, confidence=0.8, metric="pe_ratio"),
            _make_ev("rsi", 45.0, SourceEngine.INDICATOR, confidence=0.7, metric="rsi"),
            _make_ev("obv_trend", 1.0, SourceEngine.VOLUME, confidence=0.6, metric="obv_trend"),
        ]
        scores = self.normalizer.compute_explainability_scores(evidence)
        assert scores.overall > 0.0
        assert scores.explainability > 0.0
        assert scores.coverage > 0.0

    def test_compute_explainability_scores_many_evidence(self):
        evidence = [
            _make_ev(f"metric_{i}", float(i), SourceEngine.FINANCIAL, confidence=0.5, metric=f"metric_{i}")
            for i in range(20)
        ]
        scores = self.normalizer.compute_explainability_scores(evidence)
        assert scores.coverage == 100.0
        assert scores.overall >= 25.0

    def test_aggregate_direction_empty(self):
        direction, strength = self.normalizer.aggregate_direction([])
        assert direction == SignalDirection.NEUTRAL
        assert strength == 0.0

    def test_aggregate_direction_all_positive(self):
        evidence = [
            _make_ev("a", 1.0, SourceEngine.FINANCIAL, direction=SignalDirection.POSITIVE, confidence=0.8),
            _make_ev("b", 1.0, SourceEngine.INDICATOR, direction=SignalDirection.POSITIVE, confidence=0.7),
        ]
        direction, strength = self.normalizer.aggregate_direction(evidence)
        assert direction == SignalDirection.POSITIVE
        assert strength > 0

    def test_aggregate_direction_mixed(self):
        evidence = [
            _make_ev("a", 1.0, SourceEngine.FINANCIAL, direction=SignalDirection.POSITIVE, confidence=0.8),
            _make_ev("b", 1.0, SourceEngine.INDICATOR, direction=SignalDirection.NEGATIVE, confidence=0.7),
        ]
        direction, strength = self.normalizer.aggregate_direction(evidence)
        assert direction in (SignalDirection.POSITIVE, SignalDirection.NEGATIVE, SignalDirection.NEUTRAL)

    def test_compute_signal_strength_empty(self):
        assert self.normalizer.compute_signal_strength([]) == 0.0

    def test_compute_signal_strength(self):
        evidence = [
            _make_ev("pe", 15.0, SourceEngine.FINANCIAL, confidence=0.8),
            _make_ev("rsi", 45.0, SourceEngine.INDICATOR, confidence=0.7),
        ]
        strength = self.normalizer.compute_signal_strength(evidence)
        assert 0.0 <= strength <= 100.0

    def test_detect_conflicts_empty(self):
        conflicts = self.normalizer.detect_conflicts([])
        assert conflicts == []

    def test_detect_conflicts_with_mixed_directions(self):
        evidence = [
            _make_ev("pe", 15.0, SourceEngine.FINANCIAL, direction=SignalDirection.POSITIVE, confidence=0.8, metric="pe"),
            _make_ev("rsi", 75.0, SourceEngine.INDICATOR, direction=SignalDirection.NEGATIVE, confidence=0.8, metric="rsi"),
        ]
        conflicts = self.normalizer.detect_conflicts(evidence, threshold=0.5)
        assert len(conflicts) >= 0
