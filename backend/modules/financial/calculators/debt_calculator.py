class DebtCalculator:

    @staticmethod
    def _safe_div(a: float | None, b: float | None) -> float | None:
        if a is None or b is None or b == 0:
            return None
        return a / b

    @staticmethod
    def debt_equity(total_debt: float | None, equity: float | None) -> float | None:
        return DebtCalculator._safe_div(total_debt, equity)

    @staticmethod
    def debt_assets(total_debt: float | None, total_assets: float | None) -> float | None:
        return DebtCalculator._safe_div(total_debt, total_assets)

    @staticmethod
    def net_debt_ebitda(
        net_debt: float | None, ebitda: float | None
    ) -> float | None:
        return DebtCalculator._safe_div(net_debt, ebitda)

    @staticmethod
    def interest_coverage(
        ebit: float | None, interest_expense: float | None
    ) -> float | None:
        if ebit is None or interest_expense is None or interest_expense <= 0:
            return None
        return ebit / interest_expense

    @staticmethod
    def current_ratio(
        current_assets: float | None, current_liabilities: float | None
    ) -> float | None:
        return DebtCalculator._safe_div(current_assets, current_liabilities)

    @staticmethod
    def quick_ratio(
        current_assets: float | None,
        inventories: float | None,
        current_liabilities: float | None,
    ) -> float | None:
        if current_assets is None or current_liabilities is None or current_liabilities == 0:
            return None
        inv = inventories or 0
        return (current_assets - inv) / current_liabilities

    @staticmethod
    def cash_ratio(
        cash: float | None,
        cash_equivalents: float | None,
        current_liabilities: float | None,
    ) -> float | None:
        if current_liabilities is None or current_liabilities == 0:
            return None
        c = cash or 0
        ce = cash_equivalents or 0
        return (c + ce) / current_liabilities

    def compute(self, data: dict) -> dict:
        total_debt = data.get("total_debt")
        net_debt = data.get("net_debt")
        ebitda = data.get("ebitda")
        return {
            "debt_equity": self.debt_equity(total_debt, data.get("equity")),
            "debt_assets": self.debt_assets(total_debt, data.get("total_assets")),
            "net_debt_ebitda": self.net_debt_ebitda(net_debt, ebitda),
            "interest_coverage": self.interest_coverage(data.get("ebit"), None),
            "current_ratio": self.current_ratio(
                data.get("current_assets"), data.get("current_liabilities")
            ),
            "quick_ratio": self.quick_ratio(
                data.get("current_assets"),
                data.get("inventories"),
                data.get("current_liabilities"),
            ),
            "cash_ratio": self.cash_ratio(
                data.get("cash"),
                data.get("cash_equivalents"),
                data.get("current_liabilities"),
            ),
        }
