from __future__ import annotations

import threading
from typing import Any, Callable, Dict, List, Optional

_instance: Optional[MonteCarloRegistry] = None
_lock = threading.Lock()


class MonteCarloRegistry:
    """Singleton registry for Monte Carlo engine components."""

    def __new__(cls, *args, **kwargs) -> MonteCarloRegistry:
        global _instance
        if _instance is None:
            with _lock:
                if _instance is None:
                    _instance = super().__new__(cls)
                    _instance._initialized = False
        return _instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._simulators: Dict[str, Any] = {}
        self._risk_models: Dict[str, Any] = {}
        self._scenario_generators: Dict[str, Any] = {}
        self._factories: Dict[str, Callable] = {}
        self._initialized = True

    def register_simulator(self, name: str, simulator: Any) -> None:
        self._simulators[name.lower()] = simulator

    def get_simulator(self, name: str) -> Optional[Any]:
        return self._simulators.get(name.lower())

    def list_simulators(self) -> List[str]:
        return list(self._simulators.keys())

    def register_risk_model(self, name: str, model: Any) -> None:
        self._risk_models[name.lower()] = model

    def get_risk_model(self, name: str) -> Optional[Any]:
        return self._risk_models.get(name.lower())

    def list_risk_models(self) -> List[str]:
        return list(self._risk_models.keys())

    def register_scenario_generator(self, name: str, gen: Any) -> None:
        self._scenario_generators[name.lower()] = gen

    def get_scenario_generator(self, name: str) -> Optional[Any]:
        return self._scenario_generators.get(name.lower())

    def list_scenario_generators(self) -> List[str]:
        return list(self._scenario_generators.keys())

    def register_factory(self, name: str, factory: Callable) -> None:
        self._factories[name.lower()] = factory

    def get_factory(self, name: str) -> Optional[Callable]:
        return self._factories.get(name.lower())

    def list_factories(self) -> List[str]:
        return list(self._factories.keys())

    def clear(self) -> None:
        self._simulators.clear()
        self._risk_models.clear()
        self._scenario_generators.clear()
        self._factories.clear()


def reset_monte_carlo_registry() -> None:
    global _instance, _lock
    with _lock:
        _instance = None
        _lock = threading.Lock()
