from __future__ import annotations

import time
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Optional

from modules.plugin_system.interfaces.enums import (
    PluginCategory,
    PluginConfigSchema,
    PluginHealth,
    PluginMeta,
    PluginPermission,
    PluginStatus,
)
from modules.data_engine.utils.logger import logger


class PluginInterface(ABC):
    """Standard interface every plugin must implement.

    Lifecycle:
        initialize() -> execute() -> shutdown()
        validate() is called before initialize to check readiness.
    """

    def __init__(self, meta: PluginMeta, config_schema: PluginConfigSchema | None = None) -> None:
        self._meta = meta
        self._config_schema = config_schema or PluginConfigSchema()
        self._config: dict[str, Any] = {}
        self._health = PluginHealth(status=PluginStatus.DISCOVERED)
        self._start_time: float = 0.0
        self._initialized = False

    @property
    def meta(self) -> PluginMeta:
        return self._meta

    @property
    def name(self) -> str:
        return self._meta.name

    @property
    def version(self) -> str:
        return self._meta.version

    @property
    def category(self) -> PluginCategory:
        return self._meta.category

    @property
    def status(self) -> PluginStatus:
        return self._health.status

    @property
    def health(self) -> PluginHealth:
        return self._health

    @property
    def is_initialized(self) -> bool:
        return self._initialized

    @property
    def config_schema(self) -> PluginConfigSchema:
        return self._config_schema

    @property
    def config(self) -> dict[str, Any]:
        return dict(self._config)

    @property
    def permissions(self) -> tuple[PluginPermission, ...]:
        return self._meta.permissions

    @abstractmethod
    async def initialize(self, config: dict[str, Any]) -> bool:
        """Initialize the plugin with configuration.

        Called once after loading. Return True if initialization succeeds.
        """
        ...

    @abstractmethod
    async def validate(self) -> bool:
        """Validate that the plugin can run in the current environment.

        Check dependencies, permissions, etc. Called before initialize().
        """
        ...

    @abstractmethod
    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        """Execute the plugin's main logic.

        Args:
            context: Execution context with input data.

        Returns:
            Dict with execution results.
        """
        ...

    @abstractmethod
    async def shutdown(self) -> None:
        """Gracefully shut down the plugin.

        Release resources, close connections, etc.
        """
        ...

    async def on_enable(self) -> None:
        """Called when the plugin is enabled."""
        pass

    async def on_disable(self) -> None:
        """Called when the plugin is disabled."""
        pass

    def get_config_value(self, key: str, default: Any = None) -> Any:
        return self._config.get(key, default)

    def set_config(self, config: dict[str, Any]) -> None:
        self._config = dict(config)

    def _record_execution(self, success: bool, duration_ms: float = 0.0) -> None:
        self._health.execution_count += 1
        self._health.last_executed_at = datetime.now(timezone.utc).isoformat()
        if not success:
            self._health.error_count += 1

    def _set_status(self, status: PluginStatus, error: str = "") -> None:
        self._health.status = status
        if error:
            self._health.error_message = error

    def get_status_dict(self) -> dict[str, Any]:
        uptime = 0.0
        if self._start_time > 0:
            uptime = time.time() - self._start_time
        self._health.uptime_seconds = uptime
        return {
            "meta": self._meta.to_dict(),
            "health": self._health.to_dict(),
            "config": self._config,
            "config_schema": self._config_schema.to_dict(),
            "initialized": self._initialized,
        }

    def __repr__(self) -> str:
        return (
            f"<{self.__class__.__name__}"
            f" name={self.name}"
            f" v={self.version}"
            f" cat={self.category.value}"
            f" status={self.status.value}>"
        )
