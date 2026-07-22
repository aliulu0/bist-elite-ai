from __future__ import annotations

import pytest
from modules.pattern_engine.validators.pattern_validators import PatternValidator
from modules.pattern_engine.core.types import PriceBar


class TestPatternValidator:
    def test_validate_prices_empty(self):
        errors = PatternValidator.validate_prices([])
        assert any("empty" in e.lower() for e in errors)

    def test_validate_prices_too_few(self):
        bars = [PriceBar(date="2024-01-01", open=100, high=101, low=99, close=100)]
        errors = PatternValidator.validate_prices(bars)
        assert any("at least" in e.lower() for e in errors)

    def test_validate_prices_valid(self):
        bars = [
            PriceBar(date="2024-01-01", open=100, high=101, low=99, close=100),
            PriceBar(date="2024-01-02", open=101, high=102, low=100, close=101),
            PriceBar(date="2024-01-03", open=102, high=103, low=101, close=102),
        ]
        errors = PatternValidator.validate_prices(bars)
        assert len(errors) == 0

    def test_validate_prices_high_less_than_low(self):
        bars = [
            PriceBar(date="2024-01-01", open=100, high=98, low=101, close=100),
            PriceBar(date="2024-01-02", open=101, high=102, low=100, close=101),
            PriceBar(date="2024-01-03", open=102, high=103, low=101, close=102),
        ]
        errors = PatternValidator.validate_prices(bars)
        assert any("high" in e.lower() and "low" in e.lower() for e in errors)

    def test_validate_prices_negative_volume(self):
        bars = [
            PriceBar(date="2024-01-01", open=100, high=101, low=99, close=100, volume=-1),
            PriceBar(date="2024-01-02", open=101, high=102, low=100, close=101, volume=1000),
            PriceBar(date="2024-01-03", open=102, high=103, low=101, close=102, volume=1000),
        ]
        errors = PatternValidator.validate_prices(bars)
        assert any("volume" in e.lower() for e in errors)

    def test_validate_category_valid(self):
        errors = PatternValidator.validate_category("classical")
        assert len(errors) == 0

    def test_validate_category_invalid(self):
        errors = PatternValidator.validate_category("invalid")
        assert len(errors) > 0

    def test_validate_params_valid(self):
        specs = {"tolerance": {"type": "float", "default": 0.03, "min": 0.01, "max": 0.10}}
        errors = PatternValidator.validate_params({"tolerance": 0.05}, specs)
        assert len(errors) == 0

    def test_validate_params_unknown(self):
        errors = PatternValidator.validate_params({"unknown": 1.0}, {})
        assert any("unknown" in e.lower() for e in errors)

    def test_validate_params_type_mismatch(self):
        specs = {"tolerance": {"type": "float", "default": 0.03}}
        errors = PatternValidator.validate_params({"tolerance": "bad"}, specs)
        assert any("number" in e.lower() for e in errors)

    def test_validate_params_below_min(self):
        specs = {"tolerance": {"type": "float", "default": 0.03, "min": 0.01}}
        errors = PatternValidator.validate_params({"tolerance": 0.001}, specs)
        assert any(">=" in e for e in errors)

    def test_validate_params_above_max(self):
        specs = {"tolerance": {"type": "float", "default": 0.03, "max": 0.10}}
        errors = PatternValidator.validate_params({"tolerance": 0.5}, specs)
        assert any("<=" in e for e in errors)

    def test_validate_params_int_type(self):
        specs = {"lookback": {"type": "int", "default": 5}}
        errors = PatternValidator.validate_params({"lookback": 5}, specs)
        assert len(errors) == 0

    def test_validate_params_int_type_mismatch(self):
        specs = {"lookback": {"type": "int", "default": 5}}
        errors = PatternValidator.validate_params({"lookback": 5.5}, specs)
        assert any("integer" in e.lower() for e in errors)

    def test_validate_detection_args(self):
        bars = [
            PriceBar(date="2024-01-01", open=100, high=101, low=99, close=100),
            PriceBar(date="2024-01-02", open=101, high=102, low=100, close=101),
            PriceBar(date="2024-01-03", open=102, high=103, low=101, close=102),
        ]
        errors = PatternValidator.validate_detection_args(bars, 3, {})
        assert len(errors) == 0

    def test_validate_detection_args_too_few(self):
        bars = [PriceBar(date="2024-01-01", open=100, high=101, low=99, close=100)]
        errors = PatternValidator.validate_detection_args(bars, 30, {})
        assert any("at least" in e.lower() for e in errors)
