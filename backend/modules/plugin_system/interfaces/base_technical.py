from __future__ import annotations

from abc import abstractmethod
from typing import Any

from modules.plugin_system.interfaces.enums import PluginCategory, PluginMeta, PluginPermission
from modules.plugin_system.interfaces.plugin_interface import PluginInterface, PluginConfigSchema


class TechnicalIndicatorPlugin(PluginInterface):
    """Base class for technical indicator plugins.

    These plugins calculate custom technical indicators from price data.
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
                category=PluginCategory.TECHNICAL,
                min_app_version=meta.min_app_version,
                max_app_version=meta.max_app_version,
                dependencies=meta.dependencies,
                permissions=(
                    PluginPermission.READ_DATA,
                    PluginPermission.WRITE_DATA,
                ) if not meta.permissions else meta.permissions,
                tags=meta.tags,
                url=meta.url,
            ),
            config_schema=config_schema,
        )

    @abstractmethod
    async def calculate(
        self,
        price_data: list[dict[str, Any]],
        params: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """Calculate indicator values from price data.

        Args:
            price_data: List of OHLCV records.
            params: Indicator-specific parameters.

        Returns:
            List of dicts with indicator values per period.
        """
        ...

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        price_data = context.get("price_data", [])
        params = context.get("params", {})
        try:
            results = await self.calculate(price_data, params)
            self._record_execution(True)
            return {"success": True, "data": results, "count": len(results)}
        except Exception as e:
            self._record_execution(False)
            self._set_status(PluginStatus.ERROR, str(e))
            return {"success": False, "error": str(e)}


# Re-import for convenience
from modules.plugin_system.interfaces.enums import PluginStatus
