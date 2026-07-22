import pytest
from modules.walk_forward_engine.core.types import (
    GeneralizationScores,
    OverfittingSeverity,
    WalkForwardRequest,
    WalkForwardResult,
    WindowMode,
)
from modules.walk_forward_engine.validators.validator import WalkForwardValidator


class TestWalkForwardValidator:
    def setup_method(self):
        self.val = WalkForwardValidator()

    def _valid_request(self, **kwargs) -> WalkForwardRequest:
        defaults = {
            "symbol": "TUPRS",
            "start_date": "2020-01-01",
            "end_date": "2025-12-31",
            "initial_capital": 100000,
            "commission_pct": 0.001,
        }
        defaults.update(kwargs)
        return WalkForwardRequest(**defaults)

    def test_valid_request(self):
        errors = self.val.validate_request(self._valid_request())
        assert errors == []

    def test_empty_symbol(self):
        errors = self.val.validate_request(self._valid_request(symbol=""))
        assert "Symbol is required" in errors

    def test_long_symbol(self):
        errors = self.val.validate_request(self._valid_request(symbol="A" * 25))
        assert any("20" in e for e in errors)

    def test_missing_dates(self):
        errors = self.val.validate_request(self._valid_request(start_date="", end_date=""))
        assert any("date" in e.lower() for e in errors)

    def test_start_after_end(self):
        errors = self.val.validate_request(self._valid_request(start_date="2025-01-01", end_date="2020-01-01"))
        assert any("before" in e.lower() for e in errors)

    def test_negative_capital(self):
        errors = self.val.validate_request(self._valid_request(initial_capital=-1))
        assert any("capital" in e.lower() for e in errors)

    def test_bad_commission(self):
        errors = self.val.validate_request(self._valid_request(commission_pct=0.5))
        assert any("commission" in e.lower() for e in errors)

    def test_low_train_rows(self):
        errors = self.val.validate_request(self._valid_request(min_train_rows=5))
        assert any("train rows" in e.lower() for e in errors)

    def test_low_test_rows(self):
        errors = self.val.validate_request(self._valid_request(min_test_rows=2))
        assert any("test rows" in e.lower() for e in errors)

    def test_bad_optimization_metric(self):
        errors = self.val.validate_request(self._valid_request(optimization_metric="invalid"))
        assert any("metric" in e.lower() for e in errors)

    def test_is_valid_request(self):
        assert self.val.is_valid_request(self._valid_request())
        assert not self.val.is_valid_request(self._valid_request(symbol=""))

    def test_valid_result(self):
        result = WalkForwardResult(total_windows=5, successful_windows=5)
        errors = self.val.validate_result(result)
        assert errors == []

    def test_no_windows_result(self):
        result = WalkForwardResult(total_windows=0)
        errors = self.val.validate_result(result)
        assert any("windows" in e.lower() for e in errors)

    def test_all_failed_result(self):
        result = WalkForwardResult(total_windows=5, successful_windows=0)
        errors = self.val.validate_result(result)
        assert any("failed" in e.lower() for e in errors)

    def test_negative_generalization(self):
        result = WalkForwardResult(
            total_windows=5, successful_windows=5,
            generalization=GeneralizationScores(generalization_score=-1),
        )
        errors = self.val.validate_result(result)
        assert any("negative" in e.lower() for e in errors)

    def test_over_1_overfitting(self):
        result = WalkForwardResult(
            total_windows=5, successful_windows=5,
            generalization=GeneralizationScores(overfitting_score=1.5),
        )
        errors = self.val.validate_result(result)
        assert any("0 and 1" in e for e in errors)

    def test_is_valid_result(self):
        result = WalkForwardResult(total_windows=5, successful_windows=5)
        assert self.val.is_valid_result(result)
        assert not self.val.is_valid_result(WalkForwardResult(total_windows=0))
