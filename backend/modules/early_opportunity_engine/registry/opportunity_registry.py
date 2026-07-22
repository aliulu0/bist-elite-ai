from __future__ import annotations

import threading
from typing import Any


class OpportunityRegistry:

    _instance = None
    _lock = threading.Lock()

    def __new__(cls) -> OpportunityRegistry:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._analyzers: dict[str, Any] = {}
        self._configs: dict[str, dict] = {}
        self._initialized = True

    def register(self, name: str, analyzer: Any, config: dict | None = None) -> None:
        key = self._normalize_key(name)
        self._analyzers[key] = analyzer
        self._configs[key] = config or {}

    def get(self, name: str) -> Any | None:
        key = self._normalize_key(name)
        return self._analyzers.get(key)

    def get_config(self, name: str) -> dict:
        key = self._normalize_key(name)
        return self._configs.get(key, {})

    def list_analyzers(self) -> list[str]:
        return list(self._analyzers.keys())

    def list_configs(self) -> dict[str, dict]:
        return dict(self._configs)

    def unregister(self, name: str) -> bool:
        key = self._normalize_key(name)
        if key in self._analyzers:
            del self._analyzers[key]
            self._configs.pop(key, None)
            return True
        return False

    def has(self, name: str) -> bool:
        return self._normalize_key(name) in self._analyzers

    def count(self) -> int:
        return len(self._analyzers)

    def clear(self) -> None:
        self._analyzers.clear()
        self._configs.clear()

    def _normalize_key(self, name: str) -> str:
        return name.strip().lower().replace(" ", "_").replace("-", "_")


def get_registry() -> OpportunityRegistry:
    return OpportunityRegistry()


def reset_registry() -> OpportunityRegistry:
    OpportunityRegistry._instance = None
    OpportunityRegistry._lock = threading.Lock()
    reg = OpportunityRegistry()
    reg._initialized = False
    return OpportunityRegistry()
