from __future__ import annotations

from modules.volume_engine.core.base import BaseVolumePlugin


class VolumePluginRegistry:

    def __init__(self) -> None:
        self._plugins: dict[str, BaseVolumePlugin] = {}

    def register(self, plugin: BaseVolumePlugin) -> None:
        key = plugin.name.lower()
        self._plugins[key] = plugin

    def get(self, name: str) -> BaseVolumePlugin | None:
        return self._plugins.get(name.lower())

    def list_all(self) -> list[str]:
        return list(self._plugins.keys())

    def has(self, name: str) -> bool:
        return name.lower() in self._plugins


_default_registry: VolumePluginRegistry | None = None


def get_registry() -> VolumePluginRegistry:
    global _default_registry
    if _default_registry is None:
        _default_registry = VolumePluginRegistry()
        _register_defaults(_default_registry)
    return _default_registry


def _register_defaults(reg: VolumePluginRegistry) -> None:
    from modules.volume_engine.plugins.obv_plugin import OBVPlugin
    from modules.volume_engine.plugins.cmf_plugin import CMFPlugin
    from modules.volume_engine.plugins.mfi_plugin import MFIPlugin
    from modules.volume_engine.plugins.vwap_plugin import VWAPPlugin
    from modules.volume_engine.plugins.rvol_plugin import RVOLPlugin
    from modules.volume_engine.plugins.adl_plugin import ADLPlugin
    from modules.volume_engine.plugins.chaikin_plugin import ChaikinPlugin
    from modules.volume_engine.plugins.volume_oscillator_plugin import VolumeOscillatorPlugin
    from modules.volume_engine.plugins.eom_plugin import EoMPlugin
    from modules.volume_engine.plugins.force_index_plugin import ForceIndexPlugin
    from modules.volume_engine.plugins.nvi_plugin import NVIPlugin
    from modules.volume_engine.plugins.pvi_plugin import PVIPlugin

    for cls in [
        OBVPlugin, CMFPlugin, MFIPlugin, VWAPPlugin, RVOLPlugin, ADLPlugin,
        ChaikinPlugin, VolumeOscillatorPlugin, EoMPlugin, ForceIndexPlugin,
        NVIPlugin, PVIPlugin,
    ]:
        reg.register(cls())
