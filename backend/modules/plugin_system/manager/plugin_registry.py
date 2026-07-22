from __future__ import annotations

from collections import defaultdict
from typing import Any, Optional

from modules.plugin_system.interfaces.enums import PluginCategory, PluginStatus
from modules.plugin_system.interfaces.plugin_interface import PluginInterface
from modules.data_engine.utils.logger import logger


class PluginRecord:
    """Internal record for a registered plugin."""

    __slots__ = ("plugin", "enabled", "category")

    def __init__(self, plugin: PluginInterface, enabled: bool = True) -> None:
        self.plugin = plugin
        self.enabled = enabled
        self.category = plugin.category


class PluginRegistry:
    """Central registry tracking all loaded plugins.

    Provides fast lookup by name, category, and status.
    """

    _instance: Optional["PluginRegistry"] = None

    def __new__(cls) -> "PluginRegistry":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._records: dict[str, PluginRecord] = {}
            cls._instance._initialized = True
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None

    def __init__(self) -> None:
        if not hasattr(self, "_initialized"):
            self._records: dict[str, PluginRecord] = {}
            self._initialized = True

    def register(self, plugin: PluginInterface, enabled: bool = True) -> None:
        self._records[plugin.name] = PluginRecord(plugin, enabled)
        logger.info(f"Registry: registered plugin '{plugin.name}' (enabled={enabled})")

    def unregister(self, name: str) -> bool:
        if name in self._records:
            del self._records[name]
            logger.info(f"Registry: unregistered plugin '{name}'")
            return True
        return False

    def get(self, name: str) -> Optional[PluginInterface]:
        record = self._records.get(name)
        return record.plugin if record else None

    def get_record(self, name: str) -> Optional[PluginRecord]:
        return self._records.get(name)

    def is_registered(self, name: str) -> bool:
        return name in self._records

    def is_enabled(self, name: str) -> bool:
        record = self._records.get(name)
        return record.enabled if record else False

    def enable(self, name: str) -> bool:
        record = self._records.get(name)
        if record:
            record.enabled = True
            logger.info(f"Registry: enabled plugin '{name}'")
            return True
        return False

    def disable(self, name: str) -> bool:
        record = self._records.get(name)
        if record:
            record.enabled = False
            logger.info(f"Registry: disabled plugin '{name}'")
            return True
        return False

    def get_by_category(self, category: PluginCategory) -> list[PluginInterface]:
        return [
            r.plugin
            for r in self._records.values()
            if r.category == category and r.enabled
        ]

    def get_all(self) -> list[PluginInterface]:
        return [r.plugin for r in self._records.values()]

    def get_all_enabled(self) -> list[PluginInterface]:
        return [r.plugin for r in self._records.values() if r.enabled]

    def get_by_status(self, status: PluginStatus) -> list[PluginInterface]:
        return [
            r.plugin
            for r in self._records.values()
            if r.plugin.status == status
        ]

    def count(self) -> int:
        return len(self._records)

    def count_enabled(self) -> int:
        return sum(1 for r in self._records.values() if r.enabled)

    def get_all_status(self) -> dict[str, dict[str, Any]]:
        result: dict[str, dict[str, Any]] = {}
        for name, record in self._records.items():
            result[name] = {
                "category": record.category.value,
                "enabled": record.enabled,
                "status": record.plugin.status.value,
                "version": record.plugin.version,
            }
        return result

    def get_category_summary(self) -> dict[str, int]:
        summary: dict[str, int] = defaultdict(int)
        for record in self._records.values():
            summary[record.category.value] += 1
        return dict(summary)

    def clear(self) -> None:
        self._records.clear()
        logger.info("Registry: cleared all plugins")
