from __future__ import annotations

import math
import time
from modules.trend_engine.core.types import PriceBar, BenchmarkResult


class TrendValidator:

    @staticmethod
    def validate_prices(prices: list[PriceBar]) -> list[str]:
        errors: list[str] = []
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
    def validate_period(period: int, name: str = "period") -> list[str]:
        errors: list[str] = []
        if period <= 0:
            errors.append(f"{name} must be positive")
        if period > 500:
            errors.append(f"{name} cannot exceed 500")
        return errors

    @staticmethod
    def handle_nan(values: list[float | None]) -> list[float | None]:
        result = list(values)
        for i in range(len(result)):
            if result[i] is not None and math.isnan(result[i]):
                result[i] = None
        return result

    @staticmethod
    def handle_missing(values: list[float | None]) -> list[float | None]:
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
    def check_division_safety(numerator: float, denominator: float) -> float | None:
        if denominator == 0:
            return None
        result = numerator / denominator
        if math.isnan(result) or math.isinf(result):
            return None
        return result

    @staticmethod
    def clamp(value: float, min_val: float, max_val: float) -> float:
        return max(min_val, min(max_val, value))

    @staticmethod
    def benchmark(func, iterations: int = 1000) -> BenchmarkResult:
        import tracemalloc
        tracemalloc.start()
        start = time.perf_counter()
        for _ in range(iterations):
            func()
        elapsed = time.perf_counter() - start
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        return BenchmarkResult(
            iterations=iterations,
            total_seconds=round(elapsed, 6),
            avg_ms=round(elapsed / iterations * 1000, 4),
            ops_per_second=round(iterations / elapsed, 1) if elapsed > 0 else 0,
            memory_bytes=peak,
        )
