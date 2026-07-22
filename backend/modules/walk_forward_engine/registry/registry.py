from __future__ import annotations

import threading
from typing import Any, Callable, Dict, List, Optional

_instance: Optional[WalkForwardRegistry] = None
_lock = threading.Lock()


class WalkForwardRegistry:
    """Singleton registry for walk-forward engine components."""

    def __new__(cls, *args, **kwargs) -> WalkForwardRegistry:
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
        self._optimizers: Dict[str, Any] = {}
        self._validators: Dict[str, Any] = {}
        self._factories: Dict[str, Callable] = {}
        self._initialized = True

    def register_strategy(self, name: str, strategy: Any) -> None:
        self._strategies[name.lower()] = strategy

    def get_strategy(self, name: str) -> Optional[Any]:
        return self._strategies.get(name.lower())

    def list_strategies(self) -> List[str]:
        return list(self._strategies.keys())

    def register_optimizer(self, name: str, optimizer: Any) -> None:
        self._optimizers[name.lower()] = optimizer

    def get_optimizer(self, name: str) -> Optional[Any]:
        return self._optimizers.get(name.lower())

    def list_optimizers(self) -> List[str]:
        return list(self._optimizers.keys())

    def register_validator(self, name: str, validator: Any) -> None:
        self._validators[name.lower()] = validator

    def get_validator(self, name: str) -> Optional[Any]:
        return self._validators.get(name.lower())

    def list_validators(self) -> List[str]:
        return list(self._validators.keys())

    def register_factory(self, name: str, factory: Callable) -> None:
        self._factories[name.lower()] = factory

    def get_factory(self, name: str) -> Optional[Callable]:
        return self._factories.get(name.lower())

    def list_factories(self) -> List[str]:
        return list(self._factories.keys())

    def clear(self) -> None:
        self._strategies.clear()
        self._optimizers.clear()
        self._validators.clear()
        self._factories.clear()


def reset_walk_forward_registry() -> None:
    global _instance, _lock
    with _lock:
        _instance = None
        _lock = threading.Lock()
