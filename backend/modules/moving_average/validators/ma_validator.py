from __future__ import annotations

from modules.moving_average.core.types import PriceBar


class MAValidator:

    @staticmethod
    def validate_period(period: int) -> list[str]:
        errors = []
        if period <= 0:
            errors.append("Period must be positive")
        if period > 1000:
            errors.append("Period cannot exceed 1000")
        return errors

    @staticmethod
    def validate_periods(periods: list[int]) -> list[str]:
        errors = []
        if not periods:
            errors.append("At least one period is required")
        for p in periods:
            errs = MAValidator.validate_period(p)
            errors.extend(errs)
        return errors

    @staticmethod
    def validate_prices(prices: list[PriceBar]) -> list[str]:
        errors = []
        if not prices:
            errors.append("Price data is required")
            return errors
        for i, p in enumerate(prices):
            if p.close <= 0:
                errors.append(f"Bar {i}: close price must be positive")
            if p.high < p.low:
                errors.append(f"Bar {i}: high cannot be less than low")
            if p.volume < 0:
                errors.append(f"Bar {i}: volume cannot be negative")
        return errors

    @staticmethod
    def validate_closes(closes: list[float]) -> list[str]:
        errors = []
        if not closes:
            errors.append("Close prices list is required")
            return errors
        for i, c in enumerate(closes):
            if c <= 0:
                errors.append(f"Index {i}: close price must be positive")
        return errors

    @staticmethod
    def handle_missing_data(values: list[float | None]) -> list[float | None]:
        if not values:
            return values
        result = list(values)
        for i in range(len(result)):
            if result[i] is None:
                prev_val = None
                for j in range(i - 1, -1, -1):
                    if result[j] is not None:
                        prev_val = result[j]
                        break
                next_val = None
                for j in range(i + 1, len(result)):
                    if result[j] is not None:
                        next_val = result[j]
                        break
                if prev_val is not None and next_val is not None:
                    result[i] = (prev_val + next_val) / 2
                elif prev_val is not None:
                    result[i] = prev_val
                elif next_val is not None:
                    result[i] = next_val
        return result

    @staticmethod
    def fill_initial_nulls(values: list[float | None], period: int) -> list[float | None]:
        result = list(values)
        first_valid = None
        for i, v in enumerate(result):
            if v is not None:
                first_valid = i
                break
        if first_valid is not None and first_valid > 0:
            fill_val = result[first_valid]
            for i in range(first_valid):
                result[i] = fill_val
        return result

    @staticmethod
    def benchmark_calculation(func, iterations: int = 1000) -> dict:
        import time
        start = time.perf_counter()
        for _ in range(iterations):
            func()
        elapsed = time.perf_counter() - start
        return {
            "iterations": iterations,
            "total_seconds": round(elapsed, 4),
            "avg_ms": round(elapsed / iterations * 1000, 4),
            "ops_per_second": round(iterations / elapsed, 1) if elapsed > 0 else 0,
        }
