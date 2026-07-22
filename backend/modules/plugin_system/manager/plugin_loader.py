from __future__ import annotations

import importlib
import importlib.util
import json
import sys
from pathlib import Path
from typing import Any

from modules.plugin_system.interfaces.enums import PluginCategory, PluginMeta, PluginPermission, PluginStatus
from modules.plugin_system.interfaces.plugin_interface import PluginInterface
from modules.data_engine.utils.logger import logger


class PluginManifest:
    """Parsed plugin.json manifest."""

    def __init__(self, data: dict[str, Any], plugin_dir: Path) -> None:
        self.data = data
        self.plugin_dir = plugin_dir
        self.entry_point = data.get("entry_point", "plugin.py")
        self.class_name = data.get("class_name", "Plugin")

    def to_meta(self) -> PluginMeta:
        perms = tuple(
            PluginPermission(p) for p in self.data.get("permissions", [])
        )
        return PluginMeta(
            name=self.data["name"],
            version=self.data.get("version", "0.0.1"),
            author=self.data.get("author", "Unknown"),
            description=self.data.get("description", ""),
            category=PluginCategory(self.data["category"]),
            min_app_version=self.data.get("min_app_version", "1.0.0"),
            max_app_version=self.data.get("max_app_version", ""),
            dependencies=tuple(self.data.get("dependencies", [])),
            permissions=perms,
            tags=tuple(self.data.get("tags", [])),
            url=self.data.get("url", ""),
        )

    @classmethod
    def from_file(cls, manifest_path: Path) -> "PluginManifest | None":
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return cls(data, manifest_path.parent)
        except Exception as e:
            logger.error(f"Failed to load manifest {manifest_path}: {e}")
            return None


class PluginLoader:
    """Discovers and loads plugins from the plugins/ directory.

    Each plugin lives in its own subdirectory with a plugin.json manifest
    and an entry_point Python file.
    """

    MANIFEST_FILENAME = "plugin.json"

    def __init__(self, plugins_root: str | Path | None = None) -> None:
        if plugins_root is None:
            plugins_root = Path(__file__).resolve().parent.parent.parent.parent / "plugins"
        self._root = Path(plugins_root)

    @property
    def root(self) -> Path:
        return self._root

    def discover(self) -> list[PluginManifest]:
        """Scan the plugins directory for valid plugin manifests."""
        manifests: list[PluginManifest] = []
        if not self._root.exists():
            logger.warning(f"Plugins directory does not exist: {self._root}")
            return manifests

        for category_dir in sorted(self._root.iterdir()):
            if not category_dir.is_dir():
                continue
            if category_dir.name.startswith(("_", ".")):
                continue

            for plugin_dir in sorted(category_dir.iterdir()):
                if not plugin_dir.is_dir():
                    continue
                manifest_path = plugin_dir / self.MANIFEST_FILENAME
                if manifest_path.exists():
                    manifest = PluginManifest.from_file(manifest_path)
                    if manifest:
                        manifests.append(manifest)
                        logger.info(
                            f"Discovered plugin: {manifest.data.get('name', 'unknown')} "
                            f"in {category_dir.name}/{plugin_dir.name}"
                        )
        return manifests

    def load(self, manifest: PluginManifest) -> PluginInterface | None:
        """Load a plugin from its manifest."""
        module_path = manifest.plugin_dir / manifest.entry_point
        if not module_path.exists():
            logger.error(f"Entry point not found: {module_path}")
            return None

        module_name = f"plugin_{manifest.data.get('name', 'unknown')}"
        try:
            spec = importlib.util.spec_from_file_location(module_name, module_path)
            if spec is None or spec.loader is None:
                logger.error(f"Cannot create spec for {module_path}")
                return None

            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module
            spec.loader.exec_module(module)

            cls = getattr(module, manifest.class_name, None)
            if cls is None:
                logger.error(
                    f"Class '{manifest.class_name}' not found in {module_path}"
                )
                return None

            instance = cls()
            if not isinstance(instance, PluginInterface):
                logger.error(
                    f"Class '{manifest.class_name}' does not extend PluginInterface"
                )
                return None

            logger.info(f"Loaded plugin: {instance.name} v{instance.version}")
            return instance

        except Exception as e:
            logger.error(f"Failed to load plugin from {module_path}: {e}")
            return None

    def unload(self, plugin_name: str) -> bool:
        """Unload a plugin module from sys.modules."""
        module_name = f"plugin_{plugin_name}"
        if module_name in sys.modules:
            del sys.modules[module_name]
            logger.info(f"Unloaded plugin module: {module_name}")
            return True
        return False
