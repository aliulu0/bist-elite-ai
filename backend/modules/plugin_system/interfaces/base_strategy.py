from __future__ import annotations

from abc import abstractmethod
from typing import Any

from modules.plugin_system.interfaces.enums import PluginCategory, PluginMeta, PluginPermission, PluginStatus
from modules.plugin_system.interfaces.plugin_interface import PluginInterface, PluginConfigSchema


class StrategyPlugin(PluginInterface):
    """Base class for trading strategy plugins.

    These plugins implement trading strategies that generate
    buy/sell signals based on market data.
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
                category=PluginCategory.STRATEGY,
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
    async def generate_signals(
        self,
        market_data: dict[str, Any],
        portfolio: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Generate trading signals from market data.

        Args:
            market_data: Current market data.
            portfolio: Current portfolio state.

        Returns:
            Dict with signals: {"BUY": [...], "SELL": [...], "HOLD": [...]}.
        """
        ...

    async def execute(self, context: dict[str, Any]) -> dict[str, Any]:
        market_data = context.get("market_data", {})
        portfolio = context.get("portfolio")
        try:
            result = await self.generate_signals(market_data, portfolio)
            self._record_execution(True)
            return {"success": True, **result}
        except Exception as e:
            self._record_execution(False)
            self._set_status(PluginStatus.ERROR, str(e))
            return {"success": False, "error": str(e)}
