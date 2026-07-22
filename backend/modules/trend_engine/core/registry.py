from __future__ import annotations

from modules.trend_engine.core.base import BaseTrendPlugin


class TrendPluginRegistry:

    def __init__(self) -> None:
        self._plugins: dict[str, BaseTrendPlugin] = {}

    def register(self, plugin: BaseTrendPlugin) -> None:
        key = plugin.name.lower()
        self._plugins[key] = plugin

    def get(self, name: str) -> BaseTrendPlugin | None:
        return self._plugins.get(name.lower())

    def list_all(self) -> list[str]:
        return list(self._plugins.keys())

    def has(self, name: str) -> bool:
        return name.lower() in self._plugins


_default_registry: TrendPluginRegistry | None = None


def get_registry() -> TrendPluginRegistry:
    global _default_registry
    if _default_registry is None:
        _default_registry = TrendPluginRegistry()
        _register_defaults(_default_registry)
    return _default_registry


def _register_defaults(reg: TrendPluginRegistry) -> None:
    from modules.trend_engine.plugins.supertrend_plugin import SuperTrendPlugin
    from modules.trend_engine.plugins.ichimoku_plugin import IchimokuPlugin
    from modules.trend_engine.plugins.donchian_plugin import DonchianPlugin
    from modules.trend_engine.plugins.parabolic_sar_plugin import ParabolicSARPlugin
    from modules.trend_engine.plugins.bollinger_plugin import BollingerPlugin
    from modules.trend_engine.plugins.keltner_plugin import KeltnerPlugin
    from modules.trend_engine.plugins.ma_envelope_plugin import MAEnvelopePlugin
    from modules.trend_engine.plugins.linear_regression_plugin import LinearRegressionPlugin

    for cls in [
        SuperTrendPlugin, IchimokuPlugin, DonchianPlugin, ParabolicSARPlugin,
        BollingerPlugin, KeltnerPlugin, MAEnvelopePlugin, LinearRegressionPlugin,
    ]:
        reg.register(cls())
