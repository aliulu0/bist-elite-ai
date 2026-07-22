from __future__ import annotations

import threading
from typing import Dict, Optional, Any, Callable


class ConfidenceRegistry:
    _instance: Optional["ConfidenceRegistry"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "ConfidenceRegistry":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._initialized = True
        self._calculators: Dict[str, Any] = {}
        self._factories: Dict[str, Callable] = {}

    def register_calculator(self, name: str, calculator: Any) -> None:
        normalized = name.lower().strip()
        self._calculators[normalized] = calculator

    def get_calculator(self, name: str) -> Optional[Any]:
        normalized = name.lower().strip()
        return self._calculators.get(normalized)

    def register_factory(self, name: str, factory: Callable) -> None:
        normalized = name.lower().strip()
        self._factories[normalized] = factory

    def get_factory(self, name: str) -> Optional[Callable]:
        normalized = name.lower().strip()
        return self._factories.get(normalized)

    def list_calculators(self) -> list[str]:
        return list(self._calculators.keys())

    def list_factories(self) -> list[str]:
        return list(self._factories.keys())

    def has_calculator(self, name: str) -> bool:
        return name.lower().strip() in self._calculators

    def remove_calculator(self, name: str) -> bool:
        normalized = name.lower().strip()
        if normalized in self._calculators:
            del self._calculators[normalized]
            return True
        return False

    def clear(self) -> None:
        self._calculators.clear()
        self._factories.clear()


def reset_confidence_registry() -> None:
    ConfidenceRegistry._instance = None
    ConfidenceRegistry._lock = threading.Lock()
