from __future__ import annotations

import time
import statistics
from typing import Any, Callable, Dict, List, Optional

import tracemalloc

from modules.elite_score_engine.core.types import BenchmarkResult


class EliteBenchmark:
    def __init__(self) -> None:
        self._results: List[BenchmarkResult] = []

    def run(
        self,
        operation: str,
        func: Callable,
        iterations: int = 10,
        warmup: int = 3,
        **kwargs: Any,
    ) -> BenchmarkResult:
        for _ in range(warmup):
            try:
                func(**kwargs)
            except Exception:
                pass

        times: List[float] = []
        success = True
        error_message: Optional[str] = None

        tracemalloc.start()
        try:
            for _ in range(iterations):
                start = time.perf_counter()
                func(**kwargs)
                end = time.perf_counter()
                times.append((end - start) * 1000)
        except Exception as e:
            success = False
            error_message = str(e)
        finally:
            _, peak = tracemalloc.get_traced_memory()
            tracemalloc.stop()

        if not times:
            times = [0.0]

        avg_time = statistics.mean(times)
        min_time = min(times)
        max_time = max(times)
        p95_time = sorted(times)[int(len(times) * 0.95)] if len(times) >= 2 else times[0]
        memory_mb = peak / (1024 * 1024) if peak > 0 else 0.0

        result = BenchmarkResult(
            operation=operation,
            execution_time_ms=avg_time,
            memory_mb=memory_mb,
            iterations=iterations,
            avg_time_ms=avg_time,
            min_time_ms=min_time,
            max_time_ms=max_time,
            p95_time_ms=p95_time,
            success=success,
            error_message=error_message,
        )
        self._results.append(result)
        return result

    def get_results(self) -> List[BenchmarkResult]:
        return list(self._results)

    def compare(
        self,
        operation_a: str,
        operation_b: str,
    ) -> Optional[Dict[str, Any]]:
        a = next((r for r in self._results if r.operation == operation_a), None)
        b = next((r for r in self._results if r.operation == operation_b), None)
        if not a or not b:
            return None
        return {
            "operation_a": operation_a,
            "operation_b": operation_b,
            "a_avg_ms": a.avg_time_ms,
            "b_avg_ms": b.avg_time_ms,
            "speedup": b.avg_time_ms / a.avg_time_ms if a.avg_time_ms > 0 else 0,
        }

    def clear(self) -> None:
        self._results.clear()
