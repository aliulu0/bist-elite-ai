from __future__ import annotations

from abc import abstractmethod
from typing import Any

from modules.plugin_system.interfaces.enums import PluginCategory, PluginMeta, PluginPermission, PluginStatus
from modules.plugin_system.interfaces.plugin_interface import PluginInterface, PluginConfigSchema


class NotificationPlugin(PluginInterface):
    """Base class for notification plugins.

    These plugins send notifications through various channels
    (Telegram, email, Slack, webhook, etc.).
    """

    def __init__(
        self,
        meta: PluginMeta,
        config_schema: PluginConfigSchema | None = None,
    ) -> None:
        super().__init__(
            meta=PluginMeta(
                name=meta.name,
                version=meta.version,
                author=meta.author,
                description=meta.description,
                category=PluginCategory.NOTIFICATION,
                min_app_version=meta.min_app_version,
                max_app_version=meta.max_app_version,
                dependencies=meta.dependencies,
                permissions=(
                    PluginPermission.READ_DATA,
                    PluginPermission.ACCESS_NETWORK,
                ) if not meta.permissions else meta.permissions,
                tags=meta.tags,
                url=meta.url,
            ),
            config_schema=config_schema,
        )

    @abstractmethod
    async def send(
        self,
        title: str,
        message: str,
        severity: str = "info",
        data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Send a notification.

        Args:
            title: Notification title.
            message: Notification body.
            severity: "info", "warning", "error", "critical".
            data: Optional extra data.

        Returns:
            Dict with send result.
        """
        ...

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        title = context.get("title", "Notification")
        message = context.get("message", "")
        severity = context.get("severity", "info")
        data = context.get("data")
        try:
            result = await self.send(title, message, severity, data)
            self._record_execution(True)
            return {"success": True, **result}
        except Exception as e:
            self._record_execution(False)
            self._set_status(PluginStatus.ERROR, str(e))
            return {"success": False, "error": str(e)}
