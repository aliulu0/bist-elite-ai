from __future__ import annotations

from abc import abstractmethod
from typing import Any

from modules.plugin_system.interfaces.enums import PluginCategory, PluginMeta, PluginPermission, PluginStatus
from modules.plugin_system.interfaces.plugin_interface import PluginInterface, PluginConfigSchema


class RiskModelPlugin(PluginInterface):
    """Base class for risk model plugins.

    These plugins calculate risk metrics and portfolio risk analysis.
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
                category=PluginCategory.RISK,
                min_app_version=meta.min_app_version,
                max_app_version=meta.max_app_version,
                dependencies=meta.dependencies,
                permissions=(
                    PluginPermission.READ_DATA,
                ) if not meta.permissions else meta.permissions,
                tags=meta.tags,
                url=meta.url,
            ),
            config_schema=config_schema,
        )

    @abstractmethod
    async def calculate_risk(
        self,
        portfolio: dict[str, Any],
        market_data: dict[str, Any],
    ) -> dict[str, Any]:
        """Calculate risk metrics for a portfolio.

        Args:
            portfolio: Portfolio holdings.
            market_data: Market data for risk calculations.

        Returns:
            Dict with risk metrics (VaR, volatility, sharpe, etc.).
        """
        ...

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        portfolio = context.get("portfolio", {})
        market_data = context.get("market_data", {})
        try:
            result = await self.calculate_risk(portfolio, market_data)
            self._record_execution(True)
            return {"success": True, **result}
        except Exception as e:
            self._record_execution(False)
            self._set_status(PluginStatus.ERROR, str(e))
            return {"success": False, "error": str(e)}
