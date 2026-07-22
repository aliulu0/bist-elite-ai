import pytest
import math
from modules.financial.calculators.ratio_calculator import RatioCalculator
from modules.financial.calculators.margin_calculator import MarginCalculator
from modules.financial.calculators.growth_calculator import GrowthCalculator
from modules.financial.calculators.profitability_calculator import ProfitabilityCalculator
from modules.financial.calculators.debt_calculator import DebtCalculator
from modules.financial.calculators.efficiency_calculator import EfficiencyCalculator
from modules.financial.calculators.quality_calculator import QualityCalculator


class TestRatioCalculator:
    def setup_method(self):
        self.calc = RatioCalculator()

    def test_pe_ratio(self):
        assert RatioCalculator.calculate_pe_ratio(1_000, 100) == 10.0

    def test_pe_ratio_none_market_cap(self):
        assert RatioCalculator.calculate_pe_ratio(None, 100) is None

    def test_pe_ratio_zero_profit(self):
        assert RatioCalculator.calculate_pe_ratio(1_000, 0) is None

    def test_pe_ratio_negative_profit(self):
        assert RatioCalculator.calculate_pe_ratio(1_000, -50) is None

    def test_pb_ratio(self):
        assert RatioCalculator.calculate_pb_ratio(2_000, 1_000) == 2.0

    def test_pb_ratio_none_equity(self):
        assert RatioCalculator.calculate_pb_ratio(1_000, None) is None

    def test_pb_ratio_zero_equity(self):
        assert RatioCalculator.calculate_pb_ratio(1_000, 0) is None

    def test_ev(self):
        assert RatioCalculator.calculate_ev(1_000, 200, 100) == 1100.0

    def test_ev_none_debt_cash(self):
        assert RatioCalculator.calculate_ev(1_000, None, None) == 1000.0

    def test_ev_none_market_cap(self):
        assert RatioCalculator.calculate_ev(None, 200, 100) is None

    def test_ev_ebitda(self):
        assert RatioCalculator.calculate_ev_ebitda(1_100, 200) == 5.5

    def test_ev_ebitda_none(self):
        assert RatioCalculator.calculate_ev_ebitda(None, 200) is None

    def test_ev_ebitda_zero(self):
        assert RatioCalculator.calculate_ev_ebitda(1_100, 0) is None

    def test_ev_sales(self):
        assert RatioCalculator.calculate_ev_sales(1_100, 2_000) == pytest.approx(0.55)

    def test_ev_sales_none(self):
        assert RatioCalculator.calculate_ev_sales(None, 2_000) is None

    def test_peg(self):
        assert RatioCalculator.calculate_peg(20, 15) == pytest.approx(20 / 15)

    def test_peg_zero_growth(self):
        assert RatioCalculator.calculate_peg(20, 0) is None

    def test_peg_negative_growth(self):
        assert RatioCalculator.calculate_peg(20, -5) is None

    def test_price_sales(self):
        assert RatioCalculator.calculate_price_sales(5_000, 10_000) == 0.5

    def test_price_sales_none(self):
        assert RatioCalculator.calculate_price_sales(None, 10_000) is None

    def test_compute_all(self):
        result = self.calc.compute(
            market_cap=1_000_000,
            equity=500_000,
            total_debt=200_000,
            cash=50_000,
            net_profit_ttm=100_000,
            ebitda_ttm=150_000,
            revenue_ttm=1_000_000,
            eps_growth_pct=10.0,
        )
        assert result["pe_ratio"] == 10.0
        assert result["pb_ratio"] == 2.0
        assert result["enterprise_value"] == 1_150_000
        assert result["ev_ebitda"] == pytest.approx(1_150_000 / 150_000)
        assert result["ev_sales"] == pytest.approx(1_150_000 / 1_000_000)
        assert result["peg_ratio"] == pytest.approx(10.0 / 10.0)
        assert result["price_sales"] == 1.0

    def test_compute_all_none_values(self):
        result = self.calc.compute(
            market_cap=None,
            equity=None,
            total_debt=None,
            cash=None,
            net_profit_ttm=None,
            ebitda_ttm=None,
            revenue_ttm=None,
        )
        assert result["pe_ratio"] is None
        assert result["pb_ratio"] is None
        assert result["ev_ebitda"] is None


class TestMarginCalculator:
    def setup_method(self):
        self.calc = MarginCalculator()

    def test_gross_margin(self):
        assert MarginCalculator.gross_margin(400, 1000) == 0.4

    def test_operating_margin(self):
        assert MarginCalculator.operating_margin(200, 1000) == 0.2

    def test_ebitda_margin(self):
        assert MarginCalculator.ebitda_margin(250, 1000) == 0.25

    def test_net_margin(self):
        assert MarginCalculator.net_margin(150, 1000) == 0.15

    def test_fcf_margin(self):
        assert MarginCalculator.fcf_margin(100, 1000) == 0.1

    def test_none_numerator(self):
        assert MarginCalculator.gross_margin(None, 1000) is None

    def test_none_denominator(self):
        assert MarginCalculator.gross_margin(400, None) is None

    def test_zero_denominator(self):
        assert MarginCalculator.gross_margin(400, 0) is None

    def test_compute(self):
        data = {
            "revenue": 1_000,
            "gross_profit": 400,
            "operating_profit": 200,
            "ebitda": 250,
            "net_profit": 150,
            "free_cash_flow": 100,
        }
        result = self.calc.compute(data)
        assert result["gross_margin"] == 0.4
        assert result["operating_margin"] == 0.2
        assert result["ebitda_margin"] == 0.25
        assert result["net_margin"] == 0.15
        assert result["fcf_margin"] == 0.1

    def test_compute_none_values(self):
        result = self.calc.compute({})
        assert result["gross_margin"] is None
        assert result["operating_margin"] is None


class TestGrowthCalculator:
    def setup_method(self):
        self.calc = GrowthCalculator()

    def test_quarterly_growth(self):
        assert GrowthCalculator.quarterly_growth(120, 100) == pytest.approx(0.2)

    def test_quarterly_growth_none(self):
        assert GrowthCalculator.quarterly_growth(None, 100) is None

    def test_quarterly_growth_zero_prev(self):
        assert GrowthCalculator.quarterly_growth(100, 0) is None

    def test_yearly_growth(self):
        assert GrowthCalculator.yearly_growth(150, 100) == pytest.approx(0.5)

    def test_yearly_growth_none(self):
        assert GrowthCalculator.yearly_growth(100, None) is None

    def test_cagr(self):
        result = GrowthCalculator.cagr(100, 200, 3)
        assert result == pytest.approx((200 / 100) ** (1 / 3) - 1)

    def test_cagr_zero_start(self):
        assert GrowthCalculator.cagr(0, 200, 3) is None

    def test_cagr_zero_end(self):
        assert GrowthCalculator.cagr(100, 0, 3) is None

    def test_cagr_zero_years(self):
        assert GrowthCalculator.cagr(100, 200, 0) is None

    def test_cagr_negative(self):
        assert GrowthCalculator.cagr(-100, 200, 3) is None

    def test_rolling_growth(self):
        values = [120, 115, 110, 105, 100]
        assert GrowthCalculator.rolling_growth(values, window=4) == pytest.approx(0.2)

    def test_rolling_growth_too_few(self):
        assert GrowthCalculator.rolling_growth([100, 110], window=4) is None

    def test_ttm(self):
        assert GrowthCalculator.ttm([100, 110, 120, 130]) == 460

    def test_ttm_with_none(self):
        assert GrowthCalculator.ttm([100, None, 120, 130]) is None

    def test_ttm_too_few(self):
        assert GrowthCalculator.ttm([100, 110]) is None

    def test_compute_growth(self):
        result = self.calc.compute_growth(
            current_revenue=200,
            prev_q_revenue=150,
            prev_y_revenue=100,
            rev_3y_ago=50,
            rev_5y_ago=None,
            current_profit=50,
            prev_q_profit=40,
            prev_y_profit=30,
            profit_3y_ago=20,
            profit_5y_ago=None,
            current_eps=5.0,
            prev_q_eps=4.0,
            prev_y_eps=3.0,
            eps_3y_ago=2.0,
            eps_5y_ago=None,
            current_bv=10.0,
            prev_y_bv=8.0,
            bv_3y_ago=6.0,
            bv_5y_ago=None,
            current_ebitda=60,
            prev_y_ebitda=45,
            current_fcf=30,
            prev_y_fcf=20,
        )
        assert result["revenue_growth_q"] == pytest.approx(200 / 150 - 1)
        assert result["revenue_growth_y"] == pytest.approx(200 / 100 - 1)
        assert result["revenue_cagr_3y"] == pytest.approx((200 / 50) ** (1 / 3) - 1)
        assert result["revenue_cagr_5y"] is None
        assert result["eps_growth_q"] == pytest.approx(5.0 / 4.0 - 1)

    def test_edge_all_none(self):
        result = self.calc.compute_growth(
            current_revenue=None,
            prev_q_revenue=None,
            prev_y_revenue=None,
            rev_3y_ago=None,
            rev_5y_ago=None,
            current_profit=None,
            prev_q_profit=None,
            prev_y_profit=None,
            profit_3y_ago=None,
            profit_5y_ago=None,
            current_eps=None,
            prev_q_eps=None,
            prev_y_eps=None,
            eps_3y_ago=None,
            eps_5y_ago=None,
            current_bv=None,
            prev_y_bv=None,
            bv_3y_ago=None,
            bv_5y_ago=None,
            current_ebitda=None,
            prev_y_ebitda=None,
            current_fcf=None,
            prev_y_fcf=None,
        )
        assert all(v is None for v in result.values())


class TestProfitabilityCalculator:
    def setup_method(self):
        self.calc = ProfitabilityCalculator()

    def test_roe(self):
        assert ProfitabilityCalculator.roe(100, 500) == 0.2

    def test_roe_none(self):
        assert ProfitabilityCalculator.roe(None, 500) is None

    def test_roa(self):
        assert ProfitabilityCalculator.roa(100, 2000) == 0.05

    def test_roa_none(self):
        assert ProfitabilityCalculator.roa(None, 2000) is None

    def test_roic(self):
        assert ProfitabilityCalculator.roic(150, 1000) == 0.15

    def test_roic_none(self):
        assert ProfitabilityCalculator.roic(None, 1000) is None

    def test_roce(self):
        assert ProfitabilityCalculator.roce(200, 2000, 500) == pytest.approx(200 / 1500)

    def test_roce_none_inputs(self):
        assert ProfitabilityCalculator.roce(None, 2000, 500) is None

    def test_roce_zero_capital_employed(self):
        assert ProfitabilityCalculator.roce(200, 500, 500) is None

    def test_gross_return(self):
        assert ProfitabilityCalculator.gross_return(500, 2000) == 0.25

    def test_gross_return_none(self):
        assert ProfitabilityCalculator.gross_return(None, 2000) is None

    def test_compute(self):
        data = {
            "net_profit": 100,
            "equity": 500,
            "total_assets": 2000,
            "ebit": 200,
            "current_liabilities": 500,
            "gross_profit": 500,
            "short_term_debt": 100,
            "long_term_debt": 200,
            "cash": 50,
        }
        result = self.calc.compute(data)
        assert result["roe"] == 0.2
        assert result["roa"] == 0.05
        assert result["roce"] == pytest.approx(200 / 1500)
        assert result["gross_return"] == 0.25
        assert result["roic"] is not None

    def test_compute_none_values(self):
        result = self.calc.compute({})
        assert result["roe"] is None
        assert result["roa"] is None


class TestDebtCalculator:
    def setup_method(self):
        self.calc = DebtCalculator()

    def test_debt_equity(self):
        assert DebtCalculator.debt_equity(500, 1000) == 0.5

    def test_debt_assets(self):
        assert DebtCalculator.debt_assets(500, 2000) == 0.25

    def test_net_debt_ebitda(self):
        assert DebtCalculator.net_debt_ebitda(300, 150) == 2.0

    def test_interest_coverage(self):
        assert DebtCalculator.interest_coverage(200, 50) == 4.0

    def test_interest_coverage_zero_expense(self):
        assert DebtCalculator.interest_coverage(200, 0) is None

    def test_interest_coverage_none(self):
        assert DebtCalculator.interest_coverage(None, 50) is None

    def test_current_ratio(self):
        assert DebtCalculator.current_ratio(1500, 1000) == 1.5

    def test_quick_ratio(self):
        assert DebtCalculator.quick_ratio(1500, 300, 1000) == pytest.approx(1.2)

    def test_quick_ratio_none_inventory(self):
        assert DebtCalculator.quick_ratio(1500, None, 1000) == 1.5

    def test_cash_ratio(self):
        assert DebtCalculator.cash_ratio(200, 100, 1000) == 0.3

    def test_cash_ratio_none_values(self):
        assert DebtCalculator.cash_ratio(None, None, 1000) == 0.0

    def test_compute(self):
        data = {
            "total_debt": 500,
            "net_debt": 300,
            "ebitda": 150,
            "equity": 1000,
            "total_assets": 2000,
            "ebit": 200,
            "current_assets": 1500,
            "current_liabilities": 1000,
            "inventories": 300,
            "cash": 200,
            "cash_equivalents": 100,
        }
        result = self.calc.compute(data)
        assert result["debt_equity"] == 0.5
        assert result["debt_assets"] == 0.25
        assert result["net_debt_ebitda"] == 2.0
        assert result["current_ratio"] == 1.5
        assert result["quick_ratio"] == pytest.approx(1.2)
        assert result["cash_ratio"] == 0.3


class TestEfficiencyCalculator:
    def setup_method(self):
        self.calc = EfficiencyCalculator()

    def test_asset_turnover(self):
        assert EfficiencyCalculator.asset_turnover(1_000_000, 5_000_000) == 0.2

    def test_inventory_turnover(self):
        assert EfficiencyCalculator.inventory_turnover(600_000, 50_000) == 12.0

    def test_receivable_turnover(self):
        assert EfficiencyCalculator.receivable_turnover(1_000_000, 100_000) == 10.0

    def test_cash_conversion_cycle(self):
        ccc = EfficiencyCalculator.cash_conversion_cycle(
            receivables=100_000,
            revenue=1_000_000,
            inventories=50_000,
            cost_of_sales=600_000,
            current_liabilities=200_000,
        )
        assert ccc is not None
        assert isinstance(ccc, float)

    def test_cash_conversion_cycle_none(self):
        assert EfficiencyCalculator.cash_conversion_cycle(None, 1e6, 50e3, 600e3, 200e3) is None

    def test_compute(self):
        data = {
            "revenue": 1_000_000,
            "total_assets": 5_000_000,
            "cost_of_sales": 600_000,
            "inventories": 50_000,
            "receivables": 100_000,
            "current_liabilities": 200_000,
        }
        result = self.calc.compute(data)
        assert result["asset_turnover"] == 0.2
        assert result["inventory_turnover"] == 12.0
        assert result["receivable_turnover"] == 10.0
        assert result["cash_conversion_cycle"] is not None

    def test_edge_none(self):
        result = self.calc.compute({})
        assert result["asset_turnover"] is None
        assert result["inventory_turnover"] is None


class TestQualityCalculator:
    def setup_method(self):
        self.calc = QualityCalculator()

    def test_piotroski_f_score_zero(self):
        score = QualityCalculator.piotroski_f_score(
            net_profit=-100,
            roa=-0.01,
            ocf=-150,
            roa_prev=0.02,
            ocf_prev=100,
            long_term_debt_current=500,
            long_term_debt_prev=400,
            current_ratio=1.0,
            current_ratio_prev=1.5,
            shares_current=200,
            shares_prev=100,
            gross_margin=0.2,
            gross_margin_prev=0.3,
            asset_turnover=0.5,
            asset_turnover_prev=0.6,
        )
        assert score == 0

    def test_piotroski_f_score_full(self):
        score = QualityCalculator.piotroski_f_score(
            net_profit=100,
            roa=0.05,
            ocf=150,
            roa_prev=0.02,
            ocf_prev=80,
            long_term_debt_current=300,
            long_term_debt_prev=400,
            current_ratio=1.8,
            current_ratio_prev=1.5,
            shares_current=100,
            shares_prev=110,
            gross_margin=0.35,
            gross_margin_prev=0.30,
            asset_turnover=0.8,
            asset_turnover_prev=0.7,
        )
        assert score == 9

    def test_piotroski_f_score_partial(self):
        score = QualityCalculator.piotroski_f_score(
            net_profit=50,
            roa=0.03,
            ocf=60,
            roa_prev=None,
            ocf_prev=None,
            long_term_debt_current=500,
            long_term_debt_prev=500,
            current_ratio=1.0,
            current_ratio_prev=1.0,
            shares_current=100,
            shares_prev=100,
            gross_margin=0.25,
            gross_margin_prev=0.25,
            asset_turnover=0.5,
            asset_turnover_prev=0.5,
        )
        assert 0 <= score <= 9

    def test_piotroski_f_score_few_points(self):
        score = QualityCalculator.piotroski_f_score(
            net_profit=10,
            roa=0.01,
            ocf=5,
            roa_prev=0.02,
            ocf_prev=20,
            long_term_debt_current=600,
            long_term_debt_prev=500,
            current_ratio=0.8,
            current_ratio_prev=1.2,
            shares_current=120,
            shares_prev=100,
            gross_margin=0.2,
            gross_margin_prev=0.25,
            asset_turnover=0.4,
            asset_turnover_prev=0.5,
        )
        assert score >= 2

    def test_altman_z_score(self):
        result = QualityCalculator.altman_z_score(
            total_assets=1_000_000,
            total_liabilities=500_000,
            working_capital=200_000,
            retained_earnings=300_000,
            ebit=100_000,
            market_cap=800_000,
            total_debt=400_000,
            revenue=2_000_000,
        )
        assert result is not None
        assert result > 0

    def test_altman_z_score_zero_assets(self):
        assert QualityCalculator.altman_z_score(
            total_assets=0, total_liabilities=None, working_capital=None,
            retained_earnings=None, ebit=None, market_cap=None,
            total_debt=None, revenue=None,
        ) is None

    def test_beneish_m_score(self):
        result = QualityCalculator.beneish_m_score(
            revenue_current=2_000,
            revenue_prev=1_500,
            cogs_current=1_200,
            cogs_prev=900,
            receivables_current=300,
            receivables_prev=200,
            assets_current=3_000,
            assets_prev=2_500,
            ppe_current=1_000,
            ppe_prev=800,
            depreciation_current=100,
            depreciation_prev=80,
            sga_current=200,
            sga_prev=150,
            net_profit_current=300,
            net_profit_prev=200,
            ocf_current=350,
            ocf_prev=250,
            current_liabilities_current=500,
            current_liabilities_prev=400,
            long_term_debt_current=800,
            long_term_debt_prev=700,
        )
        assert result is not None

    def test_beneish_m_score_none_input(self):
        assert QualityCalculator.beneish_m_score(
            revenue_current=None, revenue_prev=1500, cogs_current=1200,
            cogs_prev=900, receivables_current=300, receivables_prev=200,
            assets_current=3000, assets_prev=2500, ppe_current=1000,
            ppe_prev=800, depreciation_current=100, depreciation_prev=80,
            sga_current=200, sga_prev=150, net_profit_current=300,
            net_profit_prev=200, ocf_current=350, ocf_prev=250,
            current_liabilities_current=500, current_liabilities_prev=400,
            long_term_debt_current=800, long_term_debt_prev=700,
        ) is None

    def test_financial_strength_score(self):
        score = QualityCalculator.financial_strength_score(
            current_ratio=2.5,
            quick_ratio=1.2,
            debt_equity=0.4,
            interest_coverage=8.0,
            net_debt_ebitda=0.5,
        )
        assert score > 50

    def test_financial_strength_score_poor(self):
        score = QualityCalculator.financial_strength_score(
            current_ratio=0.5,
            quick_ratio=0.3,
            debt_equity=3.0,
            interest_coverage=0.5,
            net_debt_ebitda=5.0,
        )
        assert score < 50

    def test_profitability_score_high(self):
        score = QualityCalculator.profitability_score(
            roe=0.25,
            roa=0.12,
            roic=0.18,
            net_margin=0.20,
            gross_margin=0.45,
        )
        assert score >= 80

    def test_profitability_score_low(self):
        score = QualityCalculator.profitability_score(
            roe=-0.1,
            roa=-0.05,
            roic=-0.1,
            net_margin=-0.1,
            gross_margin=0.1,
        )
        assert score < 50

    def test_growth_score_high(self):
        score = QualityCalculator.growth_score(
            revenue_growth_y=0.30,
            profit_growth_y=0.25,
            eps_growth_y=0.22,
            book_value_growth_y=0.21,
        )
        assert score >= 80

    def test_growth_score_negative(self):
        score = QualityCalculator.growth_score(
            revenue_growth_y=-0.30,
            profit_growth_y=-0.25,
            eps_growth_y=-0.15,
            book_value_growth_y=-0.05,
        )
        assert score < 50

    def test_dividend_quality_score_optimal(self):
        score = QualityCalculator.dividend_quality_score(
            payout_ratio=0.40,
            yield_pct=0.04,
            consecutive_dividends=12,
        )
        assert score >= 80

    def test_dividend_quality_score_poor(self):
        score = QualityCalculator.dividend_quality_score(
            payout_ratio=1.5,
            yield_pct=0.15,
            consecutive_dividends=0,
        )
        assert score < 50

    def test_compute_all(self):
        data = {
            "total_assets": 1_000_000,
            "total_liabilities": 500_000,
            "working_capital": 200_000,
            "equity": 300_000,
            "ebit": 100_000,
            "total_debt": 400_000,
            "revenue": 2_000_000,
            "current_ratio": 2.0,
            "quick_ratio": 1.0,
            "debt_equity": 0.5,
            "interest_coverage": 5.0,
            "net_debt_ebitda": 1.0,
            "roe": 0.20,
            "roa": 0.10,
            "roic": 0.15,
            "net_margin": 0.12,
            "gross_margin": 0.35,
            "revenue_growth_y": 0.20,
            "profit_growth_y": 0.25,
            "eps_growth_y": 0.15,
            "book_value_growth_y": 0.10,
            "payout_ratio": 0.40,
            "yield_pct": 0.03,
        }
        result = self.calc.compute_all(data, market_cap=800_000, consecutive_dividends=8)
        assert "altman_z_score" in result
        assert "beneish_m_score" in result
        assert "financial_strength_score" in result
        assert "profitability_score" in result
        assert "growth_score" in result
        assert "dividend_quality_score" in result
        assert result["altman_z_score"] is not None
        assert result["financial_strength_score"] > 50
        assert result["profitability_score"] > 50
