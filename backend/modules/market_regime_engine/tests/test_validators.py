from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.market_regime_engine.core.types import (
    MarketRegime,
    RegimeAnalysisRequest,
    RegimeClassification,
)
from modules.market_regime_engine.validators.validator import RequestValidator, ResultValidator


class TestRequestValidator:
    def setup_method(self):
        self.validator = RequestValidator()

    def test_valid_request(self):
        request = RegimeAnalysisRequest(
            reference_date="2025-06-01",
            market_data={"price": 100.0},
            lookback_days=252,
            min_confidence=0.3,
        )
        errors = self.validator.validate(request)
        assert errors == []

    def test_empty_date(self):
        request = RegimeAnalysisRequest(
            reference_date="",
            market_data={"price": 100.0},
        )
        errors = self.validator.validate(request)
        assert any("reference_date" in e for e in errors)

    def test_lookback_too_small(self):
        request = RegimeAnalysisRequest(
            reference_date="2025-06-01",
            market_data={"price": 100.0},
            lookback_days=0,
        )
        errors = self.validator.validate(request)
        assert any("lookback_days" in e for e in errors)

    def test_lookback_too_large(self):
        request = RegimeAnalysisRequest(
            reference_date="2025-06-01",
            market_data={"price": 100.0},
            lookback_days=10000,
        )
        errors = self.validator.validate(request)
        assert any("lookback_days" in e for e in errors)

    def test_lookback_boundary_valid(self):
        request = RegimeAnalysisRequest(
            reference_date="2025-06-01",
            market_data={"price": 100.0},
            lookback_days=1,
        )
        errors = self.validator.validate(request)
        assert errors == []

    def test_lookback_boundary_max_valid(self):
        request = RegimeAnalysisRequest(
            reference_date="2025-06-01",
            market_data={"price": 100.0},
            lookback_days=7560,
        )
        errors = self.validator.validate(request)
        assert errors == []

    def test_min_confidence_below_zero(self):
        request = RegimeAnalysisRequest(
            reference_date="2025-06-01",
            market_data={"price": 100.0},
            min_confidence=-0.1,
        )
        errors = self.validator.validate(request)
        assert any("min_confidence" in e for e in errors)

    def test_min_confidence_above_one(self):
        request = RegimeAnalysisRequest(
            reference_date="2025-06-01",
            market_data={"price": 100.0},
            min_confidence=1.5,
        )
        errors = self.validator.validate(request)
        assert any("min_confidence" in e for e in errors)

    def test_min_confidence_boundaries(self):
        for val in [0.0, 0.5, 1.0]:
            request = RegimeAnalysisRequest(
                reference_date="2025-06-01",
                market_data={"price": 100.0},
                min_confidence=val,
            )
            errors = self.validator.validate(request)
            assert errors == []

    def test_empty_market_data(self):
        request = RegimeAnalysisRequest(
            reference_date="2025-06-01",
            market_data={},
        )
        errors = self.validator.validate(request)
        assert any("market_data" in e for e in errors)

    def test_multiple_errors(self):
        request = RegimeAnalysisRequest(
            reference_date="",
            market_data={},
            lookback_days=0,
        )
        errors = self.validator.validate(request)
        assert len(errors) >= 3


class TestResultValidator:
    def setup_method(self):
        self.validator = ResultValidator()

    def test_validate_classification_valid(self):
        classification = RegimeClassification(
            regime=MarketRegime.BULL,
            confidence=0.8,
            score=0.75,
        )
        errors = self.validator.validate_classification(classification)
        assert errors == []

    def test_validate_classification_confidence_out_of_range(self):
        classification = RegimeClassification(
            regime=MarketRegime.BULL,
            confidence=1.5,
            score=0.75,
        )
        errors = self.validator.validate_classification(classification)
        assert any("confidence" in e for e in errors)

    def test_validate_classification_confidence_negative(self):
        classification = RegimeClassification(
            regime=MarketRegime.BULL,
            confidence=-0.1,
            score=0.75,
        )
        errors = self.validator.validate_classification(classification)
        assert any("confidence" in e for e in errors)

    def test_validate_classification_score_out_of_range(self):
        classification = RegimeClassification(
            regime=MarketRegime.BULL,
            confidence=0.5,
            score=2.0,
        )
        errors = self.validator.validate_classification(classification)
        assert any("score" in e for e in errors)

    def test_validate_classification_score_negative(self):
        classification = RegimeClassification(
            regime=MarketRegime.BULL,
            confidence=0.5,
            score=-0.5,
        )
        errors = self.validator.validate_classification(classification)
        assert any("score" in e for e in errors)

    def test_validate_confidence_above_threshold(self):
        classification = RegimeClassification(confidence=0.8)
        assert self.validator.validate_confidence(classification, 0.3) is True

    def test_validate_confidence_below_threshold(self):
        classification = RegimeClassification(confidence=0.2)
        assert self.validator.validate_confidence(classification, 0.3) is False

    def test_validate_confidence_exact_threshold(self):
        classification = RegimeClassification(confidence=0.3)
        assert self.validator.validate_confidence(classification, 0.3) is True

    def test_validate_score_range_valid(self):
        assert self.validator.validate_score_range(0.5) is True
        assert self.validator.validate_score_range(0.0) is True
        assert self.validator.validate_score_range(1.0) is True

    def test_validate_score_range_invalid(self):
        assert self.validator.validate_score_range(-0.1) is False
        assert self.validator.validate_score_range(1.1) is False
