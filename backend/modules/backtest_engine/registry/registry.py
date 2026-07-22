from __future__ import annotations

import threading
from typing import Any, Callable, Dict, List, Optional

_instance: Optional[BacktestRegistry] = None
_lock = threading.Lock()


class BacktestRegistry:
    """Singleton registry for backtest engine components."""

    def __new__(cls, *args, **kwargs) -> BacktestRegistry:
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
        self._strategies: Dict[str, Any] = {}
        self._calculators: Dict[str, Any] = {}
        self._factories: Dict[str, Callable] = {}
        self._initialized = True

    def register_strategy(self, name: str, strategy: Any) -> None:
        self._strategies[name.lower()] = strategy

    def get_strategy(self, name: str) -> Optional[Any]:
        return self._strategies.get(name.lower())

    def list_strategies(self) -> List[str]:
        return list(self._strategies.keys())

    def register_calculator(self, name: str, calc: Any) -> None:
        self._calculators[name.lower()] = calc

    def get_calculator(self, name: str) -> Optional[Any]:
        return self._calculators.get(name.lower())

    def list_calculators(self) -> List[str]:
        return list(self._calculators.keys())

    def register_factory(self, name: str, factory: Callable) -> None:
        self._factories[name.lower()] = factory

    def get_factory(self, name: str) -> Optional[Callable]:
        return self._factories.get(name.lower())

    def list_factories(self) -> List[str]:
        return list(self._factories.keys())

    def clear(self) -> None:
        self._strategies.clear()
        self._calculators.clear()
        self._factories.clear()


def reset_backtest_registry() -> None:
    global _instance, _lock
    with _lock:
        _instance = None
        _lock = threading.Lock()
