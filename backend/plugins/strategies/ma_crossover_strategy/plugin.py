from __future__ import annotations

from typing import Any

from modules.plugin_system.interfaces import (
    PluginConfigField,
    PluginConfigSchema,
    PluginMeta,
    StrategyPlugin,
)


class MACrossoverStrategy(StrategyPlugin):
    def __init__(self) -> None:
        meta = PluginMeta(
            name="ma_crossover_strategy",
            version="1.0.0",
            author="BIST Elite AI",
            description="Moving Average Crossover trading strategy",
            category="strategy",
        )
        config_schema = PluginConfigSchema(
            fields={
                "fast_period": PluginConfigField(
                    field_type="int",
                    default=9,
                    description="Fast MA period",
                    min_value=1,
                ),
                "slow_period": PluginConfigField(
                    field_type="int",
                    default=20,
                    description="Slow MA period",
                    min_value=2,
                ),
            }
        )
        super().__init__(meta, config_schema)

    async def initialize(self, config: dict[str, Any]) -> bool:
        self.set_config(config)
        return True

    async def validate(self) -> bool:
        return True

    async def generate_signals(
        self,
        market_data: dict[str, Any],
        portfolio: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        fast = self.get_config_value("fast_period", 9)
        slow = self.get_config_value("slow_period", 20)
        prices = market_data.get("prices", [])

        if len(prices) < slow + 1:
            return {"BUY": [], "SELL": [], "HOLD": []}

        closes = [p["close"] for p in prices]
        fast_ma = sum(closes[-fast:]) / fast
        slow_ma = sum(closes[-slow:]) / slow
        prev_fast = sum(closes[-fast - 1 : -1]) / fast
        prev_slow = sum(closes[-slow - 1 : -1]) / slow

        stock_code = market_data.get("stock_code", "UNKNOWN")
        signals: dict[str, list[dict[str, Any]]] = {"BUY": [], "SELL": [], "HOLD": []}

        if prev_fast <= prev_slow and fast_ma > slow_ma:
            signals["BUY"].append({
                "stock_code": stock_code,
                "signal": "BUY",
                "reason": f"MA{fast} crossed above MA{slow}",
                "fast_ma": round(fast_ma, 2),
                "slow_ma": round(slow_ma, 2),
            })
        elif prev_fast >= prev_slow and fast_ma < slow_ma:
            signals["SELL"].append({
                "stock_code": stock_code,
                "signal": "SELL",
                "reason": f"MA{fast} crossed below MA{slow}",
                "fast_ma": round(fast_ma, 2),
                "slow_ma": round(slow_ma, 2),
            })
        else:
            signals["HOLD"].append({
                "stock_code": stock_code,
                "signal": "HOLD",
                "reason": "No crossover detected",
            })

        return signals

    async def shutdown(self) -> None:
        pass
