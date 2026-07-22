from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.multi_factor_engine.core.types import (
    FactorAnalysisRequest,
    FactorGroup,
    FactorName,
    FactorScore,
    GroupScore,
    ScoreStrength,
)
from modules.multi_factor_engine.validators.validator import (
    RequestValidator,
    ResultValidator,
)


# ---------------------------------------------------------------------------
# RequestValidator
# ---------------------------------------------------------------------------

class TestRequestValidator:
    def setup_method(self):
        self.validator = RequestValidator()

    def test_valid_request(self):
        req = FactorAnalysisRequest(
            symbol="AAPL",
            reference_date="2024-01-01",
            market_data={"price": 100.0},
        )
        errors = self.validator.validate(req)
        assert errors == []

    def test_is_valid_true(self):
        req = FactorAnalysisRequest(
            symbol="AAPL",
            reference_date="2024-01-01",
            financial_data={"roe": 15.0},
        )
        assert self.validator.is_valid(req) is True

    def test_empty_symbol(self):
        req = FactorAnalysisRequest(
            symbol="",
            reference_date="2024-01-01",
            market_data={"price": 100.0},
        )
        errors = self.validator.validate(req)
        assert any("Symbol" in e for e in errors)

    def test_is_valid_false_empty_symbol(self):
        req = FactorAnalysisRequest(
            symbol="",
            reference_date="2024-01-01",
            market_data={"price": 100.0},
        )
        assert self.validator.is_valid(req) is False

    def test_empty_reference_date(self):
        req = FactorAnalysisRequest(
            symbol="AAPL",
            reference_date="",
            market_data={"price": 100.0},
        )
        errors = self.validator.validate(req)
        assert any("date" in e.lower() for e in errors)

    def test_empty_data_all(self):
        req = FactorAnalysisRequest(
            symbol="AAPL",
            reference_date="2024-01-01",
            market_data={},
            financial_data={},
            indicator_data={},
        )
        errors = self.validator.validate(req)
        assert any("data source" in e.lower() for e in errors)

    def test_multiple_errors(self):
        req = FactorAnalysisRequest(
            symbol="",
            reference_date="",
        )
        errors = self.validator.validate(req)
        assert len(errors) >= 2

    def test_financial_data_only_is_valid(self):
        req = FactorAnalysisRequest(
            symbol="AAPL",
            reference_date="2024-01-01",
            financial_data={"roe": 10.0},
        )
        assert self.validator.is_valid(req) is True

    def test_indicator_data_only_is_valid(self):
        req = FactorAnalysisRequest(
            symbol="AAPL",
            reference_date="2024-01-01",
            indicator_data={"rsi": 55.0},
        )
        assert self.validator.is_valid(req) is True


# ---------------------------------------------------------------------------
# ResultValidator
# ---------------------------------------------------------------------------

class TestResultValidator:
    def setup_method(self):
        self.validator = ResultValidator()

    def test_validate_score_in_range(self):
        assert self.validator.validate_score(50.0) is True
        assert self.validator.validate_score(0.0) is True
        assert self.validator.validate_score(100.0) is True

    def test_validate_score_out_range(self):
        assert self.validator.validate_score(-1.0) is False
        assert self.validator.validate_score(101.0) is False

    def test_validate_group_score_valid(self):
        gs = GroupScore(
            group=FactorGroup.VALUE,
            score=75.0,
            factors=[FactorScore(factor=FactorName.RSI, score=80.0)],
        )
        errors = self.validator.validate_group_score(gs)
        assert errors == []

    def test_validate_group_score_out_of_range(self):
        gs = GroupScore(
            group=FactorGroup.VALUE,
            score=150.0,
            factors=[FactorScore(factor=FactorName.RSI, score=80.0)],
        )
        errors = self.validator.validate_group_score(gs)
        assert any("out of range" in e for e in errors)

    def test_validate_group_score_no_factors(self):
        gs = GroupScore(
            group=FactorGroup.VALUE,
            score=75.0,
            factors=[],
        )
        errors = self.validator.validate_group_score(gs)
        assert any("no factor" in e.lower() for e in errors)

    def test_validate_profile_scores_valid(self):
        scores = {
            FactorName.RSI: 80.0,
            FactorName.ADX: 60.0,
        }
        errors = self.validator.validate_profile_scores(scores)
        assert errors == []

    def test_validate_profile_scores_out_of_range(self):
        scores = {
            FactorName.RSI: 120.0,
            FactorName.ADX: -5.0,
        }
        errors = self.validator.validate_profile_scores(scores)
        assert len(errors) == 2

    def test_validate_profile_scores_empty(self):
        errors = self.validator.validate_profile_scores({})
        assert errors == []

    def test_validate_group_score_boundary_zero(self):
        gs = GroupScore(
            group=FactorGroup.VALUE,
            score=0.0,
            factors=[FactorScore(factor=FactorName.RSI, score=0.0)],
        )
        errors = self.validator.validate_group_score(gs)
        assert errors == []

    def test_validate_group_score_boundary_100(self):
        gs = GroupScore(
            group=FactorGroup.VALUE,
            score=100.0,
            factors=[FactorScore(factor=FactorName.RSI, score=100.0)],
        )
        errors = self.validator.validate_group_score(gs)
        assert errors == []
