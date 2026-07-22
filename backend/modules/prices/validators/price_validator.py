from datetime import date, timedelta
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


class PriceValidator:

    @staticmethod
    def validate_single_price(data: dict) -> ValidationResult:
        result = ValidationResult()

        if data.get("open") is None or data.get("high") is None or data.get("low") is None or data.get("close") is None:
            result.add_error("Missing required OHLC values (open, high, low, close)")
            return result

        o, h, l, c = data["open"], data["high"], data["low"], data["close"]

        if o <= 0:
            result.add_error(f"Open price must be positive, got {o}")
        if h <= 0:
            result.add_error(f"High price must be positive, got {h}")
        if l <= 0:
            result.add_error(f"Low price must be positive, got {l}")
        if c <= 0:
            result.add_error(f"Close price must be positive, got {c}")

        if not result.is_valid:
            return result

        if h < l:
            result.add_error(f"High ({h}) cannot be less than Low ({l})")
        if o > h:
            result.add_error(f"Open ({o}) cannot be greater than High ({h})")
        if o < l:
            result.add_error(f"Open ({o}) cannot be less than Low ({l})")
        if c > h:
            result.add_error(f"Close ({c}) cannot be greater than High ({h})")
        if c < l:
            result.add_error(f"Close ({c}) cannot be less than Low ({l})")

        volume = data.get("volume", 0)
        if volume < 0:
            result.add_error(f"Volume cannot be negative, got {volume}")

        turnover = data.get("turnover", 0)
        if turnover < 0:
            result.add_error(f"Turnover cannot be negative, got {turnover}")

        trade_count = data.get("trade_count")
        if trade_count is not None and trade_count < 0:
            result.add_error(f"Trade count cannot be negative, got {trade_count}")

        return result

    @staticmethod
    def validate_batch(prices: list[dict]) -> ValidationResult:
        result = ValidationResult()

        if not prices:
            result.add_error("Price list is empty")
            return result

        seen_dates: dict[str, str] = {}
        previous_date: date | None = None

        for i, price in enumerate(prices):
            pdate = price.get("date")
            if pdate is None:
                result.add_error(f"Record {i}: missing date")
                continue

            if isinstance(pdate, str):
                try:
                    pdate = date.fromisoformat(pdate)
                except ValueError:
                    result.add_error(f"Record {i}: invalid date format '{pdate}'")
                    continue

            if pdate > date.today():
                result.add_error(f"Record {i}: date {pdate} is in the future")

            date_key = pdate.isoformat()
            if date_key in seen_dates:
                result.add_error(f"Record {i}: duplicate date {date_key} (first seen at index {seen_dates[date_key]})")
            else:
                seen_dates[date_key] = str(i)

            if previous_date is not None and pdate <= previous_date:
                result.add_error(
                    f"Record {i}: date {pdate} is not after previous date {previous_date}"
                )
            previous_date = pdate

            stock_code = price.get("stock_code", "")
            if not stock_code or not stock_code.strip():
                result.add_error(f"Record {i}: missing or empty stock_code")

            single = PriceValidator.validate_single_price(price)
            if not single.is_valid:
                for err in single.errors:
                    result.add_error(f"Record {i}: {err}")

        return result

    @staticmethod
    def validate_date_range(start_date: date | None, end_date: date | None) -> ValidationResult:
        result = ValidationResult()

        if start_date and end_date and start_date > end_date:
            result.add_error(f"Start date ({start_date}) is after end date ({end_date})")

        if end_date and end_date > date.today():
            result.add_warning(f"End date ({end_date}) is in the future")

        return result

    @staticmethod
    def validate_stock_code(stock_code: str) -> ValidationResult:
        result = ValidationResult()

        if not stock_code or not stock_code.strip():
            result.add_error("Stock code is empty")
            return result

        stock_code = stock_code.strip().upper()

        if len(stock_code) > 10:
            result.add_error(f"Stock code too long: '{stock_code}' (max 10 characters)")

        if not stock_code.isalnum():
            result.add_error(f"Stock code contains invalid characters: '{stock_code}'")

        return result
