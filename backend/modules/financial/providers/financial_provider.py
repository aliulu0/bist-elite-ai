import logging
import random
from datetime import date, timedelta

logger = logging.getLogger(__name__)


class FinancialProvider:

    def fetch_financial_data(
        self, stock_code: str, start_date: date | None = None, end_date: date | None = None
    ) -> list[dict]:
        raise NotImplementedError

    def fetch_dividends(self, stock_code: str) -> list[dict]:
        raise NotImplementedError

    def fetch_capital_events(self, stock_code: str) -> list[dict]:
        raise NotImplementedError


class MockFinancialProvider(FinancialProvider):

    def fetch_financial_data(
        self, stock_code: str, start_date: date | None = None, end_date: date | None = None
    ) -> list[dict]:
        results = []
        base_revenue = random.uniform(5_000_000_000, 50_000_000_000)

        for year in range(2022, 2026):
            for quarter in range(1, 5):
                period = f"{year}Q{quarter}"
                revenue = base_revenue * (1 + random.uniform(-0.05, 0.15))
                cogs = revenue * random.uniform(0.55, 0.75)
                gross_profit = revenue - cogs
                opex = revenue * random.uniform(0.10, 0.20)
                operating_profit = gross_profit - opex
                ebit = operating_profit
                ebitda = ebit + revenue * random.uniform(0.02, 0.05)
                pretax = ebit * random.uniform(0.85, 1.0)
                net_profit = pretax * random.uniform(0.75, 0.85)
                eps = net_profit / 1_000_000_000

                total_assets = revenue * random.uniform(1.2, 2.5)
                equity = total_assets * random.uniform(0.3, 0.6)
                total_liabilities = total_assets - equity
                cash = total_assets * random.uniform(0.05, 0.15)
                st_debt = total_liabilities * random.uniform(0.1, 0.3)
                lt_debt = total_liabilities * random.uniform(0.2, 0.4)
                total_debt = st_debt + lt_debt
                receivables = revenue * random.uniform(0.05, 0.15)
                inventories = cogs * random.uniform(0.05, 0.15)
                current_assets = cash + receivables + inventories + total_assets * 0.05
                fixed_assets = total_assets * random.uniform(0.3, 0.6)
                current_liab = total_liabilities * random.uniform(0.3, 0.6)
                net_debt_val = total_debt - cash
                working_capital = current_assets - current_liab
                book_value = equity / 1_000_000_000

                ocf = net_profit * random.uniform(0.8, 1.3)
                icf = -abs(net_profit * random.uniform(0.3, 0.8))
                fcf_val = ocf - abs(net_profit * random.uniform(0.2, 0.5))

                results.append({
                    "stock_code": stock_code,
                    "period": period,
                    "year": year,
                    "quarter": quarter,
                    "report_type": "quarterly",
                    "currency": "TRY",
                    "revenue": revenue,
                    "cost_of_sales": cogs,
                    "gross_profit": gross_profit,
                    "operating_expenses": opex,
                    "operating_profit": operating_profit,
                    "ebit": ebit,
                    "ebitda": ebitda,
                    "pretax_income": pretax,
                    "net_profit": net_profit,
                    "eps": eps,
                    "diluted_eps": eps * 0.98,
                    "shares_outstanding": 1_000_000_000,
                    "cash": cash,
                    "cash_equivalents": cash * 0.1,
                    "receivables": receivables,
                    "inventories": inventories,
                    "current_assets": current_assets,
                    "fixed_assets": fixed_assets,
                    "total_assets": total_assets,
                    "short_term_debt": st_debt,
                    "long_term_debt": lt_debt,
                    "total_debt": total_debt,
                    "current_liabilities": current_liab,
                    "total_liabilities": total_liabilities,
                    "equity": equity,
                    "book_value": book_value,
                    "net_debt": net_debt_val,
                    "working_capital": working_capital,
                    "operating_cash_flow": ocf,
                    "investing_cash_flow": icf,
                    "financing_cash_flow": -ocf * random.uniform(0.2, 0.5),
                    "capital_expenditure": abs(icf) * random.uniform(0.3, 0.7),
                    "free_cash_flow": fcf_val,
                    "dividend_paid": net_profit * random.uniform(0.1, 0.3),
                    "share_buyback": 0,
                })
                base_revenue = revenue

        return results

    def fetch_dividends(self, stock_code: str) -> list[dict]:
        results = []
        for year in range(2020, 2026):
            for q in range(1, 5):
                try:
                    ex_date = date(year, q * 3, 15)
                except ValueError:
                    ex_date = date(year, q * 3, 14)
                dps = random.uniform(0.5, 5.0)
                yield_pct = random.uniform(0.01, 0.06)
                payout = random.uniform(0.2, 0.6)
                results.append({
                    "ex_date": ex_date,
                    "payment_date": ex_date + timedelta(days=30),
                    "gross_dividend": dps * 1_000_000_000,
                    "net_dividend": dps * 1_000_000_000 * 0.85,
                    "yield_pct": yield_pct,
                    "payout_ratio": payout,
                    "dividend_per_share": dps,
                    "period": f"{year}Q{q}",
                    "year": year,
                })
        return results

    def fetch_capital_events(self, stock_code: str) -> list[dict]:
        return [
            {
                "event_type": "dividend",
                "event_date": date(2024, 6, 15),
                "ratio": 1.0,
                "price_adjustment": None,
                "description": "Q2 2024 dividend",
            },
            {
                "event_type": "rights_issue",
                "event_date": date(2023, 3, 10),
                "ratio": 0.25,
                "price_adjustment": 50.0,
                "description": "Capital increase via rights issue",
            },
        ]


class KapFinancialProvider(FinancialProvider):

    def __init__(self, api_key: str | None = None):
        self._api_key = api_key

    def fetch_financial_data(
        self, stock_code: str, start_date: date | None = None, end_date: date | None = None
    ) -> list[dict]:
        logger.info(f"KAP provider fetch for {stock_code} (not implemented, falling back to mock)")
        mock = MockFinancialProvider()
        return mock.fetch_financial_data(stock_code, start_date, end_date)

    def fetch_dividends(self, stock_code: str) -> list[dict]:
        logger.info(f"KAP provider fetch dividends for {stock_code} (falling back to mock)")
        mock = MockFinancialProvider()
        return mock.fetch_dividends(stock_code)

    def fetch_capital_events(self, stock_code: str) -> list[dict]:
        logger.info(f"KAP provider fetch capital events for {stock_code} (falling back to mock)")
        mock = MockFinancialProvider()
        return mock.fetch_capital_events(stock_code)
