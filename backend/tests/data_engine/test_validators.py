import pytest
import pandas as pd
from datetime import date, timedelta

from modules.data_engine.validators.validation_service import (
    ValidationService,
    CompanyValidator,
    PriceValidator,
    FinancialValidator,
)


class TestCompanyValidator:
    def setup_method(self):
        self.validator = CompanyValidator()

    def test_validate_empty_dataframe(self):
        df = pd.DataFrame()
        result = self.validator.validate(df)
        assert result.is_valid
        assert len(result.warnings) > 0

    def test_validate_valid_companies(self):
        df = pd.DataFrame([
            {"stock_code": "GARAN", "company_name": "Garanti Bankası", "sector": "Bankacılık", "market": "BIST-100"},
            {"stock_code": "AKBNK", "company_name": "Akbank", "sector": "Bankacılık", "market": "BIST-100"},
        ])
        result = self.validator.validate(df)
        assert result.is_valid
        assert result.cleaned_count == 2

    def test_validate_duplicate_stock_codes(self):
        df = pd.DataFrame([
            {"stock_code": "GARAN", "company_name": "Garanti Bankası", "sector": "Bankacılık", "market": "BIST-100"},
            {"stock_code": "GARAN", "company_name": "Garanti Bankası Duplicate", "sector": "Bankacılık", "market": "BIST-100"},
        ])
        result = self.validator.validate(df)
        assert result.is_valid
        assert result.cleaned_count == 1
        assert len(result.warnings) > 0

    def test_validate_missing_columns(self):
        df = pd.DataFrame([{"stock_code": "GARAN"}])
        result = self.validator.validate(df)
        assert not result.is_valid
        assert len(result.errors) > 0


class TestPriceValidator:
    def setup_method(self):
        self.validator = PriceValidator()

    def test_validate_empty_dataframe(self):
        df = pd.DataFrame()
        result = self.validator.validate(df)
        assert result.is_valid

    def test_validate_valid_prices(self):
        df = pd.DataFrame([
            {"stock_code": "GARAN", "date": date.today(), "open": 100, "high": 110, "low": 95, "close": 105, "volume": 1000000, "turnover": 105000000},
        ])
        result = self.validator.validate(df)
        assert result.is_valid
        assert result.cleaned_count == 1

    def test_validate_negative_prices(self):
        df = pd.DataFrame([
            {"stock_code": "GARAN", "date": date.today(), "open": -100, "high": 110, "low": 95, "close": 105, "volume": 1000000},
        ])
        result = self.validator.validate(df)
        assert result.is_valid
        assert len(result.warnings) > 0

    def test_validate_invalid_ohlc(self):
        df = pd.DataFrame([
            {"stock_code": "GARAN", "date": date.today(), "open": 100, "high": 90, "low": 110, "close": 105, "volume": 1000000},
        ])
        result = self.validator.validate(df)
        assert result.is_valid
        assert len(result.warnings) > 0

    def test_validate_duplicate_records(self):
        df = pd.DataFrame([
            {"stock_code": "GARAN", "date": date.today(), "open": 100, "high": 110, "low": 95, "close": 105, "volume": 1000000},
            {"stock_code": "GARAN", "date": date.today(), "open": 100, "high": 110, "low": 95, "close": 105, "volume": 1000000},
        ])
        result = self.validator.validate(df)
        assert result.is_valid
        assert result.cleaned_count == 1


class TestFinancialValidator:
    def setup_method(self):
        self.validator = FinancialValidator()

    def test_validate_empty_dataframe(self):
        df = pd.DataFrame()
        result = self.validator.validate(df)
        assert result.is_valid

    def test_validate_valid_financials(self):
        df = pd.DataFrame([
            {"stock_code": "GARAN", "period": "2024Q1", "year": 2024, "quarter": 1, "revenue": 1000000000},
        ])
        result = self.validator.validate(df)
        assert result.is_valid

    def test_validate_invalid_quarter(self):
        df = pd.DataFrame([
            {"stock_code": "GARAN", "period": "2024Q5", "year": 2024, "quarter": 5, "revenue": 1000000000},
        ])
        result = self.validator.validate(df)
        assert result.is_valid
        assert len(result.warnings) > 0

    def test_validate_invalid_year(self):
        df = pd.DataFrame([
            {"stock_code": "GARAN", "period": "1999Q1", "year": 1999, "quarter": 1, "revenue": 1000000000},
        ])
        result = self.validator.validate(df)
        assert result.is_valid
        assert len(result.warnings) > 0


class TestValidationService:
    def setup_method(self):
        self.service = ValidationService()

    def test_validate_companies(self):
        df = pd.DataFrame([
            {"stock_code": "GARAN", "company_name": "Garanti Bankası", "sector": "Bankacılık", "market": "BIST-100"},
        ])
        result = self.service.validate_companies(df)
        assert result.is_valid

    def test_validate_prices(self):
        df = pd.DataFrame([
            {"stock_code": "GARAN", "date": date.today(), "open": 100, "high": 110, "low": 95, "close": 105, "volume": 1000000},
        ])
        result = self.service.validate_prices(df)
        assert result.is_valid

    def test_validate_financials(self):
        df = pd.DataFrame([
            {"stock_code": "GARAN", "period": "2024Q1", "year": 2024, "quarter": 1, "revenue": 1000000000},
        ])
        result = self.service.validate_financials(df)
        assert result.is_valid
