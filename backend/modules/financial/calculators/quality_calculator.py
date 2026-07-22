class QualityCalculator:

    @staticmethod
    def piotroski_f_score(
        net_profit: float | None,
        roa: float | None,
        ocf: float | None,
        roa_prev: float | None,
        ocf_prev: float | None,
        long_term_debt_current: float | None,
        long_term_debt_prev: float | None,
        current_ratio: float | None,
        current_ratio_prev: float | None,
        shares_current: float | None,
        shares_prev: float | None,
        gross_margin: float | None,
        gross_margin_prev: float | None,
        asset_turnover: float | None,
        asset_turnover_prev: float | None,
    ) -> int:
        score = 0

        if net_profit is not None and net_profit > 0:
            score += 1

        if roa is not None and roa > 0:
            score += 1

        if ocf is not None and ocf > 0:
            score += 1

        if ocf is not None and net_profit is not None and ocf > net_profit:
            score += 1

        if long_term_debt_current is not None and long_term_debt_prev is not None:
            if long_term_debt_current < long_term_debt_prev:
                score += 1

        if current_ratio is not None and current_ratio_prev is not None:
            if current_ratio > current_ratio_prev:
                score += 1

        if shares_current is not None and shares_prev is not None:
            if shares_prev > 0 and shares_current <= shares_prev:
                score += 1

        if gross_margin is not None and gross_margin_prev is not None:
            if gross_margin > gross_margin_prev:
                score += 1

        if asset_turnover is not None and asset_turnover_prev is not None:
            if asset_turnover > asset_turnover_prev:
                score += 1

        return score

    @staticmethod
    def altman_z_score(
        total_assets: float | None,
        total_liabilities: float | None,
        working_capital: float | None,
        retained_earnings: float | None,
        ebit: float | None,
        market_cap: float | None,
        total_debt: float | None,
        revenue: float | None,
    ) -> float | None:
        if total_assets is None or total_assets == 0:
            return None

        a = working_capital if working_capital is not None else 0
        b = retained_earnings if retained_earnings is not None else 0
        c = ebit if ebit is not None else 0
        d = market_cap if market_cap is not None else 0
        e = revenue if revenue is not None else 0
        tl = total_liabilities if total_liabilities is not None else 0

        x1 = a / total_assets
        x2 = b / total_assets
        x3 = c / total_assets
        x4 = d / tl if tl != 0 else 0
        x5 = e / total_assets

        return 1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * x4 + 1.0 * x5

    @staticmethod
    def beneish_m_score(
        revenue_current: float | None,
        revenue_prev: float | None,
        cogs_current: float | None,
        cogs_prev: float | None,
        receivables_current: float | None,
        receivables_prev: float | None,
        assets_current: float | None,
        assets_prev: float | None,
        ppe_current: float | None,
        ppe_prev: float | None,
        depreciation_current: float | None,
        depreciation_prev: float | None,
        sga_current: float | None,
        sga_prev: float | None,
        net_profit_current: float | None,
        net_profit_prev: float | None,
        ocf_current: float | None,
        ocf_prev: float | None,
        current_liabilities_current: float | None,
        current_liabilities_prev: float | None,
        long_term_debt_current: float | None,
        long_term_debt_prev: float | None,
    ) -> float | None:
        def _check(*args):
            return any(v is None for v in args)

        if _check(
            revenue_prev, revenue_current, cogs_prev, cogs_current,
            receivables_prev, receivables_current, assets_prev, assets_current,
            ppe_prev, ppe_current, sga_prev, sga_current,
            depreciation_prev, depreciation_current,
            net_profit_prev, net_profit_current,
            ocf_prev, ocf_current,
            current_liabilities_prev, current_liabilities_current,
            long_term_debt_prev, long_term_debt_current,
        ):
            return None

        if any(v == 0 for v in [revenue_prev, assets_prev, cogs_prev, receivables_prev, ppe_prev]):
            return None

        dsri = (receivables_current / revenue_current) / (receivables_prev / revenue_prev)
        gmi = ((cogs_prev / revenue_prev) * (1 - cogs_prev / revenue_prev)) / (
            (cogs_current / revenue_current) * (1 - cogs_current / revenue_current)
        ) if cogs_current != 0 and revenue_current != 0 and cogs_prev != 0 and revenue_prev != 0 else 1
        aqi = ((assets_current - ppe_current - receivables_current) / assets_current) / (
            (assets_prev - ppe_prev - receivables_prev) / assets_prev
        )
        sgi = revenue_current / revenue_prev
        depgi = (depreciation_current / (ppe_current + depreciation_current)) / (
            depreciation_prev / (ppe_prev + depreciation_prev)
        ) if ppe_current + depreciation_current != 0 and ppe_prev + depreciation_prev != 0 else 1
        sga = (sga_current / revenue_current) / (sga_prev / revenue_prev) if revenue_current != 0 and revenue_prev != 0 else 1
        lv = (current_liabilities_current + long_term_debt_current) / assets_current if assets_current != 0 else 0
        tata = (net_profit_current - ocf_current) / assets_current if assets_current != 0 else 0

        m = (
            -4.84 + 0.92 * dsri + 0.528 * gmi + 0.404 * aqi
            + 0.892 * sgi + 0.115 * depgi - 0.172 * sga
            + 4.679 * tata - 0.327 * lv
        )
        return m

    @staticmethod
    def financial_strength_score(
        current_ratio: float | None,
        quick_ratio: float | None,
        debt_equity: float | None,
        interest_coverage: float | None,
        net_debt_ebitda: float | None,
    ) -> float:
        score = 50.0

        if current_ratio is not None:
            if current_ratio >= 2.0:
                score += 10
            elif current_ratio >= 1.5:
                score += 5
            elif current_ratio < 1.0:
                score -= 10

        if quick_ratio is not None:
            if quick_ratio >= 1.0:
                score += 10
            elif quick_ratio >= 0.8:
                score += 5
            elif quick_ratio < 0.5:
                score -= 10

        if debt_equity is not None:
            if debt_equity < 0.5:
                score += 10
            elif debt_equity < 1.0:
                score += 5
            elif debt_equity > 2.0:
                score -= 15
            elif debt_equity > 1.5:
                score -= 10

        if interest_coverage is not None:
            if interest_coverage >= 5:
                score += 10
            elif interest_coverage >= 2:
                score += 5
            elif interest_coverage < 1:
                score -= 15

        if net_debt_ebitda is not None:
            if net_debt_ebitda < 1:
                score += 10
            elif net_debt_ebitda < 2:
                score += 5
            elif net_debt_ebitda > 4:
                score -= 10

        return max(0, min(100, score))

    @staticmethod
    def profitability_score(
        roe: float | None,
        roa: float | None,
        roic: float | None,
        net_margin: float | None,
        gross_margin: float | None,
    ) -> float:
        score = 50.0

        if roe is not None:
            if roe > 0.20:
                score += 10
            elif roe > 0.10:
                score += 5
            elif roe < 0:
                score -= 15

        if roa is not None:
            if roa > 0.10:
                score += 10
            elif roa > 0.05:
                score += 5
            elif roa < 0:
                score -= 10

        if roic is not None:
            if roic > 0.15:
                score += 10
            elif roic > 0.08:
                score += 5
            elif roic < 0:
                score -= 10

        if net_margin is not None:
            if net_margin > 0.15:
                score += 5
            elif net_margin > 0.05:
                score += 2
            elif net_margin < 0:
                score -= 10

        if gross_margin is not None:
            if gross_margin > 0.40:
                score += 5
            elif gross_margin > 0.25:
                score += 2

        return max(0, min(100, score))

    @staticmethod
    def growth_score(
        revenue_growth_y: float | None,
        profit_growth_y: float | None,
        eps_growth_y: float | None,
        book_value_growth_y: float | None,
    ) -> float:
        score = 50.0

        for g in [revenue_growth_y, profit_growth_y, eps_growth_y, book_value_growth_y]:
            if g is not None:
                if g > 0.20:
                    score += 8
                elif g > 0.10:
                    score += 4
                elif g > 0:
                    score += 1
                elif g < -0.20:
                    score -= 10
                elif g < -0.10:
                    score -= 5

        return max(0, min(100, score))

    @staticmethod
    def dividend_quality_score(
        payout_ratio: float | None,
        yield_pct: float | None,
        consecutive_dividends: int = 0,
    ) -> float:
        score = 50.0

        if payout_ratio is not None:
            if 0.20 <= payout_ratio <= 0.60:
                score += 15
            elif 0.10 <= payout_ratio <= 0.80:
                score += 8
            elif payout_ratio > 1.0:
                score -= 20
            elif payout_ratio > 0.80:
                score -= 5

        if yield_pct is not None:
            if 0.02 <= yield_pct <= 0.06:
                score += 10
            elif yield_pct > 0.10:
                score -= 5

        if consecutive_dividends >= 10:
            score += 15
        elif consecutive_dividends >= 5:
            score += 10
        elif consecutive_dividends >= 2:
            score += 5

        return max(0, min(100, score))

    def compute_all(
        self,
        data: dict,
        prev_data: dict | None = None,
        market_cap: float | None = None,
        consecutive_dividends: int = 0,
    ) -> dict:
        prev = prev_data or {}

        altman = self.altman_z_score(
            total_assets=data.get("total_assets"),
            total_liabilities=data.get("total_liabilities"),
            working_capital=data.get("working_capital"),
            retained_earnings=data.get("equity"),
            ebit=data.get("ebit"),
            market_cap=market_cap,
            total_debt=data.get("total_debt"),
            revenue=data.get("revenue"),
        )

        beneish = self.beneish_m_score(
            revenue_current=data.get("revenue"),
            revenue_prev=prev.get("revenue"),
            cogs_current=data.get("cost_of_sales"),
            cogs_prev=prev.get("cost_of_sales"),
            receivables_current=data.get("receivables"),
            receivables_prev=prev.get("receivables"),
            assets_current=data.get("total_assets"),
            assets_prev=prev.get("total_assets"),
            ppe_current=data.get("fixed_assets"),
            ppe_prev=prev.get("fixed_assets"),
            depreciation_current=None,
            depreciation_prev=None,
            sga_current=data.get("operating_expenses"),
            sga_prev=prev.get("operating_expenses"),
            net_profit_current=data.get("net_profit"),
            net_profit_prev=prev.get("net_profit"),
            ocf_current=data.get("operating_cash_flow"),
            ocf_prev=prev.get("operating_cash_flow"),
            current_liabilities_current=data.get("current_liabilities"),
            current_liabilities_prev=prev.get("current_liabilities"),
            long_term_debt_current=data.get("long_term_debt"),
            long_term_debt_prev=prev.get("long_term_debt"),
        )

        return {
            "piotroski_f_score": None,
            "altman_z_score": altman,
            "beneish_m_score": beneish,
            "financial_strength_score": self.financial_strength_score(
                current_ratio=data.get("current_ratio"),
                quick_ratio=data.get("quick_ratio"),
                debt_equity=data.get("debt_equity"),
                interest_coverage=data.get("interest_coverage"),
                net_debt_ebitda=data.get("net_debt_ebitda"),
            ),
            "profitability_score": self.profitability_score(
                roe=data.get("roe"),
                roa=data.get("roa"),
                roic=data.get("roic"),
                net_margin=data.get("net_margin"),
                gross_margin=data.get("gross_margin"),
            ),
            "growth_score": self.growth_score(
                revenue_growth_y=data.get("revenue_growth_y"),
                profit_growth_y=data.get("profit_growth_y"),
                eps_growth_y=data.get("eps_growth_y"),
                book_value_growth_y=data.get("book_value_growth_y"),
            ),
            "dividend_quality_score": self.dividend_quality_score(
                payout_ratio=data.get("payout_ratio"),
                yield_pct=data.get("yield_pct"),
                consecutive_dividends=consecutive_dividends,
            ),
        }
