import pytest
import json
import shutil
import tempfile
from pathlib import Path

from modules.plugin_system.manager.plugin_loader import PluginLoader, PluginManifest
from modules.plugin_system.manager.plugin_registry import PluginRegistry
from modules.plugin_system.manager.plugin_manager import PluginManager
from modules.plugin_system.config.plugin_configuration import PluginConfiguration
from modules.plugin_system.interfaces.enums import (
    PluginCategory,
    PluginMeta,
    PluginPermission,
    PluginStatus,
)
from modules.plugin_system.interfaces.plugin_interface import PluginInterface


PLUGIN_FIXTURES = Path(__file__).resolve().parent.parent.parent / "plugins"


class ConcretePlugin(PluginInterface):
    async def initialize(self, config):
        self.set_config(config)
        return True

    async def validate(self):
        return True

    async def execute(self, context):
        self._record_execution(True)
        return {"success": True}

    async def shutdown(self):
        pass


class TestPluginLoader:
    def setup_method(self):
        self.loader = PluginLoader(PLUGIN_FIXTURES)

    def test_discover(self):
        manifests = self.loader.discover()
        assert len(manifests) >= 5
        names = [m.data["name"] for m in manifests]
        assert "rsi_calculator" in names
        assert "csv_exporter" in names
        assert "log_notifier" in names
        assert "ma_crossover_strategy" in names
        assert "sentiment_analyzer" in names

    def test_manifest_parse(self):
        manifests = self.loader.discover()
        rsi = next(m for m in manifests if m.data["name"] == "rsi_calculator")
        meta = rsi.to_meta()
        assert meta.name == "rsi_calculator"
        assert meta.category == PluginCategory.TECHNICAL
        assert meta.version == "1.0.0"

    def test_load_plugin(self):
        manifests = self.loader.discover()
        rsi = next(m for m in manifests if m.data["name"] == "rsi_calculator")
        plugin = self.loader.load(rsi)
        assert plugin is not None
        assert plugin.name == "rsi_calculator"
        assert isinstance(plugin, PluginInterface)

    def test_load_nonexistent_entry_point(self):
        manifest = PluginManifest(
            data={
                "name": "bad_plugin",
                "version": "1.0.0",
                "author": "Test",
                "description": "Bad",
                "category": "technical",
                "entry_point": "nonexistent.py",
                "class_name": "BadPlugin",
            },
            plugin_dir=Path(tempfile.mkdtemp()),
        )
        plugin = self.loader.load(manifest)
        assert plugin is None

    def test_load_wrong_class_name(self):
        manifest = PluginManifest(
            data={
                "name": "bad_class",
                "version": "1.0.0",
                "author": "Test",
                "description": "Bad",
                "category": "technical",
                "entry_point": "plugin.py",
                "class_name": "NonexistentClass",
            },
            plugin_dir=PLUGIN_FIXTURES / "technical" / "rsi_calculator",
        )
        plugin = self.loader.load(manifest)
        assert plugin is None


class TestPluginRegistry:
    def setup_method(self):
        PluginRegistry.reset()
        self.registry = PluginRegistry()

    def test_singleton(self):
        r1 = PluginRegistry()
        r2 = PluginRegistry()
        assert r1 is r2

    def test_register(self):
        plugin = ConcretePlugin(
            meta=PluginMeta(
                name="test_reg", version="1.0.0", author="T",
                description="D", category=PluginCategory.TECHNICAL,
            )
        )
        self.registry.register(plugin)
        assert self.registry.is_registered("test_reg")
        assert self.registry.count() == 1

    def test_unregister(self):
        plugin = ConcretePlugin(
            meta=PluginMeta(
                name="test_unreg", version="1.0.0", author="T",
                description="D", category=PluginCategory.TECHNICAL,
            )
        )
        self.registry.register(plugin)
        assert self.registry.unregister("test_unreg")
        assert not self.registry.is_registered("test_unreg")
        assert self.registry.count() == 0

    def test_enable_disable(self):
        plugin = ConcretePlugin(
            meta=PluginMeta(
                name="test_ed", version="1.0.0", author="T",
                description="D", category=PluginCategory.TECHNICAL,
            )
        )
        self.registry.register(plugin, enabled=True)
        assert self.registry.is_enabled("test_ed")
        self.registry.disable("test_ed")
        assert not self.registry.is_enabled("test_ed")
        self.registry.enable("test_ed")
        assert self.registry.is_enabled("test_ed")

    def test_get_by_category(self):
        p1 = ConcretePlugin(
            meta=PluginMeta(
                name="tech1", version="1.0.0", author="T",
                description="D", category=PluginCategory.TECHNICAL,
            )
        )
        p2 = ConcretePlugin(
            meta=PluginMeta(
                name="ai1", version="1.0.0", author="T",
                description="D", category=PluginCategory.AI,
            )
        )
        self.registry.register(p1)
        self.registry.register(p2)
        tech = self.registry.get_by_category(PluginCategory.TECHNICAL)
        assert len(tech) == 1
        assert tech[0].name == "tech1"

    def test_get_all_status(self):
        plugin = ConcretePlugin(
            meta=PluginMeta(
                name="status_test", version="2.0.0", author="T",
                description="D", category=PluginCategory.AI,
            )
        )
        self.registry.register(plugin, enabled=True)
        status = self.registry.get_all_status()
        assert "status_test" in status
        assert status["status_test"]["enabled"] is True

    def test_category_summary(self):
        p1 = ConcretePlugin(
            meta=PluginMeta(name="t1", version="1.0.0", author="T",
                            description="D", category=PluginCategory.TECHNICAL)
        )
        p2 = ConcretePlugin(
            meta=PluginMeta(name="t2", version="1.0.0", author="T",
                            description="D", category=PluginCategory.TECHNICAL)
        )
        p3 = ConcretePlugin(
            meta=PluginMeta(name="a1", version="1.0.0", author="T",
                            description="D", category=PluginCategory.AI)
        )
        self.registry.register(p1)
        self.registry.register(p2)
        self.registry.register(p3)
        summary = self.registry.get_category_summary()
        assert summary["technical"] == 2
        assert summary["ai"] == 1

    def test_clear(self):
        plugin = ConcretePlugin(
            meta=PluginMeta(name="clear_test", version="1.0.0", author="T",
                            description="D", category=PluginCategory.TECHNICAL)
        )
        self.registry.register(plugin)
        self.registry.clear()
        assert self.registry.count() == 0


class TestPluginConfiguration:
    def setup_method(self):
        self._tmp_dir = tempfile.mkdtemp()
        self._config_path = Path(self._tmp_dir) / "config.json"
        PluginConfiguration.reset()

    def teardown_method(self):
        PluginConfiguration.reset()
        shutil.rmtree(self._tmp_dir, ignore_errors=True)

    def test_load_save(self):
        config = PluginConfiguration(self._config_path)
        config.set_plugin_config("my_plugin", {"key": "value"})
        config2 = PluginConfiguration(self._config_path)
        loaded = config2.get_plugin_config("my_plugin")
        assert loaded["key"] == "value"

    def test_get_set_enabled(self):
        config = PluginConfiguration(self._config_path)
        config.set_plugin_enabled("p1", False)
        assert config.get_plugin_enabled("p1", default=True) is False
        config.set_plugin_enabled("p1", True)
        assert config.get_plugin_enabled("p1", default=False) is True

    def test_remove_config(self):
        config = PluginConfiguration(self._config_path)
        config.set_plugin_config("to_remove", {"a": 1})
        assert config.remove_plugin_config("to_remove") is True
        assert not config.has_plugin_config("to_remove")

    def test_get_all_configs(self):
        config = PluginConfiguration(self._config_path)
        config.set_plugin_config("p1", {"a": 1})
        config.set_plugin_config("p2", {"b": 2})
        all_configs = config.get_all_configs()
        assert "p1" in all_configs
        assert "p2" in all_configs


class TestPluginManager:
    def setup_method(self):
        self._tmp_dir = tempfile.mkdtemp()
        self._config_path = Path(self._tmp_dir) / "config.json"
        PluginRegistry.reset()
        PluginConfiguration.reset()

    def teardown_method(self):
        PluginRegistry.reset()
        PluginConfiguration.reset()
        shutil.rmtree(self._tmp_dir, ignore_errors=True)

    def test_discover_and_load(self):
        manager = PluginManager(
            plugins_root=PLUGIN_FIXTURES,
            config_path=self._config_path,
        )
        manager.set_app_version("1.0.0")
        summary = self._run(manager.discover_and_load())
        assert summary["discovered"] >= 5
        assert summary["loaded"] >= 5

    def test_enable_disable_plugin(self):
        manager = PluginManager(
            plugins_root=PLUGIN_FIXTURES,
            config_path=self._config_path,
        )
        manager.set_app_version("1.0.0")
        self._run(manager.discover_and_load())

        result = self._run(manager.disable_plugin("rsi_calculator"))
        assert result["success"] is True

        result = self._run(manager.enable_plugin("rsi_calculator"))
        assert result["success"] is True

    def test_execute_plugin(self):
        manager = PluginManager(
            plugins_root=PLUGIN_FIXTURES,
            config_path=self._config_path,
        )
        manager.set_app_version("1.0.0")
        self._run(manager.discover_and_load())

        result = self._run(manager.execute_plugin("rsi_calculator", {
            "price_data": [
                {"date": f"2024-01-{i:02d}", "open": 100 + i, "high": 105 + i,
                 "low": 95 + i, "close": 100 + i, "volume": 1000000}
                for i in range(1, 30)
            ],
            "params": {"period": 14},
        }))
        assert result["success"] is True
        assert result["count"] > 0

    def test_execute_nonexistent_plugin(self):
        manager = PluginManager(
            plugins_root=PLUGIN_FIXTURES,
            config_path=self._config_path,
        )
        result = self._run(manager.execute_plugin("nonexistent"))
        assert result["success"] is False

    def test_shutdown_all(self):
        manager = PluginManager(
            plugins_root=PLUGIN_FIXTURES,
            config_path=self._config_path,
        )
        manager.set_app_version("1.0.0")
        self._run(manager.discover_and_load())

        result = self._run(manager.shutdown_all())
        assert "results" in result

    def test_get_all_info(self):
        manager = PluginManager(
            plugins_root=PLUGIN_FIXTURES,
            config_path=self._config_path,
        )
        manager.set_app_version("1.0.0")
        self._run(manager.discover_and_load())

        info = manager.get_all_info()
        assert "total" in info
        assert "plugins" in info

    def test_version_check(self):
        manager = PluginManager(
            plugins_root=PLUGIN_FIXTURES,
            config_path=self._config_path,
        )
        manager.set_app_version("0.0.1")
        summary = self._run(manager.discover_and_load())
        assert summary["skipped"] >= 5

    def _run(self, coro):
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro)
