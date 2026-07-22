import pandas as pd
import numpy as np
from typing import Optional
from dataclasses import dataclass, field
from modules.data_engine.utils.logger import logger


@dataclass
class ValidationResult:
    is_valid: bool = True
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    cleaned_count: int = 0
    total_count: int = 0

    def to_dict(self) -> dict:
        return {
            "is_valid": self.is_valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "cleaned_count": self.cleaned_count,
            "total_count": self.total_count,
        }


class CompanyValidator:
    def validate(self, df: pd.DataFrame) -> ValidationResult:
        result = ValidationResult(total_count=len(df))
        if df.empty:
            result.warnings.append("Company list is empty")
            return result

        required_cols = ["stock_code", "company_name", "sector", "market"]
        for col in required_cols:
            if col not in df.columns:
                result.errors.append(f"Missing required column: {col}")
                result.is_valid = False

        if "stock_code" in df.columns:
            df["stock_code"] = df["stock_code"].astype(str).str.strip().str.upper()
            duplicates = df[df["stock_code"].duplicated(keep="first")]
            if not duplicates.empty:
                result.warnings.append(f"Found {len(duplicates)} duplicate stock codes")
                df = df.drop_duplicates(subset=["stock_code"], keep="first")

            null_codes = df[df["stock_code"].isna() | (df["stock_code"] == "")]
            if not null_codes.empty:
                result.warnings.append(f"Found {len(null_codes)} null/empty stock codes")
                df = df.dropna(subset=["stock_code"])

        if "company_name" in df.columns:
            df["company_name"] = df["company_name"].astype(str).str.strip()
            null_names = df[df["company_name"].isna() | (df["company_name"] == "")]
            if not null_names.empty:
                result.warnings.append(f"Found {len(null_names)} null company names")

        result.cleaned_count = len(df)
        return result


class PriceValidator:
    def validate(self, df: pd.DataFrame) -> ValidationResult:
        result = ValidationResult(total_count=len(df))
        if df.empty:
            result.warnings.append("Price data is empty")
            return result

        required_cols = ["stock_code", "date", "open", "high", "low", "close", "volume"]
        for col in required_cols:
            if col not in df.columns:
                result.errors.append(f"Missing required column: {col}")
                result.is_valid = False

        if "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"], errors="coerce")
            invalid_dates = df[df["date"].isna()]
            if not invalid_dates.empty:
                result.warnings.append(f"Found {len(invalid_dates)} invalid dates")
                df = df.dropna(subset=["date"])

        numeric_cols = ["open", "high", "low", "close", "volume", "turnover"]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        price_cols = ["open", "high", "low", "close"]
        for col in price_cols:
            if col in df.columns:
                negative = df[df[col] < 0]
                if not negative.empty:
                    result.warnings.append(f"Found {len(negative)} negative {col} values")
                    df.loc[df[col] < 0, col] = 0

        if all(col in df.columns for col in ["open", "high", "low", "close"]):
            invalid_ohlc = df[
                (df["high"] < df["low"]) |
                (df["open"] > df["high"]) |
                (df["open"] < df["low"]) |
                (df["close"] > df["high"]) |
                (df["close"] < df["low"])
            ]
            if not invalid_ohlc.empty:
                result.warnings.append(f"Found {len(invalid_ohlc)} invalid OHLC relationships")

        if "volume" in df.columns:
            negative_volume = df[df["volume"] < 0]
            if not negative_volume.empty:
                result.warnings.append(f"Found {len(negative_volume)} negative volume values")
                df.loc[df["volume"] < 0, "volume"] = 0

        if "date" in df.columns and "stock_code" in df.columns:
            duplicates = df[df.duplicated(subset=["stock_code", "date"], keep="first")]
            if not duplicates.empty:
                result.warnings.append(f"Found {len(duplicates)} duplicate records")
                df = df.drop_duplicates(subset=["stock_code", "date"], keep="first")

        null_rows = df[df.isna().any(axis=1)]
        if not null_rows.empty:
            result.warnings.append(f"Found {len(null_rows)} rows with null values")
            df = df.dropna()

        result.cleaned_count = len(df)
        return result


class FinancialValidator:
    def validate(self, df: pd.DataFrame) -> ValidationResult:
        result = ValidationResult(total_count=len(df))
        if df.empty:
            result.warnings.append("Financial data is empty")
            return result

        required_cols = ["stock_code", "period", "year", "quarter"]
        for col in required_cols:
            if col not in df.columns:
                result.errors.append(f"Missing required column: {col}")
                result.is_valid = False

        if "period" in df.columns:
            df["period"] = df["period"].astype(str).str.strip()

        if "year" in df.columns:
            df["year"] = pd.to_numeric(df["year"], errors="coerce")
            invalid_years = df[(df["year"] < 2000) | (df["year"] > 2030)]
            if not invalid_years.empty:
                result.warnings.append(f"Found {len(invalid_years)} invalid year values")
                df = df[(df["year"] >= 2000) & (df["year"] <= 2030)]

        if "quarter" in df.columns:
            df["quarter"] = pd.to_numeric(df["quarter"], errors="coerce")
            invalid_quarters = df[~df["quarter"].isin([1, 2, 3, 4])]
            if not invalid_quarters.empty:
                result.warnings.append(f"Found {len(invalid_quarters)} invalid quarter values")
                df = df[df["quarter"].isin([1, 2, 3, 4])]

        financial_cols = [
            "revenue", "gross_profit", "ebitda", "operating_profit",
            "net_profit", "equity", "assets", "liabilities", "cash", "net_debt"
        ]
        for col in financial_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        if "stock_code" in df.columns and "period" in df.columns:
            duplicates = df[df.duplicated(subset=["stock_code", "period"], keep="first")]
            if not duplicates.empty:
                result.warnings.append(f"Found {len(duplicates)} duplicate financial records")
                df = df.drop_duplicates(subset=["stock_code", "period"], keep="first")

        result.cleaned_count = len(df)
        return result


class ValidationService:
    def __init__(self):
        self.company_validator = CompanyValidator()
        self.price_validator = PriceValidator()
        self.financial_validator = FinancialValidator()

    def validate_companies(self, df: pd.DataFrame) -> ValidationResult:
        return self.company_validator.validate(df)

    def validate_prices(self, df: pd.DataFrame) -> ValidationResult:
        return self.price_validator.validate(df)

    def validate_financials(self, df: pd.DataFrame) -> ValidationResult:
        return self.financial_validator.validate(df)
