from __future__ import annotations

from abc import abstractmethod
from typing import Any

from modules.plugin_system.interfaces.enums import PluginCategory, PluginMeta, PluginPermission, PluginStatus
from modules.plugin_system.interfaces.plugin_interface import PluginInterface, PluginConfigSchema


class DataProviderPlugin(PluginInterface):
    """Base class for data provider plugins.

    These plugins fetch data from external sources.
    Integrates with the existing provider architecture.
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
                category=PluginCategory.PROVIDER,
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
    async def fetch(
        self,
        endpoint: str,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Fetch data from the external source.

        Args:
            endpoint: The data endpoint to fetch.
            params: Request parameters.

        Returns:
            Dict with fetched data.
        """
        ...

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        endpoint = context.get("endpoint", "")
        params = context.get("params", {})
        try:
            result = await self.fetch(endpoint, params)
            self._record_execution(True)
            return {"success": True, **result}
        except Exception as e:
            self._record_execution(False)
            self._set_status(PluginStatus.ERROR, str(e))
            return {"success": False, "error": str(e)}
