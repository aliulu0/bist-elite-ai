import pytest
from modules.backtest_engine.validators.validator import BacktestValidator
from modules.backtest_engine.core.types import BacktestRequest, BacktestResult, PerformanceMetrics, EquityPoint


class TestBacktestValidator:
    def setup_method(self):
        self.v = BacktestValidator()

    def test_valid_request(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31")
        errors = self.v.validate_request(req)
        assert len(errors) == 0

    def test_empty_symbol(self):
        req = BacktestRequest(symbol="", strategy="test", start_date="2023-01-01", end_date="2025-12-31")
        errors = self.v.validate_request(req)
        assert len(errors) > 0

    def test_invalid_dates(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2025-12-31", end_date="2023-01-01")
        errors = self.v.validate_request(req)
        assert any("start" in e.lower() for e in errors)

    def test_negative_capital(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31", initial_capital=-100)
        errors = self.v.validate_request(req)
        assert any("capital" in e.lower() for e in errors)

    def test_invalid_position_size(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31", position_size_pct=150)
        errors = self.v.validate_request(req)
        assert any("position" in e.lower() for e in errors)

    def test_invalid_stop_loss(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31", stop_loss_pct=60)
        errors = self.v.validate_request(req)
        assert any("stop" in e.lower() for e in errors)

    def test_valid_result(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31")
        result = BacktestResult(
            request=req,
            equity_curve=[EquityPoint("d1", 100000)],
            metrics=PerformanceMetrics(total_trades=10, win_rate=60.0),
        )
        errors = self.v.validate_result(result)
        assert len(errors) == 0

    def test_is_valid_request(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31")
        assert self.v.is_valid_request(req) is True

    def test_is_valid_result(self):
        req = BacktestRequest(symbol="TUPRS", strategy="test", start_date="2023-01-01", end_date="2025-12-31")
        result = BacktestResult(request=req, equity_curve=[EquityPoint("d1", 100000)])
        assert self.v.is_valid_result(result) is True
