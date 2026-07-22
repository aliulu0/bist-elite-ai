from __future__ import annotations

from modules.momentum_engine.core.base import BaseMomentumPlugin


class MomentumPluginRegistry:

    def __init__(self) -> None:
        self._plugins: dict[str, BaseMomentumPlugin] = {}

    def register(self, plugin: BaseMomentumPlugin) -> None:
        key = plugin.name.lower()
        self._plugins[key] = plugin

    def get(self, name: str) -> BaseMomentumPlugin | None:
        return self._plugins.get(name.lower())

    def list_all(self) -> list[str]:
        return list(self._plugins.keys())

    def has(self, name: str) -> bool:
        return name.lower() in self._plugins


_default_registry: MomentumPluginRegistry | None = None


def get_registry() -> MomentumPluginRegistry:
    global _default_registry
    if _default_registry is None:
        _default_registry = MomentumPluginRegistry()
        _register_defaults(_default_registry)
    return _default_registry


def _register_defaults(reg: MomentumPluginRegistry) -> None:
    from modules.momentum_engine.plugins.rsi_plugin import RSIPlugin
    from modules.momentum_engine.plugins.stoch_rsi_plugin import StochRSIPlugin
    from modules.momentum_engine.plugins.macd_plugin import MACDPlugin
    from modules.momentum_engine.plugins.adx_plugin import ADXPlugin
    from modules.momentum_engine.plugins.cci_plugin import CCIPlugin
    from modules.momentum_engine.plugins.roc_plugin import ROCPlugin
    from modules.momentum_engine.plugins.momentum_plugin import MomentumPlugin
    from modules.momentum_engine.plugins.williams_r_plugin import WilliamsRPlugin
    from modules.momentum_engine.plugins.tsi_plugin import TSIPlugin
    from modules.momentum_engine.plugins.ao_plugin import AwesomeOscillatorPlugin

    for cls in [
        RSIPlugin, StochRSIPlugin, MACDPlugin, ADXPlugin, CCIPlugin,
        ROCPlugin, MomentumPlugin, WilliamsRPlugin, TSIPlugin,
        AwesomeOscillatorPlugin,
    ]:
        reg.register(cls())
