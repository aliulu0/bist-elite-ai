from __future__ import annotations

import threading
from typing import Any, Callable, Dict, List, Optional

_instance: Optional[DecisionRegistry] = None
_lock = threading.Lock()


class DecisionRegistry:
    """Singleton registry for decision engine calculators and factories."""

    def __new__(cls, *args, **kwargs) -> DecisionRegistry:
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
        self._calculators: Dict[str, Any] = {}
        self._factories: Dict[str, Callable] = {}
        self._initialized = True

    def register_calculator(self, name: str, calculator: Any) -> None:
        self._calculators[name.lower()] = calculator

    def get_calculator(self, name: str) -> Optional[Any]:
        return self._calculators.get(name.lower())

    def has_calculator(self, name: str) -> bool:
        return name.lower() in self._calculators

    def list_calculators(self) -> List[str]:
        return list(self._calculators.keys())

    def remove_calculator(self, name: str) -> bool:
        key = name.lower()
        if key in self._calculators:
            del self._calculators[key]
            return True
        return False

    def register_factory(self, name: str, factory: Callable) -> None:
        self._factories[name.lower()] = factory

    def get_factory(self, name: str) -> Optional[Callable]:
        return self._factories.get(name.lower())

    def list_factories(self) -> List[str]:
        return list(self._factories.keys())

    def clear(self) -> None:
        self._calculators.clear()
        self._factories.clear()


def reset_decision_registry() -> None:
    global _instance, _lock
    with _lock:
        _instance = None
        _lock = threading.Lock()
