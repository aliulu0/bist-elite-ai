import pytest
from modules.monte_carlo_engine.core.types import MonteCarloRequest, MonteCarloResult, SimulationMethod
from modules.monte_carlo_engine.validators.validator import MonteCarloValidator


class TestMonteCarloValidator:
    def setup_method(self):
        self.val = MonteCarloValidator()

    def _valid_request(self, **kwargs) -> MonteCarloRequest:
        defaults = {
            "symbol": "TUPRS",
            "start_date": "2020-01-01",
            "end_date": "2025-12-31",
            "initial_capital": 100000,
            "num_simulations": 1000,
            "num_days": 252,
            "annual_volatility": 0.2,
        }
        defaults.update(kwargs)
        return MonteCarloRequest(**defaults)

    def test_valid_request(self):
        errors = self.val.validate_request(self._valid_request())
        assert errors == []

    def test_empty_symbol(self):
        errors = self.val.validate_request(self._valid_request(symbol=""))
        assert "Symbol is required" in errors

    def test_long_symbol(self):
        errors = self.val.validate_request(self._valid_request(symbol="A" * 25))
        assert any("20" in e for e in errors)

    def test_bad_dates(self):
        errors = self.val.validate_request(self._valid_request(start_date="", end_date=""))
        assert any("date" in e.lower() for e in errors)

    def test_start_after_end(self):
        errors = self.val.validate_request(self._valid_request(start_date="2025-01-01", end_date="2020-01-01"))
        assert any("before" in e.lower() for e in errors)

    def test_negative_capital(self):
        errors = self.val.validate_request(self._valid_request(initial_capital=-1))
        assert any("capital" in e.lower() for e in errors)

    def test_low_simulations(self):
        errors = self.val.validate_request(self._valid_request(num_simulations=50))
        assert any("100" in e for e in errors)

    def test_high_simulations(self):
        errors = self.val.validate_request(self._valid_request(num_simulations=2000000))
        assert any("1,000,000" in e for e in errors)

    def test_bad_volatility(self):
        errors = self.val.validate_request(self._valid_request(annual_volatility=10.0))
        assert any("volatility" in e.lower() for e in errors)

    def test_is_valid_request(self):
        assert self.val.is_valid_request(self._valid_request())
        assert not self.val.is_valid_request(self._valid_request(symbol=""))

    def test_valid_result(self):
        result = MonteCarloResult()
        result.simulations = [__import__("modules.monte_carlo_engine.core.types", fromlist=["SimulationResult"]).SimulationResult()]
        errors = self.val.validate_result(result)
        assert errors == []

    def test_empty_result(self):
        result = MonteCarloResult()
        errors = self.val.validate_result(result)
        assert any("simulations" in e.lower() for e in errors)

    def test_is_valid_result(self):
        result = MonteCarloResult()
        result.simulations = [__import__("modules.monte_carlo_engine.core.types", fromlist=["SimulationResult"]).SimulationResult()]
        assert self.val.is_valid_result(result)
        assert not self.val.is_valid_result(MonteCarloResult())
