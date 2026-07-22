import pytest
from modules.decision_engine.decision_pipeline.validator import OutputValidator
from modules.decision_engine.core.types import DataSource, EngineOutput


class TestOutputValidator:
    def setup_method(self):
        self.validator = OutputValidator()

    def test_valid_outputs(self):
        outputs = {
            DataSource.UNIFIED_SCORING: EngineOutput(DataSource.UNIFIED_SCORING, 72.0, 80.0),
            DataSource.ELITE_SCORE: EngineOutput(DataSource.ELITE_SCORE, 68.0, 75.0),
            DataSource.CONFIDENCE: EngineOutput(DataSource.CONFIDENCE, 65.0, 70.0),
        }
        result = self.validator.validate(outputs)
        assert result.is_valid is True
        assert len(result.errors) == 0

    def test_missing_required(self):
        outputs = {
            DataSource.UNIFIED_SCORING: EngineOutput(DataSource.UNIFIED_SCORING, 72.0, 80.0),
        }
        result = self.validator.validate(outputs)
        assert result.is_valid is False
        assert len(result.errors) > 0
        assert len(result.missing_sources) == 2

    def test_score_out_of_range(self):
        outputs = {
            DataSource.UNIFIED_SCORING: EngineOutput(DataSource.UNIFIED_SCORING, 150.0, 80.0),
            DataSource.ELITE_SCORE: EngineOutput(DataSource.ELITE_SCORE, 68.0, 75.0),
            DataSource.CONFIDENCE: EngineOutput(DataSource.CONFIDENCE, 65.0, 70.0),
        }
        result = self.validator.validate(outputs)
        assert len(result.score_anomalies) > 0

    def test_confidence_out_of_range(self):
        outputs = {
            DataSource.UNIFIED_SCORING: EngineOutput(DataSource.UNIFIED_SCORING, 72.0, 120.0),
            DataSource.ELITE_SCORE: EngineOutput(DataSource.ELITE_SCORE, 68.0, 75.0),
            DataSource.CONFIDENCE: EngineOutput(DataSource.CONFIDENCE, 65.0, 70.0),
        }
        result = self.validator.validate(outputs)
        assert len(result.score_anomalies) > 0

    def test_low_source_count(self):
        outputs = {
            DataSource.UNIFIED_SCORING: EngineOutput(DataSource.UNIFIED_SCORING, 72.0, 80.0),
        }
        result = self.validator.validate(outputs)
        assert len(result.warnings) > 0

    def test_valid_empty_no_errors_on_ranges(self):
        outputs = {
            DataSource.UNIFIED_SCORING: EngineOutput(DataSource.UNIFIED_SCORING, 50.0, 50.0),
            DataSource.ELITE_SCORE: EngineOutput(DataSource.ELITE_SCORE, 50.0, 50.0),
            DataSource.CONFIDENCE: EngineOutput(DataSource.CONFIDENCE, 50.0, 50.0),
        }
        result = self.validator.validate(outputs)
        assert len(result.score_anomalies) == 0
