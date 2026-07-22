from __future__ import annotations

import itertools
import time as _time
from typing import Any, Callable, Dict, List, Optional

from modules.walk_forward_engine.core.types import (
    OptimizationResult,
    WalkForwardRequest,
    _mean,
    _stdev,
)


class ParameterOptimizer:
    """Optimizes strategy parameters on training windows."""

    def __init__(self) -> None:
        self._optimization_history: List[OptimizationResult] = []

    def optimize(
        self,
        request: WalkForwardRequest,
        train_data: List[float],
        strategy_fn: Optional[Callable[[List[float], Dict[str, Any]], float]] = None,
    ) -> OptimizationResult:
        start = _time.perf_counter()
        param_combinations = self._generate_combinations(request.parameter_space, request.max_combinations)
        if not param_combinations:
            return self._default_result({}, _time.perf_counter() - start)
        best_score = float("-inf")
        best_params: Dict[str, Any] = {}
        best_result = OptimizationResult()
        for params in param_combinations:
            result = self._evaluate_combination(train_data, params, strategy_fn, request.optimization_metric)
            if result.score > best_score:
                best_score = result.score
                best_params = params
                best_result = result
        best_result.parameters = best_params
        elapsed = (_time.perf_counter() - start) * 1000
        best_result.execution_time_ms = elapsed
        self._optimization_history.append(best_result)
        return best_result

    def optimize_grid(
        self,
        parameter_space: Dict[str, List[Any]],
        evaluator: Callable[[Dict[str, Any]], float],
        max_combinations: int = 100,
    ) -> OptimizationResult:
        start = _time.perf_counter()
        combinations = self._generate_combinations(parameter_space, max_combinations)
        best_score = float("-inf")
        best_params: Dict[str, Any] = {}
        for params in combinations:
            score = evaluator(params)
            if score > best_score:
                best_score = score
                best_params = params
        elapsed = (_time.perf_counter() - start) * 1000
        result = OptimizationResult(
            parameters=best_params,
            score=best_score,
            execution_time_ms=elapsed,
        )
        self._optimization_history.append(result)
        return result

    def get_history(self) -> List[OptimizationResult]:
        return list(self._optimization_history)

    def clear_history(self) -> None:
        self._optimization_history.clear()

    def _generate_combinations(
        self,
        parameter_space: Dict[str, List[Any]],
        max_combinations: int,
    ) -> List[Dict[str, Any]]:
        if not parameter_space:
            return [{}]
        keys = list(parameter_space.keys())
        values = list(parameter_space.values())
        combos = list(itertools.product(*values))
        if len(combos) > max_combinations:
            step = max(1, len(combos) // max_combinations)
            combos = combos[::step][:max_combinations]
        return [dict(zip(keys, combo)) for combo in combos]

    def _evaluate_combination(
        self,
        train_data: List[float],
        params: Dict[str, Any],
        strategy_fn: Optional[Callable[[List[float], Dict[str, Any]], float]],
        metric: str,
    ) -> OptimizationResult:
        if strategy_fn is not None:
            try:
                score = strategy_fn(train_data, params)
            except Exception:
                score = 0.0
        else:
            score = self._simulate_score(train_data, params, metric)
        return OptimizationResult(
            parameters=params,
            score=score,
            train_return=score * 100,
            train_sharpe=score * 1.5,
            train_win_rate=max(0, min(100, 50 + score * 20)),
            train_trades=len(train_data) // 10 if train_data else 0,
        )

    def _simulate_score(
        self,
        train_data: List[float],
        params: Dict[str, Any],
        metric: str,
    ) -> float:
        if not train_data:
            return 0.0
        returns = train_data if all(isinstance(x, (int, float)) for x in train_data) else [0.0]
        avg = _mean(returns)
        std = _stdev(returns) if len(returns) > 1 else 1.0
        param_bonus = len(params) * 0.01
        if metric == "sharpe":
            return (avg / std * 1.41 + param_bonus) if std > 0 else 0.0
        elif metric == "return":
            return avg + param_bonus
        elif metric == "sortino":
            downside = [r for r in returns if r < 0]
            down_std = _stdev(downside) if len(downside) > 1 else 1.0
            return (avg / down_std * 1.41 + param_bonus) if down_std > 0 else 0.0
        return avg + param_bonus

    def _default_result(self, params: Dict[str, Any], elapsed: float) -> OptimizationResult:
        return OptimizationResult(
            parameters=params,
            score=0.0,
            execution_time_ms=elapsed * 1000,
        )
