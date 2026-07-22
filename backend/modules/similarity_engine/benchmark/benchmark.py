from __future__ import annotations

import statistics
import time
from typing import Any, Callable, Dict, List, Optional

from modules.similarity_engine.core.types import BenchmarkResult


class BenchmarkRunner:
    """Performance benchmarking for similarity operations."""

    def __init__(self) -> None:
        self._results: List[BenchmarkResult] = []

    def run(
        self,
        func: Callable[..., Any],
        args: tuple = (),
        kwargs: Optional[Dict[str, Any]] = None,
        iterations: int = 10,
        operation_name: str = "operation",
    ) -> BenchmarkResult:
        kwargs = kwargs or {}
        times: List[float] = []

        for _ in range(iterations):
            start = time.perf_counter()
            try:
                func(*args, **kwargs)
                success = True
                error_msg = ""
            except Exception as e:
                success = False
                error_msg = str(e)
            elapsed = (time.perf_counter() - start) * 1000
            times.append(elapsed)

            if not success:
                result = BenchmarkResult(
                    operation=operation_name,
                    iterations=iterations,
                    avg_time_ms=elapsed,
                    min_time_ms=elapsed,
                    max_time_ms=elapsed,
                    std_dev_ms=0.0,
                    total_time_ms=elapsed,
                    memory_mb=0.0,
                    success=False,
                    error_message=error_msg,
                )
                self._results.append(result)
                return result

        result = BenchmarkResult(
            operation=operation_name,
            iterations=iterations,
            avg_time_ms=statistics.mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=statistics.stdev(times) if len(times) > 1 else 0.0,
            total_time_ms=sum(times),
            memory_mb=0.0,
            success=True,
        )
        self._results.append(result)
        return result

    def get_results(self) -> List[BenchmarkResult]:
        return list(self._results)

    def clear_results(self) -> None:
        self._results.clear()
