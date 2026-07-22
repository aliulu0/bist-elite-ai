from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Optional

from modules.data_engine.utils.logger import logger


class PluginConfiguration:
    """Manages persistent configuration for all plugins.

    Configurations are stored in a JSON file at plugins/config.json.
    """

    _instance: Optional["PluginConfiguration"] = None

    def __new__(cls, config_path: str | Path | None = None) -> "PluginConfiguration":
        if cls._instance is None:
            if config_path is None:
                config_path = Path(__file__).resolve().parent.parent.parent.parent / "plugins" / "config.json"
            cls._instance = super().__new__(cls)
            cls._instance._config_path = Path(config_path)
            cls._instance._configs: dict[str, dict[str, Any]] = {}
            cls._instance._loaded = False
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None

    def __init__(self, config_path: str | Path | None = None) -> None:
        pass

    def load(self) -> None:
        if self._loaded:
            return
        if self._config_path.exists():
            try:
                with open(self._config_path, "r", encoding="utf-8") as f:
                    self._configs = json.load(f)
                logger.info(f"Loaded plugin config from {self._config_path}")
            except Exception as e:
                logger.error(f"Failed to load plugin config: {e}")
                self._configs = {}
        self._loaded = True

    def save(self) -> None:
        try:
            self._config_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self._config_path, "w", encoding="utf-8") as f:
                json.dump(self._configs, f, indent=2, ensure_ascii=False)
            logger.debug(f"Saved plugin config to {self._config_path}")
        except Exception as e:
            logger.error(f"Failed to save plugin config: {e}")

    def get_plugin_config(self, plugin_name: str) -> dict[str, Any]:
        self.load()
        return dict(self._configs.get(plugin_name, {}))

    def set_plugin_config(self, plugin_name: str, config: dict[str, Any]) -> None:
        self.load()
        self._configs[plugin_name] = dict(config)
        self.save()

    def update_plugin_config(self, plugin_name: str, updates: dict[str, Any]) -> None:
        self.load()
        if plugin_name not in self._configs:
            self._configs[plugin_name] = {}
        self._configs[plugin_name].update(updates)
        self.save()

    def remove_plugin_config(self, plugin_name: str) -> bool:
        self.load()
        if plugin_name in self._configs:
            del self._configs[plugin_name]
            self.save()
            return True
        return False

    def get_plugin_enabled(self, plugin_name: str, default: bool = True) -> bool:
        config = self.get_plugin_config(plugin_name)
        return config.get("_enabled", default)

    def set_plugin_enabled(self, plugin_name: str, enabled: bool) -> None:
        self.update_plugin_config(plugin_name, {"_enabled": enabled})

    def get_all_configs(self) -> dict[str, dict[str, Any]]:
        self.load()
        return dict(self._configs)

    def has_plugin_config(self, plugin_name: str) -> bool:
        self.load()
        return plugin_name in self._configs
