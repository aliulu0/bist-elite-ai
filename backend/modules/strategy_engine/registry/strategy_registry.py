from __future__ import annotations

from modules.strategy_engine.core.types import StrategyDefinition
from modules.strategy_engine.core.base import BaseStrategy
from modules.strategy_engine.templates.builtin_templates import BuiltinTemplates


_default_registry = None


class StrategyRegistry:

    @staticmethod
    def _normalize_key(name: str) -> str:
        return name.lower().replace(" ", "_").replace("-", "_")

    def __init__(self) -> None:
        self._strategies: dict[str, BaseStrategy] = {}
        self._definitions: dict[str, StrategyDefinition] = {}

    def register(self, strategy: BaseStrategy) -> None:
        key = self._normalize_key(strategy.name)
        self._strategies[key] = strategy
        self._definitions[key] = strategy.build_definition()

    def register_definition(self, definition: StrategyDefinition) -> None:
        key = self._normalize_key(definition.name)
        self._definitions[key] = definition

    def get(self, name: str) -> BaseStrategy | None:
        return self._strategies.get(self._normalize_key(name))

    def get_definition(self, name: str) -> StrategyDefinition | None:
        return self._definitions.get(self._normalize_key(name))

    def has(self, name: str) -> bool:
        return self._normalize_key(name) in self._definitions

    def list_all(self) -> list[str]:
        return list(self._definitions.keys())

    def list_definitions(self) -> list[StrategyDefinition]:
        return list(self._definitions.values())

    def remove(self, name: str) -> bool:
        key = self._normalize_key(name)
        removed = False
        if key in self._strategies:
            del self._strategies[key]
            removed = True
        if key in self._definitions:
            del self._definitions[key]
            removed = True
        return removed

    def clear(self) -> None:
        self._strategies.clear()
        self._definitions.clear()

    def count(self) -> int:
        return len(self._definitions)


def get_registry() -> StrategyRegistry:
    global _default_registry
    if _default_registry is None:
        _default_registry = StrategyRegistry()
        _register_builtin_strategies(_default_registry)
    return _default_registry


def _register_builtin_strategies(registry: StrategyRegistry) -> None:
    templates = BuiltinTemplates.get_all()
    for key, definition in templates.items():
        registry.register_definition(definition)
