from modules.financial.calculators.ratio_calculator import RatioCalculator
from modules.financial.calculators.margin_calculator import MarginCalculator
from modules.financial.calculators.growth_calculator import GrowthCalculator
from modules.financial.calculators.profitability_calculator import ProfitabilityCalculator
from modules.financial.calculators.debt_calculator import DebtCalculator
from modules.financial.calculators.efficiency_calculator import EfficiencyCalculator
from modules.financial.calculators.quality_calculator import QualityCalculator


class CalculationService:

    def __init__(self):
        self._ratios = RatioCalculator()
        self._margins = MarginCalculator()
        self._growth = GrowthCalculator()
        self._profitability = ProfitabilityCalculator()
        self._debt = DebtCalculator()
        self._efficiency = EfficiencyCalculator()
        self._quality = QualityCalculator()

    def calculate_all_ratios(
        self,
        statement: dict,
        market_cap: float | None = None,
        prev_statement: dict | None = None,
        prev_y_statement: dict | None = None,
        y3_statement: dict | None = None,
        y5_statement: dict | None = None,
    ) -> dict:
        ttm_revenue = self._growth.ttm([
            statement.get("revenue"),
        ])
        ttm_net_profit = self._growth.ttm([
            statement.get("net_profit"),
        ])
        ttm_eps = self._growth.ttm([
            statement.get("eps"),
        ])
        ttm_ebitda = self._growth.ttm([
            statement.get("ebitda"),
        ])
        ttm_fcf = self._growth.ttm([
            statement.get("free_cash_flow"),
        ])

        eps_growth_y = None
        if prev_y_statement and prev_y_statement.get("eps") and statement.get("eps"):
            eps_growth_y = self._growth.yearly_growth(
                statement.get("eps"), prev_y_statement.get("eps")
            )

        ratio_data = self._ratios.compute(
            market_cap=market_cap,
            equity=statement.get("equity"),
            total_debt=statement.get("total_debt"),
            cash=statement.get("cash"),
            net_profit_ttm=ttm_net_profit or statement.get("net_profit"),
            ebitda_ttm=ttm_ebitda or statement.get("ebitda"),
            revenue_ttm=ttm_revenue or statement.get("revenue"),
            eps_growth_pct=eps_growth_y,
        )

        margin_data = self._margins.compute(statement)

        growth_data = self._growth.compute_growth(
            current_revenue=statement.get("revenue"),
            prev_q_revenue=prev_statement.get("revenue") if prev_statement else None,
            prev_y_revenue=prev_y_statement.get("revenue") if prev_y_statement else None,
            rev_3y_ago=y3_statement.get("revenue") if y3_statement else None,
            rev_5y_ago=y5_statement.get("revenue") if y5_statement else None,
            current_profit=statement.get("net_profit"),
            prev_q_profit=prev_statement.get("net_profit") if prev_statement else None,
            prev_y_profit=prev_y_statement.get("net_profit") if prev_y_statement else None,
            profit_3y_ago=y3_statement.get("net_profit") if y3_statement else None,
            profit_5y_ago=y5_statement.get("net_profit") if y5_statement else None,
            current_eps=statement.get("eps"),
            prev_q_eps=prev_statement.get("eps") if prev_statement else None,
            prev_y_eps=prev_y_statement.get("eps") if prev_y_statement else None,
            eps_3y_ago=y3_statement.get("eps") if y3_statement else None,
            eps_5y_ago=y5_statement.get("eps") if y5_statement else None,
            current_bv=statement.get("book_value"),
            prev_y_bv=prev_y_statement.get("book_value") if prev_y_statement else None,
            bv_3y_ago=y3_statement.get("book_value") if y3_statement else None,
            bv_5y_ago=y5_statement.get("book_value") if y5_statement else None,
            current_ebitda=statement.get("ebitda"),
            prev_y_ebitda=prev_y_statement.get("ebitda") if prev_y_statement else None,
            current_fcf=statement.get("free_cash_flow"),
            prev_y_fcf=prev_y_statement.get("free_cash_flow") if prev_y_statement else None,
        )

        profitability_data = self._profitability.compute(statement)
        debt_data = self._debt.compute(statement)
        efficiency_data = self._efficiency.compute(statement)

        all_data = {}
        all_data.update(statement)
        all_data.update(ratio_data)
        all_data.update(margin_data)
        all_data.update(growth_data)
        all_data.update(profitability_data)
        all_data.update(debt_data)
        all_data.update(efficiency_data)
        all_data.update({
            "ttm_revenue": ttm_revenue,
            "ttm_net_profit": ttm_net_profit,
            "ttm_eps": ttm_eps,
            "ttm_ebitda": ttm_ebitda,
            "ttm_fcf": ttm_fcf,
        })

        return all_data

    def calculate_quality_scores(
        self,
        all_ratios: dict,
        statement: dict,
        prev_statement: dict | None = None,
        market_cap: float | None = None,
        consecutive_dividends: int = 0,
    ) -> dict:
        return self._quality.compute_all(
            data=statement,
            prev_data=prev_statement,
            market_cap=market_cap,
            consecutive_dividends=consecutive_dividends,
        )
