import pytest
from modules.financial.validators.financial_validator import (
    ValidationResult,
    FinancialValidator,
)


class TestValidationResult:
    def test_initial_state(self):
        r = ValidationResult()
        assert r.is_valid is True
        assert r.errors == []
        assert r.warnings == []

    def test_add_error(self):
        r = ValidationResult()
        r.add_error("something broke")
        assert r.is_valid is False
        assert r.errors == ["something broke"]

    def test_add_warning(self):
        r = ValidationResult()
        r.add_warning("heads up")
        assert r.is_valid is True
        assert r.warnings == ["heads up"]

    def test_multiple_errors(self):
        r = ValidationResult()
        r.add_error("e1")
        r.add_error("e2")
        assert r.is_valid is False
        assert len(r.errors) == 2


class TestValidateStockCode:
    def test_valid(self):
        r = FinancialValidator.validate_stock_code("THYAO")
        assert r.is_valid is True
        assert r.errors == []

    def test_empty(self):
        r = FinancialValidator.validate_stock_code("")
        assert r.is_valid is False
        assert "Stock code is required" in r.errors[0]

    def test_whitespace(self):
        r = FinancialValidator.validate_stock_code("   ")
        assert r.is_valid is False

    def test_too_long(self):
        r = FinancialValidator.validate_stock_code("A" * 11)
        assert r.is_valid is False
        assert "10 characters" in r.errors[0]

    def test_special_chars(self):
        r = FinancialValidator.validate_stock_code("TH-YO")
        assert r.is_valid is False
        assert "alphanumeric" in r.errors[0]

    def test_alphanumeric_ok(self):
        r = FinancialValidator.validate_stock_code("THYAO1")
        assert r.is_valid is True

    def test_exact_10_chars(self):
        r = FinancialValidator.validate_stock_code("A" * 10)
        assert r.is_valid is True


class TestValidatePeriod:
    def test_valid_q1(self):
        r = FinancialValidator.validate_period("2024Q1")
        assert r.is_valid is True

    def test_valid_q4(self):
        r = FinancialValidator.validate_period("2023Q4")
        assert r.is_valid is True

    def test_invalid_format(self):
        r = FinancialValidator.validate_period("2024-Q1")
        assert r.is_valid is False

    def test_invalid_quarter(self):
        r = FinancialValidator.validate_period("2024Q5")
        assert r.is_valid is False

    def test_empty(self):
        r = FinancialValidator.validate_period("")
        assert r.is_valid is False
        assert "Period is required" in r.errors[0]


class TestValidateReportType:
    def test_valid_quarterly(self):
        r = FinancialValidator.validate_report_type("quarterly")
        assert r.is_valid is True

    def test_valid_annual(self):
        r = FinancialValidator.validate_report_type("annual")
        assert r.is_valid is True

    def test_valid_ttm(self):
        r = FinancialValidator.validate_report_type("ttm")
        assert r.is_valid is True

    def test_valid_restatated(self):
        r = FinancialValidator.validate_report_type("restated")
        assert r.is_valid is True

    def test_invalid_monthly(self):
        r = FinancialValidator.validate_report_type("monthly")
        assert r.is_valid is False
        assert "Invalid report type" in r.errors[0]


class TestValidateCurrency:
    def test_try_no_warning(self):
        r = FinancialValidator.validate_currency("TRY")
        assert r.is_valid is True
        assert r.warnings == []

    def test_usd_no_warning(self):
        r = FinancialValidator.validate_currency("USD")
        assert r.is_valid is True
        assert r.warnings == []

    def test_jpy_warning(self):
        r = FinancialValidator.validate_currency("JPY")
        assert r.is_valid is True
        assert len(r.warnings) == 1
        assert "Uncommon currency" in r.warnings[0]


class TestValidateStatement:
    def _base(self):
        return {
            "stock_code": "THYAO",
            "period": "2024Q1",
            "year": 2024,
            "quarter": 1,
            "report_type": "quarterly",
            "currency": "TRY",
            "revenue": 1_000_000,
            "total_assets": 5_000_000,
            "shares_outstanding": 100_000_000,
            "equity": 2_000_000,
            "total_liabilities": 3_000_000,
        }

    def test_valid_data(self):
        r = FinancialValidator.validate_statement(self._base())
        assert r.is_valid is True

    def test_missing_stock_code(self):
        d = self._base()
        d["stock_code"] = ""
        r = FinancialValidator.validate_statement(d)
        assert r.is_valid is False

    def test_missing_period(self):
        d = self._base()
        d["period"] = ""
        r = FinancialValidator.validate_statement(d)
        assert r.is_valid is False

    def test_period_mismatch(self):
        d = self._base()
        d["period"] = "2024Q2"
        r = FinancialValidator.validate_statement(d)
        assert r.is_valid is False
        assert any("does not match" in e for e in r.errors)

    def test_negative_revenue(self):
        d = self._base()
        d["revenue"] = -100
        r = FinancialValidator.validate_statement(d)
        assert not r.is_valid or any("Revenue cannot be negative" in e for e in r.errors)

    def test_negative_assets(self):
        d = self._base()
        d["total_assets"] = -1
        r = FinancialValidator.validate_statement(d)
        assert not r.is_valid or any("Total assets cannot be negative" in e for e in r.errors)

    def test_zero_shares(self):
        d = self._base()
        d["shares_outstanding"] = 0
        r = FinancialValidator.validate_statement(d)
        assert not r.is_valid or any("Shares outstanding must be positive" in e for e in r.errors)

    def test_eps_diluted_warning(self):
        d = self._base()
        d["eps"] = 10.0
        d["diluted_eps"] = 5.0
        r = FinancialValidator.validate_statement(d)
        assert any("diluted" in w.lower() for w in r.warnings)

    def test_invalid_accounting_equation(self):
        d = self._base()
        d["equity"] = 1000
        d["total_assets"] = 5000
        d["total_liabilities"] = 1000
        r = FinancialValidator.validate_statement(d)
        assert any("accounting equation" in w.lower() for w in r.warnings)

    def test_high_current_ratio_warning(self):
        d = self._base()
        d["current_assets"] = 500_000
        d["current_liabilities"] = 10_000
        r = FinancialValidator.validate_statement(d)
        assert any("current ratio" in w.lower() for w in r.warnings)

    def test_invalid_report_type(self):
        d = self._base()
        d["report_type"] = "monthly"
        r = FinancialValidator.validate_statement(d)
        assert r.is_valid is False


class TestValidateBatchDuplicates:
    def test_no_duplicates(self):
        stmts = [
            {"stock_code": "THYAO", "period": "2024Q1", "report_type": "quarterly"},
            {"stock_code": "THYAO", "period": "2024Q2", "report_type": "quarterly"},
        ]
        r = FinancialValidator.validate_batch_duplicates(stmts)
        assert r.is_valid is True

    def test_has_duplicates(self):
        stmts = [
            {"stock_code": "THYAO", "period": "2024Q1", "report_type": "quarterly"},
            {"stock_code": "THYAO", "period": "2024Q1", "report_type": "quarterly"},
        ]
        r = FinancialValidator.validate_batch_duplicates(stmts)
        assert r.is_valid is False
        assert "Duplicate" in r.errors[0]

    def test_different_report_types(self):
        stmts = [
            {"stock_code": "THYAO", "period": "2024Q1", "report_type": "quarterly"},
            {"stock_code": "THYAO", "period": "2024Q1", "report_type": "annual"},
        ]
        r = FinancialValidator.validate_batch_duplicates(stmts)
        assert r.is_valid is True
