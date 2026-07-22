from __future__ import annotations

from modules.scoring_engine.core.types import (
    ScoreType, ScoreWeight, WeightConfig, OptimizationResult,
)
import time


class WeightOptimizer:

    def optimize(
        self,
        config: WeightConfig,
        historical_data: dict | None = None,
        iterations: int = 50,
    ) -> OptimizationResult:
        start = time.perf_counter()
        original = {st.value: sw.weight for st, sw in config.weights.items()}
        optimized = dict(original)

        for _ in range(iterations):
            improved = False
            for st in optimized:
                for st2 in optimized:
                    if st == st2:
                        continue
                    delta = 0.01
                    if optimized[st] > delta and optimized[st2] < 1.0 - delta:
                        new_a = optimized[st] - delta
                        new_b = optimized[st2] + delta
                        if self._evaluate(new_a, new_b, st, st2, historical_data) > \
                           self._evaluate(optimized[st], optimized[st2], st, st2, historical_data):
                            optimized[st] = new_a
                            optimized[st2] = new_b
                            improved = True
            if not improved:
                break

        total = sum(optimized.values())
        if total > 0:
            optimized = {k: v / total for k, v in optimized.items()}

        original_score = self._total_score(original, historical_data)
        optimized_score = self._total_score(optimized, historical_data)
        improvement = ((optimized_score - original_score) / max(0.001, original_score)) * 100

        elapsed = time.perf_counter() - start
        return OptimizationResult(
            original_weights=original,
            optimized_weights=optimized,
            improvement_pct=round(improvement, 4),
            iterations=iterations,
            method="rule_based",
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
        )

    def _evaluate(self, w1: float, w2: float, st1: str, st2: str, data: dict | None) -> float:
        base = w1 + w2
        if data and "scores" in data:
            scores = data["scores"]
            s1 = scores.get(st1, 0.5)
            s2 = scores.get(st2, 0.5)
            return base * (s1 + s2) / 2.0
        return base

    def _total_score(self, weights: dict[str, float], data: dict | None) -> float:
        if data and "scores" in data:
            scores = data["scores"]
            return sum(weights.get(k, 0) * scores.get(k, 0.5) for k in weights)
        return 1.0

    def apply_optimization(
        self,
        config: WeightConfig,
        result: OptimizationResult,
    ) -> WeightConfig:
        for st_str, new_weight in result.optimized_weights.items():
            try:
                st = ScoreType(st_str)
                if st in config.weights:
                    config.weights[st].weight = new_weight
            except ValueError:
                continue
        return config
