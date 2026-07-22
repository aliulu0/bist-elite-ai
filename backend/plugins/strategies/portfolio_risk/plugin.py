from __future__ import annotations

import math
from typing import Any

from modules.plugin_system.interfaces import (
    PluginConfigField,
    PluginConfigSchema,
    PluginMeta,
    RiskModelPlugin,
)


class PortfolioRiskPlugin(RiskModelPlugin):
    def __init__(self) -> None:
        meta = PluginMeta(
            name="portfolio_risk",
            version="1.0.0",
            author="BIST Elite AI",
            description="Calculates basic portfolio risk metrics",
            category="risk",
        )
        config_schema = PluginConfigSchema(
            fields={
                "confidence_level": PluginConfigField(
                    field_type="float",
                    default=0.95,
                    description="VaR confidence level",
                    min_value=0.5,
                    max_value=0.9999,
                ),
                "risk_free_rate": PluginConfigField(
                    field_type="float",
                    default=0.15,
                    description="Annual risk-free rate (e.g., 0.15 = 15%)",
                ),
            }
        )
        super().__init__(meta, config_schema)

    async def initialize(self, config: dict[str, Any]) -> bool:
        self.set_config(config)
        return True

    async def validate(self) -> bool:
        return True

    async def calculate_risk(
        self,
        portfolio: dict[str, Any],
        market_data: dict[str, Any],
    ) -> dict[str, Any]:
        holdings = portfolio.get("holdings", [])
        prices_history = market_data.get("prices_history", {})

        if not holdings:
            return {"error": "No holdings provided"}

        total_value = 0.0
        returns_list: list[float] = []

        for holding in holdings:
            stock = holding.get("stock_code", "")
            qty = holding.get("quantity", 0)
            avg_price = holding.get("avg_price", 0)
            value = qty * avg_price
            total_value += value

            stock_prices = prices_history.get(stock, [])
            if len(stock_prices) >= 2:
                for i in range(1, len(stock_prices)):
                    prev = stock_prices[i - 1].get("close", 0)
                    curr = stock_prices[i].get("close", 0)
                    if prev > 0:
                        returns_list.append((curr - prev) / prev)

        volatility = 0.0
        var_95 = 0.0
        sharpe = 0.0

        if returns_list:
            mean_return = sum(returns_list) / len(returns_list)
            variance = sum((r - mean_return) ** 2 for r in returns_list) / len(returns_list)
            volatility = math.sqrt(variance)
            annualized_vol = volatility * math.sqrt(252)
            z_score = 1.645
            var_95 = -(mean_return - z_score * volatility) * total_value

            risk_free_daily = self.get_config_value("risk_free_rate", 0.15) / 252
            excess = mean_return - risk_free_daily
            sharpe = (excess / volatility * math.sqrt(252)) if volatility > 0 else 0

        concentration = {}
        for holding in holdings:
            stock = holding.get("stock_code", "unknown")
            value = holding.get("quantity", 0) * holding.get("avg_price", 0)
            concentration[stock] = round(value / total_value * 100, 2) if total_value > 0 else 0

        return {
            "total_value": round(total_value, 2),
            "volatility_daily": round(volatility, 6),
            "volatility_annualized": round(volatility * math.sqrt(252), 4) if returns_list else 0,
            "var_95": round(var_95, 2),
            "sharpe_ratio": round(sharpe, 4),
            "concentration": concentration,
            "holding_count": len(holdings),
        }

    async def shutdown(self) -> None:
        pass
