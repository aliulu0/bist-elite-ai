from __future__ import annotations

import threading
from typing import Any


class ExplanationRegistry:

    _instance = None
    _lock = threading.Lock()

    def __new__(cls) -> ExplanationRegistry:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._builders: dict[str, Any] = {}
        self._configs: dict[str, dict] = {}
        self._initialized = True

    def register(self, name: str, builder: Any, config: dict | None = None) -> None:
        key = self._normalize_key(name)
        self._builders[key] = builder
        self._configs[key] = config or {}

    def get(self, name: str) -> Any | None:
        return self._builders.get(self._normalize_key(name))

    def get_config(self, name: str) -> dict:
        return self._configs.get(self._normalize_key(name), {})

    def list_builders(self) -> list[str]:
        return list(self._builders.keys())

    def unregister(self, name: str) -> bool:
        key = self._normalize_key(name)
        if key in self._builders:
            del self._builders[key]
            self._configs.pop(key, None)
            return True
        return False

    def has(self, name: str) -> bool:
        return self._normalize_key(name) in self._builders

    def count(self) -> int:
        return len(self._builders)

    def clear(self) -> None:
        self._builders.clear()
        self._configs.clear()

    def _normalize_key(self, name: str) -> str:
        return name.strip().lower().replace(" ", "_").replace("-", "_")


def get_registry() -> ExplanationRegistry:
    return ExplanationRegistry()


def reset_registry() -> ExplanationRegistry:
    ExplanationRegistry._instance = None
    ExplanationRegistry._lock = threading.Lock()
    return ExplanationRegistry()
