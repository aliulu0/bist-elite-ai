import re
from dataclasses import dataclass, field


@dataclass
class ValidationResult:
    is_valid: bool = True
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def add_error(self, message: str) -> None:
        self.errors.append(message)
        self.is_valid = False

    def add_warning(self, message: str) -> None:
        self.warnings.append(message)


PERIOD_RE = re.compile(r"^\d{4}Q[1-4]$")
VALID_REPORT_TYPES = {"quarterly", "annual", "ttm", "restated", "historical"}
VALID_CURRENCIES = {"TRY", "USD", "EUR", "GBP"}


class FinancialValidator:

    @staticmethod
    def validate_stock_code(stock_code: str) -> ValidationResult:
        result = ValidationResult()
        if not stock_code or not stock_code.strip():
            result.add_error("Stock code is required")
            return result
        code = stock_code.strip()
        if len(code) > 10:
            result.add_error("Stock code must be 10 characters or less")
            return result
        if not code.isalnum():
            result.add_error("Stock code must contain only alphanumeric characters")
            return result
        return result

    @staticmethod
    def validate_period(period: str) -> ValidationResult:
        result = ValidationResult()
        if not period:
            result.add_error("Period is required")
            return result
        if not PERIOD_RE.match(period):
            result.add_error(f"Invalid period format: {period}. Expected YYYYQN (e.g. 2024Q1)")
            return result
        return result

    @staticmethod
    def validate_report_type(report_type: str) -> ValidationResult:
        result = ValidationResult()
        if report_type not in VALID_REPORT_TYPES:
            result.add_error(f"Invalid report type: {report_type}. Must be one of {VALID_REPORT_TYPES}")
        return result

    @staticmethod
    def validate_currency(currency: str) -> ValidationResult:
        result = ValidationResult()
        if currency not in VALID_CURRENCIES:
            result.add_warning(f"Uncommon currency: {currency}")
        return result

    @staticmethod
    def validate_statement(data: dict) -> ValidationResult:
        result = ValidationResult()

        stock_code = data.get("stock_code", "")
        code_val = FinancialValidator.validate_stock_code(stock_code)
        if not code_val.is_valid:
            result.errors.extend(code_val.errors)
            result.is_valid = False

        period = data.get("period", "")
        period_val = FinancialValidator.validate_period(period)
        if not period_val.is_valid:
            result.errors.extend(period_val.errors)
            result.is_valid = False

        year = data.get("year")
        quarter = data.get("quarter")
        if year and quarter and period:
            expected = f"{year}Q{quarter}"
            if period != expected:
                result.add_error(f"Period {period} does not match year={year}, quarter={quarter}")

        report_type = data.get("report_type", "quarterly")
        rt_val = FinancialValidator.validate_report_type(report_type)
        if not rt_val.is_valid:
            result.errors.extend(rt_val.errors)
            result.is_valid = False

        revenue = data.get("revenue")
        if revenue is not None and revenue < 0:
            result.add_error("Revenue cannot be negative")

        total_assets = data.get("total_assets")
        if total_assets is not None and total_assets < 0:
            result.add_error("Total assets cannot be negative")

        shares = data.get("shares_outstanding")
        if shares is not None and shares <= 0:
            result.add_error("Shares outstanding must be positive")

        eps = data.get("eps")
        diluted = data.get("diluted_eps")
        if eps is not None and diluted is not None and diluted > 0 and eps > diluted:
            result.add_warning("EPS exceeds diluted EPS, which is unusual")

        equity = data.get("equity")
        assets = data.get("total_assets")
        liabilities = data.get("total_liabilities")
        if equity is not None and assets is not None and liabilities is not None:
            if abs(equity + liabilities - assets) > max(abs(assets) * 0.01, 1.0):
                result.add_warning("Assets != Liabilities + Equity (accounting equation check failed)")

        if data.get("current_assets") is not None and data.get("current_liabilities") is not None:
            if data["current_liabilities"] > 0:
                cr = data["current_assets"] / data["current_liabilities"]
                if cr > 20:
                    result.add_warning(f"Unusually high current ratio: {cr:.1f}")

        return result

    @staticmethod
    def validate_batch_duplicates(statements: list[dict]) -> ValidationResult:
        result = ValidationResult()
        seen: set[tuple[str, str, str]] = set()
        for s in statements:
            key = (s.get("stock_code", ""), s.get("period", ""), s.get("report_type", "quarterly"))
            if key in seen:
                result.add_error(f"Duplicate statement for {key[0]} period={key[1]} type={key[2]}")
            seen.add(key)
        return result
