from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.similarity_engine.core.types import (
    SimilarityMethod,
    SimilarityRequest,
    SimilarityResult,
    SimilarityLabel,
)
from modules.similarity_engine.validators.validator import RequestValidator, ResultValidator


class TestRequestValidator:
    def setup_method(self):
        self.v = RequestValidator()

    def test_valid_request(self):
        req = SimilarityRequest(
            symbol="THYAO",
            reference_date="2024-01-01",
            top_n=5,
            methods=[SimilarityMethod.WEIGHTED_FEATURE],
            lookback_days=252,
            min_similarity=0.3,
        )
        errors = self.v.validate(req)
        assert errors == []

    def test_empty_symbol(self):
        req = SimilarityRequest(symbol="", reference_date="2024-01-01")
        errors = self.v.validate(req)
        assert any("symbol" in e for e in errors)

    def test_empty_reference_date(self):
        req = SimilarityRequest(symbol="THYAO", reference_date="")
        errors = self.v.validate(req)
        assert any("reference_date" in e for e in errors)

    def test_top_n_too_small(self):
        req = SimilarityRequest(symbol="THYAO", reference_date="2024-01-01", top_n=0)
        errors = self.v.validate(req)
        assert any("top_n" in e for e in errors)

    def test_top_n_too_large(self):
        req = SimilarityRequest(symbol="THYAO", reference_date="2024-01-01", top_n=101)
        errors = self.v.validate(req)
        assert any("top_n" in e for e in errors)

    def test_empty_methods(self):
        req = SimilarityRequest(symbol="THYAO", reference_date="2024-01-01", methods=[])
        errors = self.v.validate(req)
        assert any("method" in e for e in errors)

    def test_lookback_days_too_small(self):
        req = SimilarityRequest(symbol="THYAO", reference_date="2024-01-01", lookback_days=0)
        errors = self.v.validate(req)
        assert any("lookback_days" in e for e in errors)

    def test_lookback_days_too_large(self):
        req = SimilarityRequest(symbol="THYAO", reference_date="2024-01-01", lookback_days=7561)
        errors = self.v.validate(req)
        assert any("lookback_days" in e for e in errors)

    def test_min_similarity_out_of_range(self):
        req = SimilarityRequest(symbol="THYAO", reference_date="2024-01-01", min_similarity=-0.1)
        errors = self.v.validate(req)
        assert any("min_similarity" in e for e in errors)

    def test_min_similarity_above_one(self):
        req = SimilarityRequest(symbol="THYAO", reference_date="2024-01-01", min_similarity=1.5)
        errors = self.v.validate(req)
        assert any("min_similarity" in e for e in errors)


class TestRequestValidatorParams:
    def setup_method(self):
        self.v = RequestValidator()

    def test_validate_request_params_valid(self):
        errors = self.v.validate_request_params("THYAO", "2024-01-01")
        assert errors == []

    def test_validate_request_params_empty_symbol(self):
        errors = self.v.validate_request_params("", "2024-01-01")
        assert any("symbol" in e for e in errors)

    def test_validate_request_params_blank_symbol(self):
        errors = self.v.validate_request_params("   ", "2024-01-01")
        assert any("symbol" in e for e in errors)

    def test_validate_request_params_empty_date(self):
        errors = self.v.validate_request_params("THYAO", "")
        assert any("date" in e for e in errors)


class TestResultValidator:
    def setup_method(self):
        self.v = ResultValidator()

    def test_validate_results_valid(self):
        results = [
            SimilarityResult(source_symbol="SRC", target_symbol="TGT", target_date="2024-01-01", similarity_score=0.8),
        ]
        errors = self.v.validate_results(results)
        assert errors == []

    def test_validate_results_too_many(self):
        results = [
            SimilarityResult(source_symbol="SRC", target_symbol="TGT", target_date="2024-01-01", similarity_score=0.8)
            for _ in range(101)
        ]
        errors = self.v.validate_results(results, max_results=100)
        assert any("too many" in e for e in errors)

    def test_validate_results_empty_target(self):
        results = [
            SimilarityResult(source_symbol="SRC", target_symbol="", target_date="2024-01-01", similarity_score=0.8),
        ]
        errors = self.v.validate_results(results)
        assert any("target_symbol" in e for e in errors)

    def test_validate_result_completeness_complete(self):
        result = SimilarityResult(source_symbol="SRC", target_symbol="TGT", target_date="2024-01-01", similarity_score=0.8)
        assert self.v.validate_result_completeness(result) is True

    def test_validate_result_completeness_incomplete(self):
        result = SimilarityResult(source_symbol="", target_symbol="TGT", target_date="2024-01-01", similarity_score=0.8)
        assert self.v.validate_result_completeness(result) is False

    def test_validate_score_range_valid(self):
        assert self.v.validate_score_range(0.5) is True
        assert self.v.validate_score_range(0.0) is True
        assert self.v.validate_score_range(1.0) is True

    def test_validate_score_range_invalid(self):
        assert self.v.validate_score_range(-0.1) is False
        assert self.v.validate_score_range(1.1) is False

    def test_validate_score_range_custom_bounds(self):
        assert self.v.validate_score_range(5.0, min_score=0.0, max_score=10.0) is True
        assert self.v.validate_score_range(15.0, min_score=0.0, max_score=10.0) is False
