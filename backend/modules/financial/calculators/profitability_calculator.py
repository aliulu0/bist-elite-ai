class ProfitabilityCalculator:

    @staticmethod
    def _safe_div(a: float | None, b: float | None) -> float | None:
        if a is None or b is None or b == 0:
            return None
        return a / b

    @staticmethod
    def roe(net_profit: float | None, equity: float | None) -> float | None:
        return ProfitabilityCalculator._safe_div(net_profit, equity)

    @staticmethod
    def roa(net_profit: float | None, total_assets: float | None) -> float | None:
        return ProfitabilityCalculator._safe_div(net_profit, total_assets)

    @staticmethod
    def roic(
        nopat: float | None, invested_capital: float | None
    ) -> float | None:
        return ProfitabilityCalculator._safe_div(nopat, invested_capital)

    @staticmethod
    def roce(
        ebit: float | None,
        total_assets: float | None,
        current_liabilities: float | None,
    ) -> float | None:
        if ebit is None or total_assets is None or current_liabilities is None:
            return None
        capital_employed = total_assets - current_liabilities
        if capital_employed == 0:
            return None
        return ebit / capital_employed

    @staticmethod
    def gross_return(
        gross_profit: float | None, total_assets: float | None
    ) -> float | None:
        return ProfitabilityCalculator._safe_div(gross_profit, total_assets)

    def compute(self, data: dict) -> dict:
        net_profit = data.get("net_profit")
        equity = data.get("equity")
        total_assets = data.get("total_assets")
        ebit = data.get("ebit")
        current_liabilities = data.get("current_liabilities")
        gross_profit = data.get("gross_profit")
        short_term_debt = data.get("short_term_debt") or 0
        long_term_debt = data.get("long_term_debt") or 0
        cash = data.get("cash") or 0

        invested_capital = None
        if equity is not None:
            total_debt = short_term_debt + long_term_debt
            invested_capital = equity + total_debt - cash
            if invested_capital <= 0:
                invested_capital = None

        nopat = None
        if ebit is not None:
            nopat = ebit * 0.75

        return {
            "roe": self.roe(net_profit, equity),
            "roa": self.roa(net_profit, total_assets),
            "roic": self.roic(nopat, invested_capital),
            "roce": self.roce(ebit, total_assets, current_liabilities),
            "gross_return": self.gross_return(gross_profit, total_assets),
        }
