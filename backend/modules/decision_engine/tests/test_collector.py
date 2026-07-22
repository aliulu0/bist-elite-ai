import pytest
from modules.decision_engine.decision_pipeline.collector import EngineOutputCollector
from modules.decision_engine.core.types import DataSource, EngineOutput


class TestEngineOutputCollector:
    def test_collect_dict(self):
        c = EngineOutputCollector()
        data = {
            "unified_scoring": {"score": 72.0, "confidence": 80.0, "signals": {}},
            "elite_score": {"score": 68.0, "confidence": 75.0, "signals": {}},
        }
        outputs = c.collect(data)
        assert len(outputs) == 2
        assert DataSource.UNIFIED_SCORING in outputs

    def test_collect_engine_output(self):
        c = EngineOutputCollector()
        eo = EngineOutput(source=DataSource.FINANCIAL, score=80.0, confidence=70.0)
        data = {"financial": eo}
        outputs = c.collect(data)
        assert len(outputs) == 1
        assert outputs[DataSource.FINANCIAL].score == 80.0

    def test_get(self):
        c = EngineOutputCollector()
        c.collect({"unified_scoring": {"score": 72.0, "confidence": 80.0}})
        assert c.get(DataSource.UNIFIED_SCORING) is not None

    def test_get_miss(self):
        c = EngineOutputCollector()
        assert c.get(DataSource.FINANCIAL) is None

    def test_get_score(self):
        c = EngineOutputCollector()
        c.collect({"unified_scoring": {"score": 72.0, "confidence": 80.0}})
        assert c.get_score(DataSource.UNIFIED_SCORING) == 72.0

    def test_get_score_default(self):
        c = EngineOutputCollector()
        assert c.get_score(DataSource.FINANCIAL, default=50.0) == 50.0

    def test_get_confidence(self):
        c = EngineOutputCollector()
        c.collect({"unified_scoring": {"score": 72.0, "confidence": 80.0}})
        assert c.get_confidence(DataSource.UNIFIED_SCORING) == 80.0

    def test_has_required(self):
        c = EngineOutputCollector()
        c.collect({
            "unified_scoring": {"score": 72.0, "confidence": 80.0},
            "elite_score": {"score": 68.0, "confidence": 75.0},
            "confidence": {"score": 65.0, "confidence": 70.0},
        })
        assert c.has_required() is True

    def test_has_required_missing(self):
        c = EngineOutputCollector()
        c.collect({"unified_scoring": {"score": 72.0, "confidence": 80.0}})
        assert c.has_required() is False

    def test_missing_required(self):
        c = EngineOutputCollector()
        c.collect({"unified_scoring": {"score": 72.0, "confidence": 80.0}})
        missing = c.missing_required()
        assert DataSource.ELITE_SCORE in missing
        assert DataSource.CONFIDENCE in missing

    def test_available_sources(self):
        c = EngineOutputCollector()
        c.collect({
            "unified_scoring": {"score": 72.0, "confidence": 80.0},
            "financial": {"score": 80.0, "confidence": 70.0},
        })
        sources = c.available_sources()
        assert len(sources) == 2

    def test_all_scores(self):
        c = EngineOutputCollector()
        c.collect({
            "unified_scoring": {"score": 72.0, "confidence": 80.0},
            "elite_score": {"score": 68.0, "confidence": 75.0},
        })
        scores = c.all_scores()
        assert scores["unified_scoring"] == 72.0

    def test_average_score(self):
        c = EngineOutputCollector()
        c.collect({
            "unified_scoring": {"score": 80.0, "confidence": 80.0},
            "elite_score": {"score": 60.0, "confidence": 75.0},
        })
        assert c.average_score() == 70.0

    def test_average_confidence(self):
        c = EngineOutputCollector()
        c.collect({
            "unified_scoring": {"score": 80.0, "confidence": 80.0},
            "elite_score": {"score": 60.0, "confidence": 60.0},
        })
        assert c.average_confidence() == 70.0

    def test_clear(self):
        c = EngineOutputCollector()
        c.collect({"unified_scoring": {"score": 72.0, "confidence": 80.0}})
        c.clear()
        assert c.count() == 0

    def test_count(self):
        c = EngineOutputCollector()
        c.collect({
            "unified_scoring": {"score": 72.0, "confidence": 80.0},
            "elite_score": {"score": 68.0, "confidence": 75.0},
        })
        assert c.count() == 2
