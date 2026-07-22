from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.strategy_optimizer.core.types import (
    OptimizationObjective,
    ParameterCandidate,
    _mean,
    _stdev,
)


class FitnessCalculator:
    """Evaluates parameter candidates against multiple objectives."""

    DEFAULT_WEIGHTS: Dict[OptimizationObjective, float] = {
        OptimizationObjective.MAXIMIZE_RETURN: 1.0,
        OptimizationObjective.MAXIMIZE_SHARPE: 1.5,
        OptimizationObjective.MINIMIZE_DRAWDOWN: 1.2,
        OptimizationObjective.MAXIMIZE_WIN_RATE: 1.0,
        OptimizationObjective.INCREASE_CONSISTENCY: 1.0,
        OptimizationObjective.REDUCE_FALSE_POSITIVES: 0.8,
        OptimizationObjective.REDUCE_FALSE_NEGATIVES: 0.8,
        OptimizationObjective.IMPROVE_ROBUSTNESS: 1.3,
    }

    def __init__(
        self,
        objectives: Optional[List[OptimizationObjective]] = None,
        weights: Optional[Dict[OptimizationObjective, float]] = None,
    ) -> None:
        self._objectives = objectives or list(OptimizationObjective)
        self._weights = weights or dict(self.DEFAULT_WEIGHTS)

    def evaluate(
        self,
        candidate: ParameterCandidate,
        baseline_metrics: Optional[Dict[str, float]] = None,
    ) -> float:
        scores = self._compute_objective_scores(candidate, baseline_metrics)
        candidate.objective_scores = scores
        fitness = self._weighted_fitness(scores)
        candidate.fitness_score = fitness
        return fitness

    def rank_candidates(
        self,
        candidates: List[ParameterCandidate],
        baseline_metrics: Optional[Dict[str, float]] = None,
    ) -> List[ParameterCandidate]:
        for c in candidates:
            if not c.objective_scores:
                self.evaluate(c, baseline_metrics)
        return sorted(candidates, key=lambda c: c.overall_score, reverse=True)

    def select_top(
        self,
        candidates: List[ParameterCandidate],
        top_n: int = 10,
        baseline_metrics: Optional[Dict[str, float]] = None,
    ) -> List[ParameterCandidate]:
        ranked = self.rank_candidates(candidates, baseline_metrics)
        return ranked[:top_n]

    def _compute_objective_scores(
        self,
        candidate: ParameterCandidate,
        baseline: Optional[Dict[str, float]],
    ) -> Dict[str, float]:
        base = baseline or {}
        scores: Dict[str, float] = {}
        obj = candidate.metadata.get("backtest_metrics", {})
        wf = candidate.metadata.get("walk_forward_metrics", {})
        mc = candidate.metadata.get("monte_carlo_metrics", {})

        total_return = obj.get("total_return", 0.0)
        base_return = base.get("total_return", 0.0)
        scores["maximize_return"] = self._normalize_return(total_return, base_return)

        sharpe = obj.get("sharpe_ratio", 0.0)
        scores["maximize_sharpe"] = self._normalize_sharpe(sharpe)

        max_dd = obj.get("max_drawdown", 0.0)
        scores["minimize_drawdown"] = self._normalize_drawdown(max_dd)

        win_rate = obj.get("win_rate", 50.0)
        scores["maximize_win_rate"] = self._normalize_win_rate(win_rate)

        consistency = wf.get("consistency_score", 0.5)
        scores["increase_consistency"] = self._clamp(consistency)

        false_pos = obj.get("false_positive_rate", 0.5)
        scores["reduce_false_positives"] = self._clamp(1.0 - false_pos)

        false_neg = obj.get("false_negative_rate", 0.5)
        scores["reduce_false_negatives"] = self._clamp(1.0 - false_neg)

        robustness = (
            wf.get("robustness_score", 0.5) + candidate.monte_carlo_score
        ) / 2.0
        scores["improve_robustness"] = self._clamp(robustness)

        return scores

    def _weighted_fitness(self, scores: Dict[str, float]) -> float:
        total_weight = 0.0
        weighted_sum = 0.0
        obj_map = {
            "maximize_return": OptimizationObjective.MAXIMIZE_RETURN,
            "maximize_sharpe": OptimizationObjective.MAXIMIZE_SHARPE,
            "minimize_drawdown": OptimizationObjective.MINIMIZE_DRAWDOWN,
            "maximize_win_rate": OptimizationObjective.MAXIMIZE_WIN_RATE,
            "increase_consistency": OptimizationObjective.INCREASE_CONSISTENCY,
            "reduce_false_positives": OptimizationObjective.REDUCE_FALSE_POSITIVES,
            "reduce_false_negatives": OptimizationObjective.REDUCE_FALSE_NEGATIVES,
            "improve_robustness": OptimizationObjective.IMPROVE_ROBUSTNESS,
        }
        for key, val in scores.items():
            obj_enum = obj_map.get(key)
            w = self._weights.get(obj_enum, 1.0) if obj_enum else 1.0
            weighted_sum += val * w
            total_weight += w
        return weighted_sum / total_weight if total_weight > 0 else 0.0

    def _normalize_return(self, value: float, baseline: float) -> float:
        if baseline != 0:
            improvement = (value - baseline) / abs(baseline)
            return self._clamp(0.5 + improvement)
        return self._clamp(min(1.0, max(0.0, value / 100.0 + 0.5)))

    def _normalize_sharpe(self, value: float) -> float:
        if value < 0:
            return self._clamp(max(0.0, 0.3 + value * 0.3))
        return self._clamp(min(1.0, 0.5 + value * 0.25))

    def _normalize_drawdown(self, value: float) -> float:
        abs_dd = abs(value)
        if abs_dd <= 5.0:
            return 1.0
        if abs_dd <= 10.0:
            return 0.8
        if abs_dd <= 20.0:
            return 0.5
        if abs_dd <= 30.0:
            return 0.3
        return 0.1

    def _normalize_win_rate(self, value: float) -> float:
        return self._clamp(value / 100.0)

    @staticmethod
    def _clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
        return max(lo, min(hi, value))
