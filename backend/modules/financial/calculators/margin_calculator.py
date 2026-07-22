class MarginCalculator:

    @staticmethod
    def _safe_div(a: float | None, b: float | None) -> float | None:
        if a is None or b is None or b == 0:
            return None
        return a / b

    @staticmethod
    def gross_margin(gross_profit: float | None, revenue: float | None) -> float | None:
        return MarginCalculator._safe_div(gross_profit, revenue)

    @staticmethod
    def operating_margin(
        operating_profit: float | None, revenue: float | None
    ) -> float | None:
        return MarginCalculator._safe_div(operating_profit, revenue)

    @staticmethod
    def ebitda_margin(ebitda: float | None, revenue: float | None) -> float | None:
        return MarginCalculator._safe_div(ebitda, revenue)

    @staticmethod
    def net_margin(net_profit: float | None, revenue: float | None) -> float | None:
        return MarginCalculator._safe_div(net_profit, revenue)

    @staticmethod
    def fcf_margin(fcf: float | None, revenue: float | None) -> float | None:
        return MarginCalculator._safe_div(fcf, revenue)

    def compute(self, data: dict) -> dict:
        revenue = data.get("revenue")
        return {
            "gross_margin": self.gross_margin(data.get("gross_profit"), revenue),
            "operating_margin": self.operating_margin(data.get("operating_profit"), revenue),
            "ebitda_margin": self.ebitda_margin(data.get("ebitda"), revenue),
            "net_margin": self.net_margin(data.get("net_profit"), revenue),
            "fcf_margin": self.fcf_margin(data.get("free_cash_flow"), revenue),
        }
