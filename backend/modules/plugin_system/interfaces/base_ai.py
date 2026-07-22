from __future__ import annotations

from abc import abstractmethod
from typing import Any

from modules.plugin_system.interfaces.enums import PluginCategory, PluginMeta, PluginPermission, PluginStatus
from modules.plugin_system.interfaces.plugin_interface import PluginInterface, PluginConfigSchema


class AIPlugin(PluginInterface):
    """Base class for AI/ML plugins.

    These plugins provide AI-powered analysis capabilities.
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
                category=PluginCategory.AI,
                min_app_version=meta.min_app_version,
                max_app_version=meta.max_app_version,
                dependencies=meta.dependencies,
                permissions=(
                    PluginPermission.READ_DATA,
                    PluginPermission.ACCESS_AI,
                    PluginPermission.ACCESS_NETWORK,
                ) if not meta.permissions else meta.permissions,
                tags=meta.tags,
                url=meta.url,
            ),
            config_schema=config_schema,
        )

    @abstractmethod
    async def analyze(
        self,
        data: dict[str, Any],
        analysis_type: str = "default",
    ) -> dict[str, Any]:
        """Run AI analysis on the given data.

        Args:
            data: Input data for analysis.
            analysis_type: Type of analysis to perform.

        Returns:
            Dict with analysis results.
        """
        ...

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        data = context.get("data", {})
        analysis_type = context.get("analysis_type", "default")
        try:
            result = await self.analyze(data, analysis_type)
            self._record_execution(True)
            return {"success": True, **result}
        except Exception as e:
            self._record_execution(False)
            self._set_status(PluginStatus.ERROR, str(e))
            return {"success": False, "error": str(e)}
