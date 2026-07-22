class EfficiencyCalculator:

    @staticmethod
    def _safe_div(a: float | None, b: float | None) -> float | None:
        if a is None or b is None or b == 0:
            return None
        return a / b

    @staticmethod
    def asset_turnover(revenue: float | None, total_assets: float | None) -> float | None:
        return EfficiencyCalculator._safe_div(revenue, total_assets)

    @staticmethod
    def inventory_turnover(
        cost_of_sales: float | None, inventories: float | None
    ) -> float | None:
        return EfficiencyCalculator._safe_div(cost_of_sales, inventories)

    @staticmethod
    def receivable_turnover(
        revenue: float | None, receivables: float | None
    ) -> float | None:
        return EfficiencyCalculator._safe_div(revenue, receivables)

    @staticmethod
    def cash_conversion_cycle(
        receivables: float | None,
        revenue: float | None,
        inventories: float | None,
        cost_of_sales: float | None,
        current_liabilities: float | None,
    ) -> float | None:
        days_in_year = 365
        receivable_days = EfficiencyCalculator._safe_div(
            receivables, revenue
        )
        inventory_days = EfficiencyCalculator._safe_div(
            inventories, cost_of_sales
        )
        payable_days = EfficiencyCalculator._safe_div(
            current_liabilities, cost_of_sales
        )
        if receivable_days is None or inventory_days is None or payable_days is None:
            return None
        return (
            receivable_days * days_in_year
            + inventory_days * days_in_year
            - payable_days * days_in_year
        )

    def compute(self, data: dict) -> dict:
        revenue = data.get("revenue")
        total_assets = data.get("total_assets")
        return {
            "asset_turnover": self.asset_turnover(revenue, total_assets),
            "inventory_turnover": self.inventory_turnover(
                data.get("cost_of_sales"), data.get("inventories")
            ),
            "receivable_turnover": self.receivable_turnover(
                revenue, data.get("receivables")
            ),
            "cash_conversion_cycle": self.cash_conversion_cycle(
                data.get("receivables"),
                revenue,
                data.get("inventories"),
                data.get("cost_of_sales"),
                data.get("current_liabilities"),
            ),
        }
