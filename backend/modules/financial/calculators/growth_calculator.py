class GrowthCalculator:

    @staticmethod
    def _safe_div(a: float | None, b: float | None) -> float | None:
        if a is None or b is None or b == 0:
            return None
        return (a - b) / abs(b)

    @staticmethod
    def quarterly_growth(current: float | None, previous: float | None) -> float | None:
        return GrowthCalculator._safe_div(current, previous)

    @staticmethod
    def yearly_growth(current: float | None, year_ago: float | None) -> float | None:
        return GrowthCalculator._safe_div(current, year_ago)

    @staticmethod
    def cagr(start: float | None, end: float | None, years: int) -> float | None:
        if start is None or end is None or start <= 0 or end <= 0 or years <= 0:
            return None
        return (end / start) ** (1.0 / years) - 1.0

    @staticmethod
    def rolling_growth(values: list[float | None], window: int = 4) -> float | None:
        if len(values) < window + 1:
            return None
        recent = values[0]
        past = values[window]
        return GrowthCalculator._safe_div(recent, past)

    @staticmethod
    def ttm(quarterly_values: list[float | None]) -> float | None:
        valid = [v for v in quarterly_values[:4] if v is not None]
        if len(valid) < 4:
            return None
        return sum(valid)

    def compute_growth(
        self,
        current_revenue: float | None,
        prev_q_revenue: float | None,
        prev_y_revenue: float | None,
        rev_3y_ago: float | None,
        rev_5y_ago: float | None,
        current_profit: float | None,
        prev_q_profit: float | None,
        prev_y_profit: float | None,
        profit_3y_ago: float | None,
        profit_5y_ago: float | None,
        current_eps: float | None,
        prev_q_eps: float | None,
        prev_y_eps: float | None,
        eps_3y_ago: float | None,
        eps_5y_ago: float | None,
        current_bv: float | None,
        prev_y_bv: float | None,
        bv_3y_ago: float | None,
        bv_5y_ago: float | None,
        current_ebitda: float | None,
        prev_y_ebitda: float | None,
        current_fcf: float | None,
        prev_y_fcf: float | None,
    ) -> dict:
        return {
            "revenue_growth_q": self.quarterly_growth(current_revenue, prev_q_revenue),
            "revenue_growth_y": self.yearly_growth(current_revenue, prev_y_revenue),
            "revenue_cagr_3y": self.cagr(rev_3y_ago, current_revenue, 3),
            "revenue_cagr_5y": self.cagr(rev_5y_ago, current_revenue, 5),
            "profit_growth_q": self.quarterly_growth(current_profit, prev_q_profit),
            "profit_growth_y": self.yearly_growth(current_profit, prev_y_profit),
            "profit_cagr_3y": self.cagr(profit_3y_ago, current_profit, 3),
            "profit_cagr_5y": self.cagr(profit_5y_ago, current_profit, 5),
            "eps_growth_q": self.quarterly_growth(current_eps, prev_q_eps),
            "eps_growth_y": self.yearly_growth(current_eps, prev_y_eps),
            "eps_cagr_3y": self.cagr(eps_3y_ago, current_eps, 3),
            "eps_cagr_5y": self.cagr(eps_5y_ago, current_eps, 5),
            "book_value_growth_y": self.yearly_growth(current_bv, prev_y_bv),
            "book_value_cagr_3y": self.cagr(bv_3y_ago, current_bv, 3),
            "book_value_cagr_5y": self.cagr(bv_5y_ago, current_bv, 5),
            "ebitda_growth_y": self.yearly_growth(current_ebitda, prev_y_ebitda),
            "fcf_growth_y": self.yearly_growth(current_fcf, prev_y_fcf),
        }
