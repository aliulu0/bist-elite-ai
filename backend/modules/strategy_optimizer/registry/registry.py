from __future__ import annotations

import threading
from typing import Any, Dict, List, Optional

from modules.strategy_optimizer.core.types import InvestmentHorizon, OptimizationRun
from modules.strategy_optimizer.fitness.calculator import FitnessCalculator
from modules.strategy_optimizer.optimizer.engine import StrategyOptimizer
from modules.strategy_optimizer.parameter_engine.engine import ParameterSpaceBuilder
from modules.strategy_optimizer.profiles.manager import ProfileManager
from modules.strategy_optimizer.validators.validator import RequestValidator, ResultValidator


class StrategyOptimizerRegistry:
    """Singleton registry for strategy optimizer components."""

    _instance: Optional["StrategyOptimizerRegistry"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls, *args: Any, **kwargs: Any) -> "StrategyOptimizerRegistry":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if not hasattr(self, "_initialized"):
            self._initialized = True
            self._optimizer: Optional[StrategyOptimizer] = None
            self._parameter_engine: Optional[ParameterSpaceBuilder] = None
            self._fitness_calculator: Optional[FitnessCalculator] = None
            self._profile_manager: Optional[ProfileManager] = None
            self._request_validator: Optional[RequestValidator] = None
            self._result_validator: Optional[ResultValidator] = None
            self._run_history: List[OptimizationRun] = []

    def get_optimizer(self) -> StrategyOptimizer:
        if self._optimizer is None:
            self._optimizer = StrategyOptimizer(
                parameter_engine=self.get_parameter_engine(),
                fitness_calculator=self.get_fitness_calculator(),
                profile_manager=self.get_profile_manager(),
                request_validator=self.get_request_validator(),
                result_validator=self.get_result_validator(),
            )
        return self._optimizer

    def get_parameter_engine(self) -> ParameterSpaceBuilder:
        if self._parameter_engine is None:
            self._parameter_engine = ParameterSpaceBuilder()
        return self._parameter_engine

    def get_fitness_calculator(self) -> FitnessCalculator:
        if self._fitness_calculator is None:
            self._fitness_calculator = FitnessCalculator()
        return self._fitness_calculator

    def get_profile_manager(self) -> ProfileManager:
        if self._profile_manager is None:
            self._profile_manager = ProfileManager()
        return self._profile_manager

    def get_request_validator(self) -> RequestValidator:
        if self._request_validator is None:
            self._request_validator = RequestValidator()
        return self._request_validator

    def get_result_validator(self) -> ResultValidator:
        if self._result_validator is None:
            self._result_validator = ResultValidator()
        return self._result_validator

    def add_run(self, run: OptimizationRun) -> None:
        self._run_history.append(run)

    def get_history(self) -> List[OptimizationRun]:
        return list(self._run_history)

    def get_history_by_symbol(self, symbol: str) -> List[OptimizationRun]:
        return [r for r in self._run_history if r.symbol == symbol]

    def clear_history(self) -> None:
        self._run_history.clear()


def reset_registry() -> None:
    with StrategyOptimizerRegistry._lock:
        StrategyOptimizerRegistry._instance = None
        StrategyOptimizerRegistry._lock = threading.Lock()
