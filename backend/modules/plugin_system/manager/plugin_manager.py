from __future__ import annotations

import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from modules.plugin_system.interfaces.enums import (
    PluginCategory,
    PluginMeta,
    PluginPermission,
    PluginStatus,
)
from modules.plugin_system.interfaces.plugin_interface import PluginInterface
from modules.plugin_system.manager.plugin_loader import PluginLoader, PluginManifest
from modules.plugin_system.manager.plugin_registry import PluginRegistry
from modules.plugin_system.config.plugin_configuration import PluginConfiguration
from modules.data_engine.utils.logger import logger


class PluginManager:
    """Orchestrates the entire plugin lifecycle.

    Responsibilities:
        - Discover plugins from disk
        - Validate dependencies and permissions
        - Load and initialize plugins
        - Enable/disable plugins
        - Execute plugins
        - Shut down plugins
        - Version management
    """

    def __init__(
        self,
        plugins_root: str | Path | None = None,
        config_path: str | Path | None = None,
    ) -> None:
        self._loader = PluginLoader(plugins_root)
        self._registry = PluginRegistry()
        self._config = PluginConfiguration(config_path)
        self._app_version = "1.0.0"
        self._start_time: float = 0.0

    @property
    def loader(self) -> PluginLoader:
        return self._loader

    @property
    def registry(self) -> PluginRegistry:
        return self._registry

    @property
    def config(self) -> PluginConfiguration:
        return self._config

    def set_app_version(self, version: str) -> None:
        self._app_version = version

    async def discover_and_load(self) -> dict[str, Any]:
        """Discover all plugins, validate, and load enabled ones.

        Returns summary of discovery and loading results.
        """
        self._start_time = time.time()
        self._config.load()

        manifests = self._loader.discover()
        summary = {
            "discovered": len(manifests),
            "loaded": 0,
            "skipped": 0,
            "failed": 0,
            "plugins": [],
        }

        for manifest in manifests:
            name = manifest.data.get("name", "unknown")
            plugin_config = self._config.get_plugin_config(name)
            enabled = self._config.get_plugin_enabled(name, default=True)

            dep_check = self._check_dependencies(manifest)
            if not dep_check["valid"]:
                logger.warning(
                    f"Skipping plugin '{name}': {dep_check['reason']}"
                )
                summary["skipped"] += 1
                summary["plugins"].append({
                    "name": name,
                    "status": "skipped",
                    "reason": dep_check["reason"],
                })
                continue

            version_check = self._check_version_compat(manifest)
            if not version_check["valid"]:
                logger.warning(
                    f"Skipping plugin '{name}': {version_check['reason']}"
                )
                summary["skipped"] += 1
                summary["plugins"].append({
                    "name": name,
                    "status": "skipped",
                    "reason": version_check["reason"],
                })
                continue

            plugin = self._loader.load(manifest)
            if plugin is None:
                summary["failed"] += 1
                summary["plugins"].append({
                    "name": name,
                    "status": "failed",
                    "reason": "Load failed",
                })
                continue

            self._registry.register(plugin, enabled=enabled)
            plugin.set_config(plugin_config)

            if enabled:
                try:
                    valid = await plugin.validate()
                    if valid:
                        plugin._start_time = time.time()
                        init_ok = await plugin.initialize(plugin_config)
                        if init_ok:
                            plugin._set_status(PluginStatus.RUNNING)
                            plugin._initialized = True
                            summary["loaded"] += 1
                            summary["plugins"].append({
                                "name": name,
                                "status": "running",
                                "version": plugin.version,
                            })
                            logger.info(f"Plugin '{name}' initialized successfully")
                        else:
                            plugin._set_status(PluginStatus.ERROR, "Initialization failed")
                            summary["failed"] += 1
                            summary["plugins"].append({
                                "name": name,
                                "status": "init_failed",
                                "reason": "initialize() returned False",
                            })
                    else:
                        plugin._set_status(PluginStatus.ERROR, "Validation failed")
                        summary["failed"] += 1
                        summary["plugins"].append({
                            "name": name,
                            "status": "validation_failed",
                        })
                except Exception as e:
                    plugin._set_status(PluginStatus.ERROR, str(e))
                    summary["failed"] += 1
                    summary["plugins"].append({
                        "name": name,
                        "status": "error",
                        "reason": str(e),
                    })
            else:
                plugin._set_status(PluginStatus.DISABLED)
                summary["skipped"] += 1
                summary["plugins"].append({
                    "name": name,
                    "status": "disabled",
                })

        logger.info(
            f"Plugin discovery complete: "
            f"{summary['discovered']} discovered, "
            f"{summary['loaded']} loaded, "
            f"{summary['skipped']} skipped, "
            f"{summary['failed']} failed"
        )
        return summary

    async def enable_plugin(self, name: str) -> dict[str, Any]:
        plugin = self._registry.get(name)
        if not plugin:
            return {"success": False, "error": f"Plugin '{name}' not found"}

        if self._registry.is_enabled(name):
            return {"success": False, "error": f"Plugin '{name}' already enabled"}

        plugin_config = self._config.get_plugin_config(name)
        plugin.set_config(plugin_config)

        try:
            valid = await plugin.validate()
            if not valid:
                return {"success": False, "error": "Validation failed"}

            plugin._start_time = time.time()
            init_ok = await plugin.initialize(plugin_config)
            if init_ok:
                plugin._initialized = True
                plugin._set_status(PluginStatus.RUNNING)
                self._registry.enable(name)
                self._config.set_plugin_enabled(name, True)
                await plugin.on_enable()
                return {"success": True, "message": f"Plugin '{name}' enabled"}
            else:
                return {"success": False, "error": "Initialization failed"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def disable_plugin(self, name: str) -> dict[str, Any]:
        plugin = self._registry.get(name)
        if not plugin:
            return {"success": False, "error": f"Plugin '{name}' not found"}

        try:
            await plugin.on_disable()
            await plugin.shutdown()
            plugin._set_status(PluginStatus.DISABLED)
            plugin._initialized = False
            self._registry.disable(name)
            self._config.set_plugin_enabled(name, False)
            self._loader.unload(name)
            return {"success": True, "message": f"Plugin '{name}' disabled"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def uninstall_plugin(self, name: str) -> dict[str, Any]:
        plugin = self._registry.get(name)
        if plugin:
            if plugin.is_initialized:
                await plugin.on_disable()
                await plugin.shutdown()
            self._registry.unregister(name)
        self._config.remove_plugin_config(name)
        self._loader.unload(name)
        return {"success": True, "message": f"Plugin '{name}' uninstalled"}

    async def execute_plugin(
        self, name: str, context: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        plugin = self._registry.get(name)
        if not plugin:
            return {"success": False, "error": f"Plugin '{name}' not found"}

        if not self._registry.is_enabled(name):
            return {"success": False, "error": f"Plugin '{name}' is disabled"}

        if not plugin.is_initialized:
            return {"success": False, "error": f"Plugin '{name}' is not initialized"}

        return await plugin.execute(context or {})

    async def shutdown_all(self) -> dict[str, Any]:
        results: dict[str, str] = {}
        for plugin in self._registry.get_all():
            try:
                if plugin.is_initialized:
                    await plugin.shutdown()
                    plugin._set_status(PluginStatus.STOPPED)
                results[plugin.name] = "shutdown"
            except Exception as e:
                results[plugin.name] = f"error: {e}"
        self._loader.unload("all")
        logger.info("All plugins shut down")
        return {"results": results}

    def get_plugin_info(self, name: str) -> dict[str, Any] | None:
        plugin = self._registry.get(name)
        if plugin:
            return plugin.get_status_dict()
        return None

    def get_all_info(self) -> dict[str, Any]:
        return {
            "total": self._registry.count(),
            "enabled": self._registry.count_enabled(),
            "categories": self._registry.get_category_summary(),
            "plugins": self._registry.get_all_status(),
        }

    def _check_dependencies(self, manifest: PluginManifest) -> dict[str, Any]:
        deps = manifest.data.get("dependencies", [])
        for dep_name in deps:
            if not self._registry.is_registered(dep_name):
                return {
                    "valid": False,
                    "reason": f"Missing dependency: {dep_name}",
                }
        return {"valid": True, "reason": ""}

    def _check_version_compat(self, manifest: PluginManifest) -> dict[str, Any]:
        min_ver = manifest.data.get("min_app_version", "0.0.0")
        max_ver = manifest.data.get("max_app_version", "")

        if self._app_version < min_ver:
            return {
                "valid": False,
                "reason": f"App version {self._app_version} < required {min_ver}",
            }

        if max_ver and self._app_version > max_ver:
            return {
                "valid": False,
                "reason": f"App version {self._app_version} > max supported {max_ver}",
            }

        return {"valid": True, "reason": ""}
