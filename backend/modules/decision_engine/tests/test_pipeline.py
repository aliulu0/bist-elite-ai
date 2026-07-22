import pytest
from modules.decision_engine.decision_pipeline.pipeline import DecisionPipeline
from modules.decision_engine.core.types import (
    DecisionType,
    DecisionUrgency,
    EntryTiming,
    ExitAction,
)


class TestDecisionPipeline:
    def setup_method(self):
        self.pipeline = DecisionPipeline()

    def _full_data(self):
        return {
            "unified_scoring": {
                "score": 72.0,
                "confidence": 80.0,
                "signals": {"financial": 75.0, "valuation": 70.0},
            },
            "elite_score": {
                "score": 68.0,
                "confidence": 75.0,
                "signals": {"trend": 70.0, "momentum": 65.0, "smart_money": 72.0, "pattern": 68.0},
            },
            "confidence": {
                "score": 65.0,
                "confidence": 70.0,
                "signals": {
                    "risk": 60.0,
                    "sector": 72.0,
                    "market": 68.0,
                    "liquidity": 75.0,
                    "confidence": 70.0,
                    "similarity": 65.0,
                },
            },
        }

    def test_execute_full(self):
        result = self.pipeline.execute("TUPRS", self._full_data())
        assert result.symbol == "TUPRS"
        assert 0 <= result.decision_score <= 100
        assert result.decision_label is not None
        assert result.recommendation is not None

    def test_execute_minimal(self):
        data = {
            "unified_scoring": {"score": 50.0, "confidence": 50.0, "signals": {}},
            "elite_score": {"score": 50.0, "confidence": 50.0, "signals": {}},
            "confidence": {"score": 50.0, "confidence": 50.0, "signals": {}},
        }
        result = self.pipeline.execute("GARAN", data)
        assert result.symbol == "GARAN"
        assert result.decision_score >= 0

    def test_high_scores_yield_buy(self):
        data = {
            "unified_scoring": {"score": 90.0, "confidence": 90.0, "signals": {"financial": 90.0}},
            "elite_score": {"score": 90.0, "confidence": 90.0, "signals": {"trend": 90.0, "momentum": 90.0}},
            "confidence": {"score": 90.0, "confidence": 90.0, "signals": {"risk": 90.0, "market": 90.0}},
        }
        result = self.pipeline.execute("TUPRS", data)
        assert result.decision_score >= 70

    def test_low_scores_yield_avoid(self):
        data = {
            "unified_scoring": {"score": 10.0, "confidence": 10.0, "signals": {"financial": 10.0}},
            "elite_score": {"score": 10.0, "confidence": 10.0, "signals": {"trend": 10.0, "momentum": 10.0}},
            "confidence": {"score": 10.0, "confidence": 10.0, "signals": {"risk": 10.0, "market": 10.0}},
        }
        result = self.pipeline.execute("TUPRS", data)
        assert result.decision_score <= 40

    def test_result_has_entry_exit(self):
        result = self.pipeline.execute("TUPRS", self._full_data())
        rec = result.recommendation
        assert rec.entry is not None
        assert rec.exit is not None
        assert rec.entry.timing is not None
        assert rec.exit.action is not None

    def test_result_has_horizon_recs(self):
        result = self.pipeline.execute("TUPRS", self._full_data())
        rec = result.recommendation
        assert len(rec.horizon_recommendations) == 5

    def test_result_has_dimension_scores(self):
        result = self.pipeline.execute("TUPRS", self._full_data())
        rec = result.recommendation
        assert len(rec.dimension_scores) == 13

    def test_result_has_summary(self):
        result = self.pipeline.execute("TUPRS", self._full_data())
        assert len(result.recommendation.summary) > 0

    def test_result_has_generated_at(self):
        result = self.pipeline.execute("TUPRS", self._full_data())
        assert len(result.generated_at) > 0

    def test_with_existing_positions(self):
        positions = {
            "GARAN": {"weight": 5.0, "sector": "banking", "decision_score": 70.0},
        }
        result = self.pipeline.execute("TUPRS", self._full_data(), existing_positions=positions, sector="energy")
        assert result.recommendation.portfolio_impact is not None

    def test_decision_urgency(self):
        result = self.pipeline.execute("TUPRS", self._full_data())
        assert result.decision_urgency in DecisionUrgency

    def test_decision_confidence_bounded(self):
        result = self.pipeline.execute("TUPRS", self._full_data())
        assert 0 <= result.decision_confidence <= 100
