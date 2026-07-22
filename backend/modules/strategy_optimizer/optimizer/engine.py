from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from modules.strategy_optimizer.core.types import (
    InvestmentHorizon,
    OptimizationObjective,
    OptimizationRequest,
    OptimizationResult,
    OptimizationRun,
    OptimizationType,
    ParameterCandidate,
    RejectionReason,
    ValidationStage,
    compute_fitness_score,
    compute_improvement,
)
from modules.strategy_optimizer.fitness.calculator import FitnessCalculator
from modules.strategy_optimizer.parameter_engine.engine import ParameterSpaceBuilder
from modules.strategy_optimizer.profiles.manager import ProfileManager
from modules.strategy_optimizer.validators.validator import RequestValidator, ResultValidator


class StrategyOptimizer:
    """Core optimization engine that orchestrates the full pipeline."""

    def __init__(
        self,
        parameter_engine: Optional[ParameterSpaceBuilder] = None,
        fitness_calculator: Optional[FitnessCalculator] = None,
        profile_manager: Optional[ProfileManager] = None,
        request_validator: Optional[RequestValidator] = None,
        result_validator: Optional[ResultValidator] = None,
    ) -> None:
        self._parameter_engine = parameter_engine or ParameterSpaceBuilder()
        self._fitness_calculator = fitness_calculator or FitnessCalculator()
        self._profile_manager = profile_manager or ProfileManager()
        self._request_validator = request_validator or RequestValidator()
        self._result_validator = result_validator or ResultValidator()
        self._all_runs: List[OptimizationRun] = []

    def optimize(self, request: OptimizationRequest) -> OptimizationResult:
        start = time.time()
        errors = self._request_validator.validate(request)
        if errors:
            raise ValueError(f"Invalid request: {'; '.join(errors)}")

        run = OptimizationRun(
            run_id=f"run_{request.symbol}_{request.optimization_type.value}_{request.horizon.value}",
            symbol=request.symbol,
            strategy=request.strategy,
            optimization_type=request.optimization_type,
            horizon=request.horizon,
            objective=request.objective,
        )

        space = self._resolve_parameter_space(request)
        profile = self._profile_manager.get_profile(request.horizon)
        baseline_fitness = self._baseline_fitness(request)

        candidates = self._generate_candidates(
            space, request.max_candidates, request.seed
        )

        accepted: List[ParameterCandidate] = []
        rejected: List[ParameterCandidate] = []
        patience_counter = 0
        best_so_far = baseline_fitness

        for params in candidates:
            candidate = ParameterCandidate(parameters=params)
            fitness = self._evaluate_candidate(candidate, request, baseline_fitness)
            candidate.overall_score = fitness

            rejection_reasons = self._validate_candidate(
                candidate, request, baseline_fitness
            )

            if rejection_reasons:
                candidate.rejection_reasons = rejection_reasons
                candidate.is_accepted = False
                rejected.append(candidate)
            else:
                candidate.is_accepted = True
                accepted.append(candidate)
                if fitness > best_so_far:
                    best_so_far = fitness
                    patience_counter = 0
                else:
                    patience_counter += 1

            run.candidates_evaluated += 1

            if request.early_stopping and patience_counter >= request.early_stopping_patience:
                break

        run.all_candidates = accepted + rejected
        run.accepted_candidates = accepted
        run.rejected_candidates = rejected
        run.candidates_accepted = len(accepted)
        run.candidates_rejected = len(rejected)
        run.baseline_fitness = baseline_fitness

        best = max(accepted, key=lambda c: c.overall_score) if accepted else None
        run.best_candidate = best
        run.best_fitness = best.overall_score if best else baseline_fitness
        run.improvement_pct = compute_improvement(baseline_fitness, run.best_fitness)

        self._all_runs.append(run)

        optimized_params = best.parameters if best else {}
        perf_imp = self._compute_performance_improvement(best, baseline_fitness)
        risk_imp = self._compute_risk_improvement(best)

        result = OptimizationResult(
            request=request,
            run=run,
            optimized_parameters=optimized_params,
            performance_improvement=perf_imp,
            risk_improvement=risk_imp,
            robustness_score=best.metadata.get("walk_forward_metrics", {}).get(
                "robustness_score", 0.0
            ) if best else 0.0,
            generalization_score=best.metadata.get("walk_forward_metrics", {}).get(
                "generalization_score", 0.0
            ) if best else 0.0,
            execution_time_ms=(time.time() - start) * 1000,
        )

        run.execution_time_ms = result.execution_time_ms
        return result

    def get_history(self) -> List[OptimizationRun]:
        return list(self._all_runs)

    def get_history_by_symbol(self, symbol: str) -> List[OptimizationRun]:
        return [r for r in self._all_runs if r.symbol == symbol]

    def get_run(self, run_id: str) -> Optional[OptimizationRun]:
        for r in self._all_runs:
            if r.run_id == run_id:
                return r
        return None

    def reset_history(self) -> None:
        self._all_runs.clear()

    def _resolve_parameter_space(self, request: OptimizationRequest) -> Dict[str, Any]:
        if request.parameter_space:
            return request.parameter_space
        profile = self._profile_manager.get_profile(request.horizon)
        categories = (
            request.metadata.get("categories")
            or profile.parameter_categories
            or None
        )
        return self._parameter_engine.build_space(
            request.optimization_type, categories=categories
        )

    def _generate_candidates(
        self,
        space: Any,
        max_candidates: int,
        seed: Optional[int],
    ) -> List[Dict[str, Any]]:
        if hasattr(space, "items"):
            return self._parameter_engine.generate_candidates(
                space, max_candidates, seed
            )
        return []

    def _baseline_fitness(self, request: OptimizationRequest) -> float:
        return 0.5

    def _evaluate_candidate(
        self,
        candidate: ParameterCandidate,
        request: OptimizationRequest,
        baseline_fitness: float,
    ) -> float:
        metrics = self._simulate_candidate_metrics(candidate, request)
        candidate.metadata["backtest_metrics"] = metrics
        candidate.metadata["walk_forward_metrics"] = {
            "consistency_score": 0.5,
            "robustness_score": 0.5,
            "generalization_score": 0.5,
        }
        candidate.metadata["monte_carlo_metrics"] = {"risk_score": 0.5}

        candidate.backtest_score = metrics.get("score", 0.5)
        candidate.walk_forward_score = 0.5
        candidate.monte_carlo_score = 0.5

        return self._fitness_calculator.evaluate(candidate, {"total_return": 0.1})

    def _simulate_candidate_metrics(
        self,
        candidate: ParameterCandidate,
        request: OptimizationRequest,
    ) -> Dict[str, float]:
        import hashlib
        import struct

        params_str = str(sorted(candidate.parameters.items()))
        h = hashlib.md5(params_str.encode()).digest()
        seed_val = struct.unpack("<I", h[:4])[0] % 10000
        rng_factor = (seed_val / 10000.0) * 0.3 + 0.35

        return {
            "total_return": rng_factor * 1.2,
            "sharpe_ratio": rng_factor * 2.0,
            "max_drawdown": (1.0 - rng_factor) * 40.0,
            "win_rate": 40.0 + rng_factor * 30.0,
            "score": rng_factor,
            "false_positive_rate": 0.5 - rng_factor * 0.3,
            "false_negative_rate": 0.5 - rng_factor * 0.3,
        }

    def _validate_candidate(
        self,
        candidate: ParameterCandidate,
        request: OptimizationRequest,
        baseline_fitness: float,
    ) -> List[RejectionReason]:
        reasons = self._result_validator.check_rejection_rules(
            candidate, request.rejection_thresholds
        )
        candidate.rejection_reasons = reasons
        return reasons

    def _compute_performance_improvement(
        self,
        best: Optional[ParameterCandidate],
        baseline: float,
    ) -> Dict[str, float]:
        if not best:
            return {}
        return {
            "fitness_improvement_pct": compute_improvement(baseline, best.overall_score),
            "return_improvement_pct": best.objective_scores.get("maximize_return", 0.5) * 100,
            "sharpe_improvement_pct": best.objective_scores.get("maximize_sharpe", 0.5) * 100,
            "win_rate_improvement_pct": best.objective_scores.get("maximize_win_rate", 0.5) * 100,
        }

    def _compute_risk_improvement(
        self, best: Optional[ParameterCandidate]
    ) -> Dict[str, float]:
        if not best:
            return {}
        return {
            "drawdown_improvement_pct": best.objective_scores.get("minimize_drawdown", 0.5) * 100,
            "consistency_score": best.objective_scores.get("increase_consistency", 0.5),
            "robustness_score": best.objective_scores.get("improve_robustness", 0.5),
        }
