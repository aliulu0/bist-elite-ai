from __future__ import annotations

from typing import Any

from modules.plugin_system.interfaces import (
    PluginConfigField,
    PluginConfigSchema,
    PluginMeta,
    NotificationPlugin,
)
from modules.data_engine.utils.logger import logger


class LogNotifierPlugin(NotificationPlugin):
    def __init__(self) -> None:
        meta = PluginMeta(
            name="log_notifier",
            version="1.0.0",
            author="BIST Elite AI",
            description="Sends notifications to application log",
            category="notification",
        )
        config_schema = PluginConfigSchema(
            fields={
                "min_severity": PluginConfigField(
                    field_type="str",
                    default="info",
                    choices=("debug", "info", "warning", "error", "critical"),
                    description="Minimum severity level to log",
                ),
            }
        )
        super().__init__(meta, config_schema)

    async def initialize(self, config: dict[str, Any]) -> bool:
        self.set_config(config)
        return True

    async def validate(self) -> bool:
        return True

    async def send(
        self,
        title: str,
        message: str,
        severity: str = "info",
        data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        log_msg = f"[{severity.upper()}] {title}: {message}"
        if data:
            log_msg += f" | data={data}"

        severity_map = {
            "debug": logger.debug,
            "info": logger.info,
            "warning": logger.warning,
            "error": logger.error,
            "critical": logger.critical,
        }
        log_fn = severity_map.get(severity, logger.info)
        log_fn(log_msg)

        return {
            "channel": "log",
            "severity": severity,
            "delivered": True,
        }

    async def shutdown(self) -> None:
        pass
