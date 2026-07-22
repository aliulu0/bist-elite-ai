from modules.explainability_engine.evidence_mapper.mapper import EvidenceMapper
from modules.explainability_engine.core.types import SignalDirection, SourceEngine, EvidenceObject


def _make_ev(ref, value, source, direction=SignalDirection.NEUTRAL, confidence=0.5, metric=""):
    return EvidenceObject(
        reference=ref, description=f"{ref} desc", source_engine=source,
        value=value, confidence=confidence, metric_name=metric or ref, direction=direction,
    )


class TestEvidenceMapper:
    def setup_method(self):
        self.mapper = EvidenceMapper()

    def test_map_pe_ratio(self):
        metrics = {"pe_ratio": 15.0, "close": 50.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="TEST")
        pe_ev = [e for e in evidence if e.metric_name == "pe_ratio"]
        assert len(pe_ev) == 1
        assert pe_ev[0].source_engine == SourceEngine.FINANCIAL
        assert pe_ev[0].value == 15.0
        assert pe_ev[0].confidence > 0

    def test_map_rsi(self):
        metrics = {"rsi": 30.0, "close": 50.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="TEST")
        rsi_ev = [e for e in evidence if e.metric_name == "rsi"]
        assert len(rsi_ev) == 1
        assert rsi_ev[0].source_engine == SourceEngine.INDICATOR

    def test_map_direction_positive(self):
        metrics = {"pe_ratio": 8.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        ev = [e for e in evidence if e.metric_name == "pe_ratio"][0]
        assert ev.direction == SignalDirection.POSITIVE

    def test_map_direction_negative(self):
        metrics = {"pe_ratio": 40.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        ev = [e for e in evidence if e.metric_name == "pe_ratio"][0]
        assert ev.direction == SignalDirection.NEGATIVE

    def test_map_direction_neutral(self):
        metrics = {"pe_ratio": 18.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        ev = [e for e in evidence if e.metric_name == "pe_ratio"][0]
        assert ev.direction == SignalDirection.NEUTRAL

    def test_map_unknown_metric_mapped_to_manual(self):
        metrics = {"unknown_metric_xyz": 1.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        assert len(evidence) == 1
        assert evidence[0].source_engine == SourceEngine.MANUAL

    def test_map_multiple_metrics(self):
        metrics = {"pe_ratio": 15.0, "rsi": 45.0, "obv_trend": 1.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="X")
        refs = {e.metric_name for e in evidence}
        assert "pe_ratio" in refs
        assert "rsi" in refs
        assert "obv_trend" in refs

    def test_map_non_numeric_skipped(self):
        metrics = {"pe_ratio": 15.0, "trend_direction": "up"}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        assert len(evidence) == 1

    def test_map_bool_converted(self):
        metrics = {"order_block": True}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        assert len(evidence) == 1
        assert evidence[0].value == 1.0

    def test_map_none_skipped(self):
        metrics = {"pe_ratio": None}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        assert len(evidence) == 0

    def test_map_min_confidence_filter(self):
        metrics = {"rsi": 50.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics, min_confidence=0.9)
        assert len(evidence) == 0

    def test_map_stage_results(self):
        class FakeCategory:
            def __init__(self, v):
                self.value = v
        class FakeStage:
            def __init__(self, cat, score):
                self.category = FakeCategory(cat)
                self.score = score
        stage_results = [FakeStage("financial", 0.7), FakeStage("technical", 0.4)]
        evidence = self.mapper.map_stage_results(stage_results, symbol="TEST")
        assert len(evidence) == 2
        refs = {e.metric_name for e in evidence}
        assert "financial_score" in refs
        assert "technical_score" in refs

    def test_map_signals(self):
        class FakeSignal:
            def __init__(self, name, strength, conf, desc):
                self.name = name
                self.strength = strength
                self.confidence = conf
                self.description = desc
        signals = [FakeSignal("BUY", 0.8, 0.7, "Bullish signal"), FakeSignal("HOLD", 0.4, 0.5, "Neutral")]
        evidence = self.mapper.map_signals(signals, symbol="TEST")
        assert len(evidence) == 2
        names = {e.metric_name for e in evidence}
        assert "BUY" in names
        assert "HOLD" in names

    def test_merge_evidence(self):
        ev1 = [_make_ev("pe_ratio", 15.0, SourceEngine.FINANCIAL, confidence=0.9)]
        ev2 = [_make_ev("pe_ratio", 14.0, SourceEngine.FINANCIAL, confidence=0.5)]
        merged = self.mapper.merge_evidence(ev1, ev2)
        assert len(merged) == 1
        assert merged[0].value == 15.0

    def test_merge_evidence_higher_confidence_wins(self):
        ev1 = [_make_ev("pe_ratio", 15.0, SourceEngine.FINANCIAL, confidence=0.5)]
        ev2 = [_make_ev("pe_ratio", 14.0, SourceEngine.FINANCIAL, confidence=0.9)]
        merged = self.mapper.merge_evidence(ev1, ev2)
        assert len(merged) == 1
        assert merged[0].value == 14.0

    def test_filter_by_engine(self):
        evidence = [
            _make_ev("pe", 15.0, SourceEngine.FINANCIAL),
            _make_ev("rsi", 45.0, SourceEngine.INDICATOR),
        ]
        filtered = self.mapper.filter_by_engine(evidence, SourceEngine.FINANCIAL)
        assert len(filtered) == 1
        assert filtered[0].metric_name == "pe"

    def test_filter_by_confidence(self):
        evidence = [
            _make_ev("pe", 15.0, SourceEngine.FINANCIAL, confidence=0.9),
            _make_ev("rsi", 45.0, SourceEngine.INDICATOR, confidence=0.2),
        ]
        filtered = self.mapper.filter_by_confidence(evidence, min_confidence=0.5)
        assert len(filtered) == 1
        assert filtered[0].metric_name == "pe"

    def test_filter_by_direction(self):
        evidence = [
            _make_ev("pe", 15.0, SourceEngine.FINANCIAL, direction=SignalDirection.POSITIVE),
            _make_ev("rsi", 45.0, SourceEngine.INDICATOR, direction=SignalDirection.NEUTRAL),
        ]
        filtered = self.mapper.filter_by_direction(evidence, SignalDirection.POSITIVE)
        assert len(filtered) == 1
        assert filtered[0].metric_name == "pe"

    def test_aggregate_by_engine(self):
        evidence = [
            _make_ev("pe", 15.0, SourceEngine.FINANCIAL),
            _make_ev("pb", 1.5, SourceEngine.FINANCIAL),
            _make_ev("rsi", 45.0, SourceEngine.INDICATOR),
        ]
        agg = self.mapper.aggregate_by_engine(evidence)
        assert SourceEngine.FINANCIAL.value in agg
        assert SourceEngine.INDICATOR.value in agg
        assert agg[SourceEngine.FINANCIAL.value] == 16.5

    def test_has_engine_key_map(self):
        assert "pe_ratio" in EvidenceMapper.ENGINE_KEY_MAP
        assert "rsi" in EvidenceMapper.ENGINE_KEY_MAP
        assert "volume_trend" not in EvidenceMapper.ENGINE_KEY_MAP
        assert "volume_ratio" in EvidenceMapper.ENGINE_KEY_MAP

    def test_has_metric_descriptions(self):
        assert "pe_ratio" in EvidenceMapper.METRIC_DESCRIPTIONS
        assert "rsi" in EvidenceMapper.METRIC_DESCRIPTIONS

    def test_symbol_in_reference(self):
        metrics = {"pe_ratio": 15.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="TUPRS")
        assert "TUPRS" in evidence[0].reference

    def test_no_symbol_in_reference(self):
        metrics = {"pe_ratio": 15.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        assert evidence[0].reference == "pe_ratio"
