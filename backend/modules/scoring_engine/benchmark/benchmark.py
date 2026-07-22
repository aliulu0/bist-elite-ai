from __future__ import annotations

import time
import tracemalloc
from modules.scoring_engine.core.types import BenchmarkResult


class ScoringBenchmark:

    def __init__(self) -> None:
        self._results: list[BenchmarkResult] = []

    def run(
        self,
        fn,
        iterations: int = 100,
        warmup: int = 10,
    ) -> BenchmarkResult:
        for _ in range(warmup):
            try:
                fn()
            except Exception:
                pass

        tracemalloc.start()
        times = []
        for _ in range(iterations):
            start = time.perf_counter()
            try:
                fn()
            except Exception:
                pass
            elapsed = time.perf_counter() - start
            times.append(elapsed)
        _, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        total = sum(times)
        avg = total / max(1, len(times))
        ops = 1.0 / avg if avg > 0 else 0

        result = BenchmarkResult(
            iterations=iterations,
            total_seconds=round(total, 4),
            avg_ms=round(avg * 1000, 4),
            ops_per_second=round(ops, 2),
            memory_bytes=peak,
        )
        self._results.append(result)
        return result

    def run_comparison(
        self,
        fns: dict[str, callable],
        iterations: int = 50,
    ) -> dict[str, BenchmarkResult]:
        results = {}
        for name, fn in fns.items():
            results[name] = self.run(fn, iterations=iterations)
        return results

    def get_results(self) -> list[BenchmarkResult]:
        return list(self._results)

    def get_summary(self) -> dict:
        if not self._results:
            return {"total_runs": 0, "avg_ms": 0, "avg_ops": 0}
        return {
            "total_runs": len(self._results),
            "avg_ms": sum(r.avg_ms for r in self._results) / len(self._results),
            "avg_ops": sum(r.ops_per_second for r in self._results) / len(self._results),
            "min_ms": min(r.avg_ms for r in self._results),
            "max_ms": max(r.avg_ms for r in self._results),
        }

    def clear(self) -> None:
        self._results.clear()
