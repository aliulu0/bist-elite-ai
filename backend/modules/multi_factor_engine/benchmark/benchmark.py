from __future__ import annotations

import time
import traceback
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

from modules.multi_factor_engine.core.types import BenchmarkResult, BenchmarkResultStatus


class BenchmarkRunner:
    def __init__(self) -> None:
        self._results: List[BenchmarkResult] = []

    def run(
        self,
        name: str,
        func: Callable[..., Any],
        *args: Any,
        timeout_seconds: float = 30.0,
        **kwargs: Any,
    ) -> BenchmarkResult:
        start = time.perf_counter()
        try:
            result = func(*args, **kwargs)
            elapsed = (time.perf_counter() - start) * 1000
            br = BenchmarkResult(
                name=name,
                status=BenchmarkResultStatus.SUCCESS,
                execution_time_ms=elapsed,
                result=result,
            )
        except TimeoutError:
            elapsed = (time.perf_counter() - start) * 1000
            br = BenchmarkResult(
                name=name,
                status=BenchmarkResultStatus.TIMEOUT,
                execution_time_ms=elapsed,
                error="Timed out",
            )
        except Exception as e:
            elapsed = (time.perf_counter() - start) * 1000
            br = BenchmarkResult(
                name=name,
                status=BenchmarkResultStatus.ERROR,
                execution_time_ms=elapsed,
                error=str(e),
            )
        self._results.append(br)
        return br

    def get_results(self) -> List[BenchmarkResult]:
        return list(self._results)

    def clear(self) -> None:
        self._results.clear()

    def summary(self) -> Dict[str, Any]:
        if not self._results:
            return {"count": 0, "avg_ms": 0.0}
        times = [r.execution_time_ms for r in self._results]
        return {
            "count": len(times),
            "avg_ms": round(sum(times) / len(times), 2),
            "min_ms": round(min(times), 2),
            "max_ms": round(max(times), 2),
            "success_count": sum(1 for r in self._results if r.status == BenchmarkResultStatus.SUCCESS),
            "error_count": sum(1 for r in self._results if r.status == BenchmarkResultStatus.ERROR),
        }
