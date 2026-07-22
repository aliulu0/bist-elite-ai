from __future__ import annotations

import threading
from typing import Any


class ScoringRegistry:

    _instance = None
    _lock = threading.Lock()

    def __new__(cls) -> ScoringRegistry:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._calculators: dict[str, Any] = {}
        self._configs: dict[str, dict] = {}
        self._initialized = True

    def register(self, name: str, calculator: Any, config: dict | None = None) -> None:
        key = self._normalize_key(name)
        self._calculators[key] = calculator
        self._configs[key] = config or {}

    def get(self, name: str) -> Any | None:
        return self._calculators.get(self._normalize_key(name))

    def get_config(self, name: str) -> dict:
        return self._configs.get(self._normalize_key(name), {})

    def list_calculators(self) -> list[str]:
        return list(self._calculators.keys())

    def unregister(self, name: str) -> bool:
        key = self._normalize_key(name)
        if key in self._calculators:
            del self._calculators[key]
            self._configs.pop(key, None)
            return True
        return False

    def has(self, name: str) -> bool:
        return self._normalize_key(name) in self._calculators

    def count(self) -> int:
        return len(self._calculators)

    def clear(self) -> None:
        self._calculators.clear()
        self._configs.clear()

    def _normalize_key(self, name: str) -> str:
        return name.strip().lower().replace(" ", "_").replace("-", "_")


def get_registry() -> ScoringRegistry:
    return ScoringRegistry()


def reset_registry() -> ScoringRegistry:
    ScoringRegistry._instance = None
    ScoringRegistry._lock = threading.Lock()
    return ScoringRegistry()
