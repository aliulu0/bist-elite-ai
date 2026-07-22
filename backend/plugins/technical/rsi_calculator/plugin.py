from __future__ import annotations

from typing import Any

from modules.plugin_system.interfaces import (
    PluginConfigField,
    PluginConfigSchema,
    PluginMeta,
    TechnicalIndicatorPlugin,
)


class RSICalculatorPlugin(TechnicalIndicatorPlugin):
    def __init__(self) -> None:
        meta = PluginMeta(
            name="rsi_calculator",
            version="1.0.0",
            author="BIST Elite AI",
            description="Calculates Relative Strength Index (RSI) indicator",
            category="technical",
        )
        config_schema = PluginConfigSchema(
            fields={
                "period": PluginConfigField(
                    field_type="int",
                    default=14,
                    required=False,
                    description="RSI calculation period",
                    min_value=1,
                    max_value=200,
                ),
            }
        )
        super().__init__(meta, config_schema)

    async def initialize(self, config: dict[str, Any]) -> bool:
        self.set_config(config)
        return True

    async def validate(self) -> bool:
        return True

    async def calculate(
        self,
        price_data: list[dict[str, Any]],
        params: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        period = (params or {}).get("period", self.get_config_value("period", 14))
        closes = [p["close"] for p in price_data]
        if len(closes) < period + 1:
            return []

        deltas = [closes[i] - closes[i - 1] for i in range(1, len(closes))]
        gains = [d if d > 0 else 0 for d in deltas]
        losses = [-d if d < 0 else 0 for d in deltas]

        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period

        results: list[dict[str, Any]] = []
        rsi_values: list[float] = []

        for i in range(period, len(deltas)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period

            if avg_loss == 0:
                rsi = 100.0
            else:
                rs = avg_gain / avg_loss
                rsi = 100.0 - (100.0 / (1.0 + rs))

            rsi_values.append(round(rsi, 2))

        for i, rsi in enumerate(rsi_values):
            idx = period + i
            results.append({
                "date": price_data[idx].get("date"),
                "rsi": rsi,
                "period": period,
            })

        return results

    async def shutdown(self) -> None:
        pass
