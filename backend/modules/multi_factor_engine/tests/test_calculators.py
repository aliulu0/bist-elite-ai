from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.multi_factor_engine.core.types import (
    FactorGroup,
    FactorName,
    FactorScore,
    ScoreStrength,
)
from modules.multi_factor_engine.factors.calculators import (
    ALL_CALCULATORS,
    BaseFactorCalculator,
    ValueFactorCalculator,
    GrowthFactorCalculator,
    QualityFactorCalculator,
    MomentumFactorCalculator,
    TrendFactorCalculator,
    RiskFactorCalculator,
    SmartMoneyFactorCalculator,
    ProfitabilityFactorCalculator,
    EfficiencyFactorCalculator,
    FinancialStrengthFactorCalculator,
    TechnicalStrengthFactorCalculator,
    LiquidityFactorCalculator,
)

EMPTY = ({}, {}, {})
EMPTY_SECTOR = None

RICH_MARKET = {
    "price": 105.0,
    "bid_ask_spread": 0.005,
    "depth_of_market": 1.5,
}
RICH_FINANCIAL = {
    "price_to_dividends": 20.0,
    "price_to_cashflow": 15.0,
    "forward_pe": 12.0,
    "peg_ratio": 1.2,
    "enterprise_value": 1000000,
    "market_cap": 900000,
    "revenue_growth": 15.0,
    "net_profit_growth": 20.0,
    "ebitda_growth": 18.0,
    "eps_growth": 12.0,
    "cash_flow_growth": 10.0,
    "roe": 18.0,
    "roa": 8.0,
    "gross_margin": 45.0,
    "operating_margin": 15.0,
    "net_margin": 10.0,
    "piotroski_score": 7,
    "altman_z": 2.5,
    "beta": 1.1,
    "asset_turnover": 1.2,
    "inventory_turnover": 6.0,
    "receivable_turnover": 8.0,
    "current_ratio": 1.8,
    "debt_to_equity": 0.5,
    "interest_coverage": 8.0,
    "free_cash_flow_yield": 0.05,
}
RICH_INDICATOR = {
    "rsi": 55.0,
    "macd_hist": 0.5,
    "adx": 28.0,
    "plus_di": 30.0,
    "minus_di": 22.0,
    "roc": 3.0,
    "relative_strength": 5.0,
    "ma20": 100.0,
    "ma50": 95.0,
    "sma20": 100.0,
    "sma50": 95.0,
    "sma200": 90.0,
    "ema12": 102.0,
    "ema26": 98.0,
    "supertrend": 98.0,
    "ichimoku_cloud": 96.0,
    "volatility": 25.0,
    "max_drawdown": -15.0,
    "obv_trend": 0.3,
    "cmf": 0.08,
    "relative_volume": 1.3,
    "institutional_accumulation": 0.6,
    "atr": 1.5,
    "bollinger_upper": 110.0,
    "bollinger_lower": 95.0,
    "vwap": 102.0,
    "market_depth": 1.5,
}
RICH_SECTOR = {"sector_pe": 15.0}


# ---------------------------------------------------------------------------
# ALL_CALCULATORS registry
# ---------------------------------------------------------------------------

class TestAllCalculatorsRegistry:
    def test_has_12_entries(self):
        assert len(ALL_CALCULATORS) == 12

    def test_all_groups_covered(self):
        for grp in FactorGroup:
            assert grp in ALL_CALCULATORS, f"Missing calculator for {grp}"

    def test_all_are_base_instances(self):
        for grp, calc in ALL_CALCULATORS.items():
            assert isinstance(calc, BaseFactorCalculator)
            assert calc.group == grp


# ---------------------------------------------------------------------------
# BaseFactorCalculator._make_score
# ---------------------------------------------------------------------------

class TestMakeScore:
    def setup_method(self):
        self.calc = ValueFactorCalculator()

    def test_make_score_clamps_above_100(self):
        fs = self.calc._make_score(FactorName.RSI, 150.0)
        assert fs.score == 100.0
        assert fs.strength == ScoreStrength.VERY_STRONG

    def test_make_score_clamps_below_0(self):
        fs = self.calc._make_score(FactorName.RSI, -10.0)
        assert fs.score == 0.0
        assert fs.strength == ScoreStrength.VERY_WEAK

    def test_make_score_in_range(self):
        fs = self.calc._make_score(FactorName.RSI, 75.0, raw_value=55.0, weight=2.0)
        assert fs.score == 75.0
        assert fs.raw_value == 55.0
        assert fs.weight == 2.0
        assert fs.strength == ScoreStrength.STRONG

    def test_make_score_default_metadata(self):
        fs = self.calc._make_score(FactorName.RSI, 50.0)
        assert fs.metadata == {}

    def test_make_score_custom_metadata(self):
        fs = self.calc._make_score(FactorName.RSI, 50.0, metadata={"src": "test"})
        assert fs.metadata["src"] == "test"


# ---------------------------------------------------------------------------
# ValueFactorCalculator
# ---------------------------------------------------------------------------

class TestValueFactorCalculator:
    def setup_method(self):
        self.calc = ValueFactorCalculator()

    def test_group(self):
        assert self.calc.group == FactorGroup.VALUE

    def test_factor_names(self):
        names = self.calc.factor_names
        assert len(names) == 6
        assert FactorName.PRICE_TO_DIVIDEND in names
        assert FactorName.SECTOR_RELATIVE_VALUATION in names

    def test_empty_data_returns_defaults(self):
        scores = self.calc.calculate({}, {}, {})
        assert len(scores) == 6
        for fs in scores:
            assert fs.score == 50.0

    def test_rich_data_returns_varied_scores(self):
        scores = self.calc.calculate(RICH_MARKET, RICH_FINANCIAL, {}, RICH_SECTOR)
        assert len(scores) == 6
        score_values = [s.score for s in scores]
        assert len(set(score_values)) > 1, "Expected varied scores"

    def test_price_to_dividends_scoring(self):
        fd = {"price_to_dividends": 5.0}
        scores = self.calc.calculate({}, fd, {})
        pd_score = next(s for s in scores if s.factor == FactorName.PRICE_TO_DIVIDEND)
        assert pd_score.score == 75.0
        assert pd_score.raw_value == 5.0

    def test_forward_pe_scoring(self):
        fd = {"forward_pe": 10.0}
        scores = self.calc.calculate({}, fd, {})
        pe_score = next(s for s in scores if s.factor == FactorName.FORWARD_PE)
        assert pe_score.raw_value == 10.0

    def test_peg_ratio_perfect(self):
        fd = {"peg_ratio": 1.0}
        scores = self.calc.calculate({}, fd, {})
        peg = next(s for s in scores if s.factor == FactorName.PEG)
        assert peg.score == 100.0

    def test_enterprise_value_ratio(self):
        fd = {"enterprise_value": 1000000, "market_cap": 1000000}
        scores = self.calc.calculate({}, fd, {})
        ev = next(s for s in scores if s.factor == FactorName.ENTERPRISE_VALUE)
        assert ev.score == 100.0

    def test_sector_relative_valuation(self):
        fd = {"forward_pe": 15.0}
        sd = {"sector_pe": 15.0}
        scores = self.calc.calculate({}, fd, {}, sd)
        srv = next(s for s in scores if s.factor == FactorName.SECTOR_RELATIVE_VALUATION)
        assert srv.score == 100.0


# ---------------------------------------------------------------------------
# GrowthFactorCalculator
# ---------------------------------------------------------------------------

class TestGrowthFactorCalculator:
    def setup_method(self):
        self.calc = GrowthFactorCalculator()

    def test_group(self):
        assert self.calc.group == FactorGroup.GROWTH

    def test_factor_names_count(self):
        assert len(self.calc.factor_names) == 5

    def test_empty_data_returns_defaults(self):
        scores = self.calc.calculate({}, {}, {})
        assert len(scores) == 5
        for fs in scores:
            assert fs.score == 50.0

    def test_positive_growth(self):
        fd = {"revenue_growth": 15.0}
        scores = self.calc.calculate({}, fd, {})
        rg = next(s for s in scores if s.factor == FactorName.REVENUE_GROWTH)
        assert rg.score == 80.0

    def test_negative_growth(self):
        fd = {"revenue_growth": -10.0}
        scores = self.calc.calculate({}, fd, {})
        rg = next(s for s in scores if s.factor == FactorName.REVENUE_GROWTH)
        assert rg.score == 30.0

    def test_all_growth_fields(self):
        scores = self.calc.calculate({}, RICH_FINANCIAL, {})
        assert len(scores) == 5
        for fs in scores:
            assert fs.raw_value is not None


# ---------------------------------------------------------------------------
# QualityFactorCalculator
# ---------------------------------------------------------------------------

class TestQualityFactorCalculator:
    def setup_method(self):
        self.calc = QualityFactorCalculator()

    def test_group(self):
        assert self.calc.group == FactorGroup.QUALITY

    def test_factor_names_count(self):
        assert len(self.calc.factor_names) == 7

    def test_empty_data_returns_defaults(self):
        scores = self.calc.calculate({}, {}, {})
        assert len(scores) == 7
        for fs in scores:
            assert fs.score == 50.0

    def test_roe_positive(self):
        fd = {"roe": 20.0}
        scores = self.calc.calculate({}, fd, {})
        roe = next(s for s in scores if s.factor == FactorName.ROE)
        assert roe.score == 60.0

    def test_roa_scoring(self):
        fd = {"roa": 10.0}
        scores = self.calc.calculate({}, fd, {})
        roa = next(s for s in scores if s.factor == FactorName.ROA)
        assert roa.score == 50.0

    def test_altman_z_safe(self):
        fd = {"altman_z": 3.5}
        scores = self.calc.calculate({}, fd, {})
        az = next(s for s in scores if s.factor == FactorName.ALTMAN_Z)
        assert az.score == 80.0

    def test_altman_z_caution(self):
        fd = {"altman_z": 2.0}
        scores = self.calc.calculate({}, fd, {})
        az = next(s for s in scores if s.factor == FactorName.ALTMAN_Z)
        assert az.score == 55.0

    def test_altman_z_danger(self):
        fd = {"altman_z": 1.5}
        scores = self.calc.calculate({}, fd, {})
        az = next(s for s in scores if s.factor == FactorName.ALTMAN_Z)
        assert az.score == 25.0

    def test_piotroski_score(self):
        fd = {"piotroski_score": 9}
        scores = self.calc.calculate({}, fd, {})
        ps = next(s for s in scores if s.factor == FactorName.PIOTROSKI_SCORE)
        assert ps.score == 100.0

    def test_gross_margin(self):
        fd = {"gross_margin": 60.0}
        scores = self.calc.calculate({}, fd, {})
        gm = next(s for s in scores if s.factor == FactorName.GROSS_MARGIN)
        assert gm.score == 60.0


# ---------------------------------------------------------------------------
# MomentumFactorCalculator
# ---------------------------------------------------------------------------

class TestMomentumFactorCalculator:
    def setup_method(self):
        self.calc = MomentumFactorCalculator()

    def test_group(self):
        assert self.calc.group == FactorGroup.MOMENTUM

    def test_factor_names_count(self):
        assert len(self.calc.factor_names) == 5

    def test_empty_data_returns_defaults(self):
        scores = self.calc.calculate({}, {}, {})
        assert len(scores) == 5
        for fs in scores:
            assert fs.score == 50.0

    def test_rsi_overbought(self):
        ind = {"rsi": 75.0}
        scores = self.calc.calculate({}, {}, ind)
        rsi = next(s for s in scores if s.factor == FactorName.RSI)
        assert rsi.score == 85.0

    def test_rsi_bullish_zone(self):
        ind = {"rsi": 55.0}
        scores = self.calc.calculate({}, {}, ind)
        rsi = next(s for s in scores if s.factor == FactorName.RSI)
        assert rsi.score == 70.0

    def test_rsi_bearish_zone(self):
        ind = {"rsi": 35.0}
        scores = self.calc.calculate({}, {}, ind)
        rsi = next(s for s in scores if s.factor == FactorName.RSI)
        assert rsi.score == 75.0

    def test_rsi_oversold(self):
        ind = {"rsi": 20.0}
        scores = self.calc.calculate({}, {}, ind)
        rsi = next(s for s in scores if s.factor == FactorName.RSI)
        assert rsi.score == 25.0

    def test_macd_positive(self):
        ind = {"macd_hist": 0.5}
        scores = self.calc.calculate({}, {}, ind)
        macd = next(s for s in scores if s.factor == FactorName.MACD)
        assert macd.score == 55.0

    def test_adx_bullish(self):
        ind = {"adx": 30.0, "plus_di": 35.0, "minus_di": 20.0}
        scores = self.calc.calculate({}, {}, ind)
        adx = next(s for s in scores if s.factor == FactorName.ADX)
        assert adx.score > 50.0

    def test_roc_positive(self):
        ind = {"roc": 5.0}
        scores = self.calc.calculate({}, {}, ind)
        roc = next(s for s in scores if s.factor == FactorName.ROC)
        assert roc.score == 75.0


# ---------------------------------------------------------------------------
# TrendFactorCalculator
# ---------------------------------------------------------------------------

class TestTrendFactorCalculator:
    def setup_method(self):
        self.calc = TrendFactorCalculator()

    def test_group(self):
        assert self.calc.group == FactorGroup.TREND

    def test_factor_names_count(self):
        assert len(self.calc.factor_names) == 5

    def test_empty_data_returns_defaults(self):
        scores = self.calc.calculate({}, {}, {})
        assert len(scores) == 5
        for fs in scores:
            assert fs.score == 50.0

    def test_sma_bullish_alignment(self):
        md = {"price": 105.0}
        ind = {"sma20": 100.0, "sma50": 95.0, "sma200": 90.0}
        scores = self.calc.calculate(md, {}, ind)
        sma = next(s for s in scores if s.factor == FactorName.SMA_SIGNAL)
        assert sma.score == 95.0

    def test_ema_bullish(self):
        ind = {"ema12": 105.0, "ema26": 100.0}
        scores = self.calc.calculate({}, {}, ind)
        ema = next(s for s in scores if s.factor == FactorName.EMA_SIGNAL)
        assert ema.score > 50.0

    def test_golden_cross_active(self):
        ind = {"sma50": 100.0, "sma200": 90.0}
        scores = self.calc.calculate({}, {}, ind)
        gc = next(s for s in scores if s.factor == FactorName.GOLDEN_CROSS)
        assert gc.score == 75.0

    def test_golden_cross_absent(self):
        ind = {"sma50": 80.0, "sma200": 90.0}
        scores = self.calc.calculate({}, {}, ind)
        gc = next(s for s in scores if s.factor == FactorName.GOLDEN_CROSS)
        assert gc.score == 25.0

    def test_supertrend_above(self):
        md = {"price": 105.0}
        ind = {"supertrend": 98.0}
        scores = self.calc.calculate(md, {}, ind)
        st = next(s for s in scores if s.factor == FactorName.SUPERTREND)
        assert st.score == 70.0

    def test_supertrend_below(self):
        md = {"price": 95.0}
        ind = {"supertrend": 100.0}
        scores = self.calc.calculate(md, {}, ind)
        st = next(s for s in scores if s.factor == FactorName.SUPERTREND)
        assert st.score == 30.0

    def test_ichimoku_above_cloud(self):
        md = {"price": 105.0}
        ind = {"ichimoku_cloud": 96.0}
        scores = self.calc.calculate(md, {}, ind)
        ic = next(s for s in scores if s.factor == FactorName.ICHIMOKU)
        assert ic.score == 75.0

    def test_ichimoku_below_cloud(self):
        md = {"price": 90.0}
        ind = {"ichimoku_cloud": 96.0}
        scores = self.calc.calculate(md, {}, ind)
        ic = next(s for s in scores if s.factor == FactorName.ICHIMOKU)
        assert ic.score == 25.0


# ---------------------------------------------------------------------------
# RiskFactorCalculator
# ---------------------------------------------------------------------------

class TestRiskFactorCalculator:
    def setup_method(self):
        self.calc = RiskFactorCalculator()

    def test_group(self):
        assert self.calc.group == FactorGroup.RISK

    def test_factor_names_count(self):
        assert len(self.calc.factor_names) == 4

    def test_empty_data_returns_defaults(self):
        scores = self.calc.calculate({}, {}, {})
        assert len(scores) == 4
        for fs in scores:
            assert fs.score == 50.0

    def test_low_volatility(self):
        ind = {"volatility": 10.0}
        scores = self.calc.calculate({}, {}, ind)
        vol = next(s for s in scores if s.factor == FactorName.VOLATILITY)
        assert vol.score == 70.0

    def test_high_volatility(self):
        ind = {"volatility": 40.0}
        scores = self.calc.calculate({}, {}, ind)
        vol = next(s for s in scores if s.factor == FactorName.VOLATILITY)
        assert vol.score == 0.0

    def test_beta_neutral(self):
        fd = {"beta": 1.0}
        scores = self.calc.calculate({}, fd, {})
        beta = next(s for s in scores if s.factor == FactorName.BETA)
        assert beta.score == 100.0

    def test_beta_high(self):
        fd = {"beta": 1.5}
        scores = self.calc.calculate({}, fd, {})
        beta = next(s for s in scores if s.factor == FactorName.BETA)
        assert beta.score == 85.0

    def test_max_drawdown(self):
        ind = {"max_drawdown": -20.0}
        scores = self.calc.calculate({}, {}, ind)
        dd = next(s for s in scores if s.factor == FactorName.MAX_DRAWDOWN)
        assert dd.score == 60.0

    def test_liquidity_risk_tight_spread(self):
        md = {"bid_ask_spread": 0.001}
        scores = self.calc.calculate(md, {}, {})
        lr = next(s for s in scores if s.factor == FactorName.LIQUIDITY_RISK)
        assert lr.score == 99.0


# ---------------------------------------------------------------------------
# SmartMoneyFactorCalculator
# ---------------------------------------------------------------------------

class TestSmartMoneyFactorCalculator:
    def setup_method(self):
        self.calc = SmartMoneyFactorCalculator()

    def test_group(self):
        assert self.calc.group == FactorGroup.SMART_MONEY

    def test_factor_names_count(self):
        assert len(self.calc.factor_names) == 5

    def test_empty_data_returns_defaults(self):
        scores = self.calc.calculate({}, {}, {})
        assert len(scores) == 5
        for fs in scores:
            assert fs.score == 50.0

    def test_obv_trend_positive(self):
        ind = {"obv_trend": 0.5}
        scores = self.calc.calculate({}, {}, ind)
        obv = next(s for s in scores if s.factor == FactorName.OBV)
        assert obv.score == 60.0

    def test_cmf_positive(self):
        ind = {"cmf": 0.15}
        scores = self.calc.calculate({}, {}, ind)
        cmf = next(s for s in scores if s.factor == FactorName.CMF)
        assert cmf.score == 65.0

    def test_relative_volume_high(self):
        ind = {"relative_volume": 2.0}
        scores = self.calc.calculate({}, {}, ind)
        rv = next(s for s in scores if s.factor == FactorName.RELATIVE_VOLUME)
        assert rv.score == 75.0

    def test_relative_volume_low(self):
        ind = {"relative_volume": 0.3}
        scores = self.calc.calculate({}, {}, ind)
        rv = next(s for s in scores if s.factor == FactorName.RELATIVE_VOLUME)
        assert rv.score == 30.0

    def test_institutional_accumulation(self):
        ind = {"institutional_accumulation": 0.8}
        scores = self.calc.calculate({}, {}, ind)
        ia = next(s for s in scores if s.factor == FactorName.INSTITUTIONAL_ACCUMULATION)
        assert ia.score == 80.0


# ---------------------------------------------------------------------------
# ProfitabilityFactorCalculator
# ---------------------------------------------------------------------------

class TestProfitabilityFactorCalculator:
    def setup_method(self):
        self.calc = ProfitabilityFactorCalculator()

    def test_group(self):
        assert self.calc.group == FactorGroup.PROFITABILITY

    def test_factor_names_count(self):
        assert len(self.calc.factor_names) == 5

    def test_empty_data_returns_defaults(self):
        scores = self.calc.calculate({}, {}, {})
        assert len(scores) == 5
        for fs in scores:
            assert fs.score == 50.0

    def test_gross_margin(self):
        fd = {"gross_margin": 50.0}
        scores = self.calc.calculate({}, fd, {})
        gpm = next(s for s in scores if s.factor == FactorName.GROSS_PROFIT_MARGIN)
        assert gpm.score == 50.0

    def test_roe_positive(self):
        fd = {"roe": 20.0}
        scores = self.calc.calculate({}, fd, {})
        roe = next(s for s in scores if s.factor == FactorName.ROE)
        assert roe.score == 60.0

    def test_operating_profitability(self):
        fd = {"operating_margin": 15.0}
        scores = self.calc.calculate({}, fd, {})
        op = next(s for s in scores if s.factor == FactorName.OPERATING_PROFITABILITY)
        assert op.score == 80.0


# ---------------------------------------------------------------------------
# EfficiencyFactorCalculator
# ---------------------------------------------------------------------------

class TestEfficiencyFactorCalculator:
    def setup_method(self):
        self.calc = EfficiencyFactorCalculator()

    def test_group(self):
        assert self.calc.group == FactorGroup.EFFICIENCY

    def test_factor_names_count(self):
        assert len(self.calc.factor_names) == 3

    def test_empty_data_returns_defaults(self):
        scores = self.calc.calculate({}, {}, {})
        assert len(scores) == 3
        for fs in scores:
            assert fs.score == 50.0

    def test_asset_turnover(self):
        fd = {"asset_turnover": 1.5}
        scores = self.calc.calculate({}, fd, {})
        at = next(s for s in scores if s.factor == FactorName.ASSET_TURNOVER)
        assert at.score == 45.0

    def test_inventory_turnover(self):
        fd = {"inventory_turnover": 10.0}
        scores = self.calc.calculate({}, fd, {})
        it = next(s for s in scores if s.factor == FactorName.INVENTORY_TURNOVER)
        assert it.score == 50.0

    def test_receivable_turnover(self):
        fd = {"receivable_turnover": 8.0}
        scores = self.calc.calculate({}, fd, {})
        rt = next(s for s in scores if s.factor == FactorName.RECEIVABLE_TURNOVER)
        assert rt.score == 24.0


# ---------------------------------------------------------------------------
# FinancialStrengthFactorCalculator
# ---------------------------------------------------------------------------

class TestFinancialStrengthFactorCalculator:
    def setup_method(self):
        self.calc = FinancialStrengthFactorCalculator()

    def test_group(self):
        assert self.calc.group == FactorGroup.FINANCIAL_STRENGTH

    def test_factor_names_count(self):
        assert len(self.calc.factor_names) == 4

    def test_empty_data_returns_defaults(self):
        scores = self.calc.calculate({}, {}, {})
        assert len(scores) == 4
        for fs in scores:
            assert fs.score == 50.0

    def test_current_ratio_high(self):
        fd = {"current_ratio": 2.5}
        scores = self.calc.calculate({}, fd, {})
        cr = next(s for s in scores if s.factor == FactorName.CURRENT_RATIO)
        assert cr.score == 85.0

    def test_current_ratio_medium(self):
        fd = {"current_ratio": 1.7}
        scores = self.calc.calculate({}, fd, {})
        cr = next(s for s in scores if s.factor == FactorName.CURRENT_RATIO)
        assert cr.score == 70.0

    def test_current_ratio_low(self):
        fd = {"current_ratio": 0.3}
        scores = self.calc.calculate({}, fd, {})
        cr = next(s for s in scores if s.factor == FactorName.CURRENT_RATIO)
        assert cr.score == 15.0

    def test_debt_to_equity(self):
        fd = {"debt_to_equity": 0.5}
        scores = self.calc.calculate({}, fd, {})
        de = next(s for s in scores if s.factor == FactorName.DEBT_TO_EQUITY)
        assert de.score == 90.0

    def test_interest_coverage_high(self):
        fd = {"interest_coverage": 12.0}
        scores = self.calc.calculate({}, fd, {})
        ic = next(s for s in scores if s.factor == FactorName.INTEREST_COVERAGE)
        assert ic.score == 90.0

    def test_interest_coverage_low(self):
        fd = {"interest_coverage": 1.0}
        scores = self.calc.calculate({}, fd, {})
        ic = next(s for s in scores if s.factor == FactorName.INTEREST_COVERAGE)
        assert ic.score == 25.0

    def test_fcf_yield(self):
        fd = {"free_cash_flow_yield": 0.08}
        scores = self.calc.calculate({}, fd, {})
        fcf = next(s for s in scores if s.factor == FactorName.FREE_CASH_FLOW_YIELD)
        assert fcf.score == 50.8


# ---------------------------------------------------------------------------
# TechnicalStrengthFactorCalculator
# ---------------------------------------------------------------------------

class TestTechnicalStrengthFactorCalculator:
    def setup_method(self):
        self.calc = TechnicalStrengthFactorCalculator()

    def test_group(self):
        assert self.calc.group == FactorGroup.TECHNICAL_STRENGTH

    def test_factor_names_count(self):
        assert len(self.calc.factor_names) == 7

    def test_empty_data_returns_defaults(self):
        scores = self.calc.calculate({}, {}, {})
        assert len(scores) == 7
        for fs in scores:
            assert fs.score == 50.0

    def test_rsi_scoring(self):
        ind = {"rsi": 55.0}
        scores = self.calc.calculate({}, {}, ind)
        rsi = next(s for s in scores if s.factor == FactorName.RSI)
        assert rsi.score == 70.0

    def test_atr_strength_low_vol(self):
        md = {"price": 100.0}
        ind = {"atr": 0.5}
        scores = self.calc.calculate(md, {}, ind)
        atr = next(s for s in scores if s.factor == FactorName.ATR_STRENGTH)
        assert atr.score == 75.0

    def test_bollinger_strength(self):
        md = {"price": 105.0}
        ind = {"bollinger_upper": 110.0, "bollinger_lower": 90.0}
        scores = self.calc.calculate(md, {}, ind)
        bb = next(s for s in scores if s.factor == FactorName.BOLLINGER_STRENGTH)
        assert bb.score == 75.0

    def test_vwap_above(self):
        md = {"price": 105.0}
        ind = {"vwap": 100.0}
        scores = self.calc.calculate(md, {}, ind)
        vw = next(s for s in scores if s.factor == FactorName.VWAP_STRENGTH)
        assert vw.score > 50.0


# ---------------------------------------------------------------------------
# LiquidityFactorCalculator
# ---------------------------------------------------------------------------

class TestLiquidityFactorCalculator:
    def setup_method(self):
        self.calc = LiquidityFactorCalculator()

    def test_group(self):
        assert self.calc.group == FactorGroup.LIQUIDITY

    def test_factor_names_count(self):
        assert len(self.calc.factor_names) == 4

    def test_empty_data_returns_defaults(self):
        scores = self.calc.calculate({}, {}, {})
        assert len(scores) == 4
        for fs in scores:
            assert fs.score == 50.0

    def test_depth_of_market(self):
        md = {"depth_of_market": 2.0}
        scores = self.calc.calculate(md, {}, {})
        dom = next(s for s in scores if s.factor == FactorName.DEPTH_OF_MARKET)
        assert dom.score == 60.0

    def test_bid_ask_spread_tight(self):
        md = {"bid_ask_spread": 0.001}
        scores = self.calc.calculate(md, {}, {})
        bas = next(s for s in scores if s.factor == FactorName.BID_ASK_SPREAD)
        assert bas.score == 99.0

    def test_relative_volume_from_indicator(self):
        ind = {"relative_volume": 1.8}
        scores = self.calc.calculate({}, {}, ind)
        rv = next(s for s in scores if s.factor == FactorName.RELATIVE_VOLUME)
        assert rv.score == 75.0

    def test_liquidity_risk_from_spread(self):
        md = {"bid_ask_spread": 0.005}
        scores = self.calc.calculate(md, {}, {})
        lr = next(s for s in scores if s.factor == FactorName.LIQUIDITY_RISK)
        assert lr.score == 95.0


# ---------------------------------------------------------------------------
# Rich data integration across all calculators
# ---------------------------------------------------------------------------

class TestRichDataIntegration:
    @pytest.mark.parametrize("group,calc", list(ALL_CALCULATORS.items()))
    def test_rich_data_returns_non_default_scores(self, group, calc):
        scores = calc.calculate(RICH_MARKET, RICH_FINANCIAL, RICH_INDICATOR, RICH_SECTOR)
        assert len(scores) > 0
        for fs in scores:
            assert 0.0 <= fs.score <= 100.0

    @pytest.mark.parametrize("group,calc", list(ALL_CALCULATORS.items()))
    def test_empty_data_all_defaults(self, group, calc):
        scores = calc.calculate({}, {}, {})
        for fs in scores:
            assert fs.score == 50.0
