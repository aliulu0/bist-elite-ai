from __future__ import annotations

from modules.moving_average.plugins.base import BaseMAPattern
from modules.moving_average.core.types import MAType


class MAPluginRegistry:

    def __init__(self) -> None:
        self._plugins: dict[str, BaseMAPattern] = {}

    def register(self, plugin: BaseMAPattern) -> None:
        key = plugin.name.lower()
        self._plugins[key] = plugin

    def get(self, name: str) -> BaseMAPattern | None:
        return self._plugins.get(name.lower())

    def list_all(self) -> list[str]:
        return list(self._plugins.keys())

    def has(self, name: str) -> bool:
        return name.lower() in self._plugins


_default_registry: MAPluginRegistry | None = None


def get_registry() -> MAPluginRegistry:
    global _default_registry
    if _default_registry is None:
        _default_registry = MAPluginRegistry()
        _register_defaults(_default_registry)
    return _default_registry


def _register_defaults(reg: MAPluginRegistry) -> None:
    from modules.moving_average.plugins.sma_plugin import SMAPlugin
    from modules.moving_average.plugins.ema_plugin import EMAPlugin
    from modules.moving_average.plugins.wma_plugin import WMAPlugin
    from modules.moving_average.plugins.hma_plugin import HMAPlugin
    from modules.moving_average.plugins.smma_plugin import SMMAPlugin
    from modules.moving_average.plugins.vwma_plugin import VWMAPlugin

    for cls in [SMAPlugin, EMAPlugin, WMAPlugin, HMAPlugin, SMMAPlugin, VWMAPlugin]:
        reg.register(cls())
