class RatioCalculator:

    @staticmethod
    def _safe_div(a: float | None, b: float | None) -> float | None:
        if a is None or b is None or b == 0:
            return None
        return a / b

    @staticmethod
    def calculate_pe_ratio(
        market_cap: float | None, net_profit_ttm: float | None
    ) -> float | None:
        if market_cap is None or net_profit_ttm is None or net_profit_ttm <= 0:
            return None
        return market_cap / net_profit_ttm

    @staticmethod
    def calculate_pb_ratio(
        market_cap: float | None, equity: float | None
    ) -> float | None:
        if market_cap is None or equity is None or equity <= 0:
            return None
        return market_cap / equity

    @staticmethod
    def calculate_ev(
        market_cap: float | None,
        total_debt: float | None,
        cash: float | None,
    ) -> float | None:
        if market_cap is None:
            return None
        debt = total_debt or 0
        c = cash or 0
        return market_cap + debt - c

    @staticmethod
    def calculate_ev_ebitda(
        ev: float | None, ebitda_ttm: float | None
    ) -> float | None:
        if ev is None or ebitda_ttm is None or ebitda_ttm <= 0:
            return None
        return ev / ebitda_ttm

    @staticmethod
    def calculate_ev_sales(
        ev: float | None, revenue_ttm: float | None
    ) -> float | None:
        if ev is None or revenue_ttm is None or revenue_ttm <= 0:
            return None
        return ev / revenue_ttm

    @staticmethod
    def calculate_peg(
        pe_ratio: float | None, earnings_growth_pct: float | None
    ) -> float | None:
        if pe_ratio is None or earnings_growth_pct is None or earnings_growth_pct <= 0:
            return None
        return pe_ratio / earnings_growth_pct

    @staticmethod
    def calculate_price_sales(
        market_cap: float | None, revenue_ttm: float | None
    ) -> float | None:
        if market_cap is None or revenue_ttm is None or revenue_ttm <= 0:
            return None
        return market_cap / revenue_ttm

    def compute(
        self,
        market_cap: float | None,
        equity: float | None,
        total_debt: float | None,
        cash: float | None,
        net_profit_ttm: float | None,
        ebitda_ttm: float | None,
        revenue_ttm: float | None,
        eps_growth_pct: float | None = None,
    ) -> dict:
        ev = self.calculate_ev(market_cap, total_debt, cash)
        pe = self.calculate_pe_ratio(market_cap, net_profit_ttm)
        return {
            "pe_ratio": pe,
            "pb_ratio": self.calculate_pb_ratio(market_cap, equity),
            "ev_ebitda": self.calculate_ev_ebitda(ev, ebitda_ttm),
            "ev_sales": self.calculate_ev_sales(ev, revenue_ttm),
            "peg_ratio": self.calculate_peg(pe, eps_growth_pct),
            "price_sales": self.calculate_price_sales(market_cap, revenue_ttm),
            "enterprise_value": ev,
        }
