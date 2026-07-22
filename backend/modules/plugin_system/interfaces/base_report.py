from __future__ import annotations

from abc import abstractmethod
from typing import Any

from modules.plugin_system.interfaces.enums import PluginCategory, PluginMeta, PluginPermission, PluginStatus
from modules.plugin_system.interfaces.plugin_interface import PluginInterface, PluginConfigSchema


class ReportExporterPlugin(PluginInterface):
    """Base class for report export plugins.

    These plugins export data to various formats (PDF, Excel, CSV, etc.).
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
                category=PluginCategory.REPORT,
                min_app_version=meta.min_app_version,
                max_app_version=meta.max_app_version,
                dependencies=meta.dependencies,
                permissions=(
                    PluginPermission.READ_DATA,
                    PluginPermission.WRITE_DATA,
                    PluginPermission.ACCESS_FILESYSTEM,
                ) if not meta.permissions else meta.permissions,
                tags=meta.tags,
                url=meta.url,
            ),
            config_schema=config_schema,
        )

    @property
    @abstractmethod
    def supported_format(self) -> str:
        """Return the file format this exporter supports (e.g., 'pdf', 'xlsx')."""
        ...

    @abstractmethod
    async def export(
        self,
        data: dict[str, Any],
        output_path: str | None = None,
    ) -> dict[str, Any]:
        """Export data to the plugin's format.

        Args:
            data: Data to export.
            output_path: Optional output path.

        Returns:
            Dict with export result (file path, content, etc.).
        """
        ...

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        data = context.get("data", {})
        output_path = context.get("output_path")
        try:
            result = await self.export(data, output_path)
            self._record_execution(True)
            return {"success": True, "format": self.supported_format, **result}
        except Exception as e:
            self._record_execution(False)
            self._set_status(PluginStatus.ERROR, str(e))
            return {"success": False, "error": str(e)}
