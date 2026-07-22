from __future__ import annotations

import time as _time
from typing import Any, Callable, Dict, List, Optional

from modules.walk_forward_engine.core.types import BenchmarkResult, _mean, _stdev


class WalkForwardBenchmark:
    """Performance benchmarking for walk-forward engine operations."""

    def __init__(self) -> None:
        self._results: Dict[str, BenchmarkResult] = {}

    def run(
        self,
        operation: str,
        func: Callable,
        iterations: int = 10,
        warmup: int = 2,
    ) -> BenchmarkResult:
        times: List[float] = []
        error_msg = ""
        success = True
        mem_before = self._get_memory()

        for i in range(warmup + iterations):
            start = _time.perf_counter()
            try:
                func()
            except Exception as e:
                error_msg = str(e)
                success = False
                break
            elapsed = (_time.perf_counter() - start) * 1000
            if i >= warmup:
                times.append(elapsed)

        mem_after = self._get_memory()
        if not times:
            times = [0.0]

        result = BenchmarkResult(
            operation=operation,
            iterations=len(times),
            avg_time_ms=_mean(times),
            min_time_ms=min(times),
            max_time_ms=max(times),
            std_dev_ms=_stdev(times),
            total_time_ms=sum(times),
            memory_mb=max(0.0, mem_after - mem_before),
            success=success,
            error_message=error_msg,
        )
        self._results[operation] = result
        return result

    def get_results(self) -> Dict[str, BenchmarkResult]:
        return dict(self._results)

    def compare(self, op_a: str, op_b: str) -> Optional[Dict[str, Any]]:
        a = self._results.get(op_a)
        b = self._results.get(op_b)
        if not a or not b:
            return None
        return {
            "a": op_a,
            "b": op_b,
            "a_avg_ms": a.avg_time_ms,
            "b_avg_ms": b.avg_time_ms,
            "ratio": a.avg_time_ms / b.avg_time_ms if b.avg_time_ms > 0 else float("inf"),
            "a_faster": a.avg_time_ms < b.avg_time_ms,
        }

    def clear(self) -> None:
        self._results.clear()

    def _get_memory(self) -> float:
        try:
            import os
            import psutil
            return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)
        except Exception:
            return 0.0
