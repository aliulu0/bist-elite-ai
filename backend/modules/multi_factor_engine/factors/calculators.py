from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from modules.multi_factor_engine.core.types import (
    FactorGroup,
    FactorName,
    FactorScore,
    ScoreStrength,
    _clamp,
    _mean,
    score_to_strength,
)


class BaseFactorCalculator(ABC):
    @property
    @abstractmethod
    def group(self) -> FactorGroup:
        ...

    @property
    @abstractmethod
    def factor_names(self) -> List[FactorName]:
        ...

    @abstractmethod
    def calculate(
        self,
        market_data: Dict[str, Any],
        financial_data: Dict[str, Any],
        indicator_data: Dict[str, Any],
        sector_data: Optional[Dict[str, Any]] = None,
    ) -> List[FactorScore]:
        ...

    def _make_score(
        self,
        factor: FactorName,
        score: float,
        raw_value: Optional[float] = None,
        normalized_value: Optional[float] = None,
        weight: float = 1.0,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> FactorScore:
        clamped = _clamp(score)
        return FactorScore(
            factor=factor,
            score=clamped,
            weight=weight,
            strength=score_to_strength(clamped),
            raw_value=raw_value,
            normalized_value=normalized_value,
            metadata=metadata or {},
        )


class ValueFactorCalculator(BaseFactorCalculator):
    @property
    def group(self) -> FactorGroup:
        return FactorGroup.VALUE

    @property
    def factor_names(self) -> List[FactorName]:
        return [
            FactorName.PRICE_TO_DIVIDEND,
            FactorName.PRICE_TO_CASHFLOW,
            FactorName.FORWARD_PE,
            FactorName.PEG,
            FactorName.ENTERPRISE_VALUE,
            FactorName.SECTOR_RELATIVE_VALUATION,
        ]

    def calculate(
        self,
        market_data: Dict[str, Any],
        financial_data: Dict[str, Any],
        indicator_data: Dict[str, Any],
        sector_data: Optional[Dict[str, Any]] = None,
    ) -> List[FactorScore]:
        scores: List[FactorScore] = []

        pd = financial_data.get("price_to_dividends")
        if pd is not None and pd > 0:
            s = _clamp(100 - min(pd * 5, 100))
            scores.append(self._make_score(FactorName.PRICE_TO_DIVIDEND, s, raw_value=pd))
        else:
            scores.append(self._make_score(FactorName.PRICE_TO_DIVIDEND, 50.0))

        pcf = financial_data.get("price_to_cashflow")
        if pcf is not None and pcf > 0:
            s = _clamp(100 - min(pcf * 3, 100))
            scores.append(self._make_score(FactorName.PRICE_TO_CASHFLOW, s, raw_value=pcf))
        else:
            scores.append(self._make_score(FactorName.PRICE_TO_CASHFLOW, 50.0))

        fpe = financial_data.get("forward_pe")
        if fpe is not None and fpe > 0:
            s = _clamp(100 - min(fpe * 2, 100))
            scores.append(self._make_score(FactorName.FORWARD_PE, s, raw_value=fpe))
        else:
            scores.append(self._make_score(FactorName.FORWARD_PE, 50.0))

        peg = financial_data.get("peg_ratio")
        if peg is not None and peg > 0:
            s = _clamp(100 - abs(peg - 1.0) * 40)
            scores.append(self._make_score(FactorName.PEG, s, raw_value=peg))
        else:
            scores.append(self._make_score(FactorName.PEG, 50.0))

        ev = financial_data.get("enterprise_value")
        market_cap = financial_data.get("market_cap")
        if ev is not None and market_cap is not None and market_cap > 0:
            ratio = ev / market_cap
            s = _clamp(100 - abs(ratio - 1.0) * 50)
            scores.append(self._make_score(FactorName.ENTERPRISE_VALUE, s, raw_value=ev))
        else:
            scores.append(self._make_score(FactorName.ENTERPRISE_VALUE, 50.0))

        sector_pe = sector_data.get("sector_pe") if sector_data else None
        stock_pe = financial_data.get("forward_pe")
        if sector_pe and stock_pe and stock_pe > 0:
            ratio = stock_pe / sector_pe
            s = _clamp(100 - abs(ratio - 1.0) * 60)
            scores.append(self._make_score(FactorName.SECTOR_RELATIVE_VALUATION, s, raw_value=ratio))
        else:
            scores.append(self._make_score(FactorName.SECTOR_RELATIVE_VALUATION, 50.0))

        return scores


class GrowthFactorCalculator(BaseFactorCalculator):
    @property
    def group(self) -> FactorGroup:
        return FactorGroup.GROWTH

    @property
    def factor_names(self) -> List[FactorName]:
        return [
            FactorName.REVENUE_GROWTH,
            FactorName.NET_PROFIT_GROWTH,
            FactorName.EBITDA_GROWTH,
            FactorName.EPS_GROWTH,
            FactorName.CASH_FLOW_GROWTH,
        ]

    def calculate(
        self,
        market_data: Dict[str, Any],
        financial_data: Dict[str, Any],
        indicator_data: Dict[str, Any],
        sector_data: Optional[Dict[str, Any]] = None,
    ) -> List[FactorScore]:
        growth_fields = [
            (FactorName.REVENUE_GROWTH, "revenue_growth"),
            (FactorName.NET_PROFIT_GROWTH, "net_profit_growth"),
            (FactorName.EBITDA_GROWTH, "ebitda_growth"),
            (FactorName.EPS_GROWTH, "eps_growth"),
            (FactorName.CASH_FLOW_GROWTH, "cash_flow_growth"),
        ]
        scores: List[FactorScore] = []
        for fname, key in growth_fields:
            val = financial_data.get(key)
            if val is not None:
                s = _clamp(50 + val * 2)
                scores.append(self._make_score(fname, s, raw_value=val))
            else:
                scores.append(self._make_score(fname, 50.0))
        return scores


class QualityFactorCalculator(BaseFactorCalculator):
    @property
    def group(self) -> FactorGroup:
        return FactorGroup.QUALITY

    @property
    def factor_names(self) -> List[FactorName]:
        return [
            FactorName.ROE,
            FactorName.ROA,
            FactorName.GROSS_MARGIN,
            FactorName.OPERATING_MARGIN,
            FactorName.NET_MARGIN,
            FactorName.PIOTROSKI_SCORE,
            FactorName.ALTMAN_Z,
        ]

    def calculate(
        self,
        market_data: Dict[str, Any],
        financial_data: Dict[str, Any],
        indicator_data: Dict[str, Any],
        sector_data: Optional[Dict[str, Any]] = None,
    ) -> List[FactorScore]:
        scores: List[FactorScore] = []

        roe = financial_data.get("roe")
        if roe is not None:
            s = _clamp(roe * 3 if roe > 0 else 50 + roe * 2)
            scores.append(self._make_score(FactorName.ROE, s, raw_value=roe))
        else:
            scores.append(self._make_score(FactorName.ROE, 50.0))

        roa = financial_data.get("roa")
        if roa is not None:
            s = _clamp(roa * 5 if roa > 0 else 50 + roa * 3)
            scores.append(self._make_score(FactorName.ROA, s, raw_value=roa))
        else:
            scores.append(self._make_score(FactorName.ROA, 50.0))

        gm = financial_data.get("gross_margin")
        if gm is not None:
            s = _clamp(gm)
            scores.append(self._make_score(FactorName.GROSS_MARGIN, s, raw_value=gm))
        else:
            scores.append(self._make_score(FactorName.GROSS_MARGIN, 50.0))

        om = financial_data.get("operating_margin")
        if om is not None:
            s = _clamp(50 + om * 2)
            scores.append(self._make_score(FactorName.OPERATING_MARGIN, s, raw_value=om))
        else:
            scores.append(self._make_score(FactorName.OPERATING_MARGIN, 50.0))

        nm = financial_data.get("net_margin")
        if nm is not None:
            s = _clamp(50 + nm * 2)
            scores.append(self._make_score(FactorName.NET_MARGIN, s, raw_value=nm))
        else:
            scores.append(self._make_score(FactorName.NET_MARGIN, 50.0))

        ps = financial_data.get("piotroski_score")
        if ps is not None:
            s = _clamp(ps / 9 * 100)
            scores.append(self._make_score(FactorName.PIOTROSKI_SCORE, s, raw_value=ps))
        else:
            scores.append(self._make_score(FactorName.PIOTROSKI_SCORE, 50.0))

        az = financial_data.get("altman_z")
        if az is not None:
            if az > 2.99:
                s = 80.0
            elif az > 1.81:
                s = 55.0
            else:
                s = 25.0
            scores.append(self._make_score(FactorName.ALTMAN_Z, s, raw_value=az))
        else:
            scores.append(self._make_score(FactorName.ALTMAN_Z, 50.0))

        return scores


class MomentumFactorCalculator(BaseFactorCalculator):
    @property
    def group(self) -> FactorGroup:
        return FactorGroup.MOMENTUM

    @property
    def factor_names(self) -> List[FactorName]:
        return [
            FactorName.RSI,
            FactorName.MACD,
            FactorName.ADX,
            FactorName.ROC,
            FactorName.RELATIVE_STRENGTH,
        ]

    def calculate(
        self,
        market_data: Dict[str, Any],
        financial_data: Dict[str, Any],
        indicator_data: Dict[str, Any],
        sector_data: Optional[Dict[str, Any]] = None,
    ) -> List[FactorScore]:
        scores: List[FactorScore] = []

        rsi = indicator_data.get("rsi")
        if rsi is not None:
            if rsi > 70:
                s = 85.0
            elif rsi > 50:
                s = 65.0 + (rsi - 50)
            elif rsi > 30:
                s = 40.0 + rsi
            else:
                s = 25.0
            scores.append(self._make_score(FactorName.RSI, s, raw_value=rsi))
        else:
            scores.append(self._make_score(FactorName.RSI, 50.0))

        macd = indicator_data.get("macd_hist") or indicator_data.get("macd")
        if macd is not None:
            s = _clamp(50 + macd * 10)
            scores.append(self._make_score(FactorName.MACD, s, raw_value=macd))
        else:
            scores.append(self._make_score(FactorName.MACD, 50.0))

        adx = indicator_data.get("adx")
        if adx is not None:
            plus_di = indicator_data.get("plus_di", 25)
            minus_di = indicator_data.get("minus_di", 25)
            trend_strength = adx / 100
            direction = 1.0 if plus_di > minus_di else -1.0
            s = _clamp(50 + direction * trend_strength * 40)
            scores.append(self._make_score(FactorName.ADX, s, raw_value=adx))
        else:
            scores.append(self._make_score(FactorName.ADX, 50.0))

        roc = indicator_data.get("roc")
        if roc is not None:
            s = _clamp(50 + roc * 5)
            scores.append(self._make_score(FactorName.ROC, s, raw_value=roc))
        else:
            scores.append(self._make_score(FactorName.ROC, 50.0))

        rs = indicator_data.get("relative_strength") or market_data.get("relative_strength")
        if rs is not None:
            s = _clamp(50 + rs * 2)
            scores.append(self._make_score(FactorName.RELATIVE_STRENGTH, s, raw_value=rs))
        else:
            scores.append(self._make_score(FactorName.RELATIVE_STRENGTH, 50.0))

        return scores


class TrendFactorCalculator(BaseFactorCalculator):
    @property
    def group(self) -> FactorGroup:
        return FactorGroup.TREND

    @property
    def factor_names(self) -> List[FactorName]:
        return [
            FactorName.SMA_SIGNAL,
            FactorName.EMA_SIGNAL,
            FactorName.GOLDEN_CROSS,
            FactorName.SUPERTREND,
            FactorName.ICHIMOKU,
        ]

    def calculate(
        self,
        market_data: Dict[str, Any],
        financial_data: Dict[str, Any],
        indicator_data: Dict[str, Any],
        sector_data: Optional[Dict[str, Any]] = None,
    ) -> List[FactorScore]:
        scores: List[FactorScore] = []
        price = market_data.get("price", 0)

        sma20 = indicator_data.get("sma20") or indicator_data.get("ma20")
        sma50 = indicator_data.get("sma50") or indicator_data.get("ma50")
        sma200 = indicator_data.get("sma200") or indicator_data.get("ma200")

        if sma20 and sma50 and sma200 and price:
            above_count = sum([price > sma20, sma20 > sma50, sma50 > sma200])
            s = _clamp(20 + above_count * 25)
            scores.append(self._make_score(FactorName.SMA_SIGNAL, s, raw_value=float(above_count)))
        else:
            scores.append(self._make_score(FactorName.SMA_SIGNAL, 50.0))

        ema12 = indicator_data.get("ema12")
        ema26 = indicator_data.get("ema26")
        if ema12 and ema26:
            diff_pct = (ema12 - ema26) / ema26 * 100 if ema26 != 0 else 0
            s = _clamp(50 + diff_pct * 10)
            scores.append(self._make_score(FactorName.EMA_SIGNAL, s, raw_value=diff_pct))
        else:
            scores.append(self._make_score(FactorName.EMA_SIGNAL, 50.0))

        if sma50 and sma200:
            golden = sma50 > sma200
            s = 75.0 if golden else 25.0
            scores.append(self._make_score(FactorName.GOLDEN_CROSS, s, raw_value=1.0 if golden else 0.0))
        else:
            scores.append(self._make_score(FactorName.GOLDEN_CROSS, 50.0))

        st = indicator_data.get("supertrend")
        if st is not None:
            above = price > st if price else True
            s = 70.0 if above else 30.0
            scores.append(self._make_score(FactorName.SUPERTREND, s, raw_value=st))
        else:
            scores.append(self._make_score(FactorName.SUPERTREND, 50.0))

        ichimoku = indicator_data.get("ichimoku_cloud")
        if ichimoku is not None:
            above_cloud = price > ichimoku if price else True
            s = 75.0 if above_cloud else 25.0
            scores.append(self._make_score(FactorName.ICHIMOKU, s, raw_value=ichimoku))
        else:
            scores.append(self._make_score(FactorName.ICHIMOKU, 50.0))

        return scores


class RiskFactorCalculator(BaseFactorCalculator):
    @property
    def group(self) -> FactorGroup:
        return FactorGroup.RISK

    @property
    def factor_names(self) -> List[FactorName]:
        return [
            FactorName.VOLATILITY,
            FactorName.BETA,
            FactorName.MAX_DRAWDOWN,
            FactorName.LIQUIDITY_RISK,
        ]

    def calculate(
        self,
        market_data: Dict[str, Any],
        financial_data: Dict[str, Any],
        indicator_data: Dict[str, Any],
        sector_data: Optional[Dict[str, Any]] = None,
    ) -> List[FactorScore]:
        scores: List[FactorScore] = []

        vol = indicator_data.get("volatility") or market_data.get("volatility")
        if vol is not None:
            s = _clamp(100 - vol * 3)
            scores.append(self._make_score(FactorName.VOLATILITY, s, raw_value=vol))
        else:
            scores.append(self._make_score(FactorName.VOLATILITY, 50.0))

        beta = financial_data.get("beta")
        if beta is not None:
            s = _clamp(100 - abs(beta - 1.0) * 30)
            scores.append(self._make_score(FactorName.BETA, s, raw_value=beta))
        else:
            scores.append(self._make_score(FactorName.BETA, 50.0))

        dd = indicator_data.get("max_drawdown")
        if dd is not None:
            s = _clamp(100 + dd * 2)
            scores.append(self._make_score(FactorName.MAX_DRAWDOWN, s, raw_value=dd))
        else:
            scores.append(self._make_score(FactorName.MAX_DRAWDOWN, 50.0))

        spread = market_data.get("bid_ask_spread")
        if spread is not None:
            s = _clamp(100 - spread * 1000)
            scores.append(self._make_score(FactorName.LIQUIDITY_RISK, s, raw_value=spread))
        else:
            scores.append(self._make_score(FactorName.LIQUIDITY_RISK, 50.0))

        return scores


class SmartMoneyFactorCalculator(BaseFactorCalculator):
    @property
    def group(self) -> FactorGroup:
        return FactorGroup.SMART_MONEY

    @property
    def factor_names(self) -> List[FactorName]:
        return [
            FactorName.OBV,
            FactorName.CMF,
            FactorName.RELATIVE_VOLUME,
            FactorName.VOLUME_SPIKE,
            FactorName.INSTITUTIONAL_ACCUMULATION,
        ]

    def calculate(
        self,
        market_data: Dict[str, Any],
        financial_data: Dict[str, Any],
        indicator_data: Dict[str, Any],
        sector_data: Optional[Dict[str, Any]] = None,
    ) -> List[FactorScore]:
        scores: List[FactorScore] = []

        obv = indicator_data.get("obv_trend") or indicator_data.get("obv")
        if obv is not None:
            if isinstance(obv, (int, float)):
                s = _clamp(50 + obv * 20)
            else:
                s = 50.0
            scores.append(self._make_score(FactorName.OBV, s, raw_value=obv if isinstance(obv, (int, float)) else None))
        else:
            scores.append(self._make_score(FactorName.OBV, 50.0))

        cmf = indicator_data.get("cmf")
        if cmf is not None:
            s = _clamp(50 + cmf * 100)
            scores.append(self._make_score(FactorName.CMF, s, raw_value=cmf))
        else:
            scores.append(self._make_score(FactorName.CMF, 50.0))

        rv = indicator_data.get("relative_volume")
        if rv is not None:
            if rv > 1.5:
                s = 75.0
            elif rv > 1.0:
                s = 60.0
            elif rv > 0.5:
                s = 45.0
            else:
                s = 30.0
            scores.append(self._make_score(FactorName.RELATIVE_VOLUME, s, raw_value=rv))
        else:
            scores.append(self._make_score(FactorName.RELATIVE_VOLUME, 50.0))

        vs = indicator_data.get("volume_spike")
        if vs is not None:
            s = _clamp(50 + vs * 30) if isinstance(vs, (int, float)) else (70.0 if vs else 40.0)
            scores.append(self._make_score(FactorName.VOLUME_SPIKE, s, raw_value=vs if isinstance(vs, (int, float)) else None))
        else:
            scores.append(self._make_score(FactorName.VOLUME_SPIKE, 50.0))

        ia = indicator_data.get("institutional_accumulation")
        if ia is not None:
            s = _clamp(ia * 100) if isinstance(ia, (int, float)) and ia <= 1.0 else _clamp(50 + ia * 10)
            scores.append(self._make_score(FactorName.INSTITUTIONAL_ACCUMULATION, s, raw_value=ia))
        else:
            scores.append(self._make_score(FactorName.INSTITUTIONAL_ACCUMULATION, 50.0))

        return scores


class ProfitabilityFactorCalculator(BaseFactorCalculator):
    @property
    def group(self) -> FactorGroup:
        return FactorGroup.PROFITABILITY

    @property
    def factor_names(self) -> List[FactorName]:
        return [
            FactorName.GROSS_PROFIT_MARGIN,
            FactorName.OPERATING_PROFITABILITY,
            FactorName.NET_MARGIN,
            FactorName.ROE,
            FactorName.ROA,
        ]

    def calculate(
        self,
        market_data: Dict[str, Any],
        financial_data: Dict[str, Any],
        indicator_data: Dict[str, Any],
        sector_data: Optional[Dict[str, Any]] = None,
    ) -> List[FactorScore]:
        scores: List[FactorScore] = []

        gpm = financial_data.get("gross_margin") or financial_data.get("gross_profit_margin")
        if gpm is not None:
            s = _clamp(gpm)
            scores.append(self._make_score(FactorName.GROSS_PROFIT_MARGIN, s, raw_value=gpm))
        else:
            scores.append(self._make_score(FactorName.GROSS_PROFIT_MARGIN, 50.0))

        op = financial_data.get("operating_margin")
        if op is not None:
            s = _clamp(50 + op * 2)
            scores.append(self._make_score(FactorName.OPERATING_PROFITABILITY, s, raw_value=op))
        else:
            scores.append(self._make_score(FactorName.OPERATING_PROFITABILITY, 50.0))

        nm = financial_data.get("net_margin")
        if nm is not None:
            s = _clamp(50 + nm * 2)
            scores.append(self._make_score(FactorName.NET_MARGIN, s, raw_value=nm))
        else:
            scores.append(self._make_score(FactorName.NET_MARGIN, 50.0))

        roe = financial_data.get("roe")
        if roe is not None:
            s = _clamp(roe * 3 if roe > 0 else 50 + roe * 2)
            scores.append(self._make_score(FactorName.ROE, s, raw_value=roe))
        else:
            scores.append(self._make_score(FactorName.ROE, 50.0))

        roa = financial_data.get("roa")
        if roa is not None:
            s = _clamp(roa * 5 if roa > 0 else 50 + roa * 3)
            scores.append(self._make_score(FactorName.ROA, s, raw_value=roa))
        else:
            scores.append(self._make_score(FactorName.ROA, 50.0))

        return scores


class EfficiencyFactorCalculator(BaseFactorCalculator):
    @property
    def group(self) -> FactorGroup:
        return FactorGroup.EFFICIENCY

    @property
    def factor_names(self) -> List[FactorName]:
        return [
            FactorName.ASSET_TURNOVER,
            FactorName.INVENTORY_TURNOVER,
            FactorName.RECEIVABLE_TURNOVER,
        ]

    def calculate(
        self,
        market_data: Dict[str, Any],
        financial_data: Dict[str, Any],
        indicator_data: Dict[str, Any],
        sector_data: Optional[Dict[str, Any]] = None,
    ) -> List[FactorScore]:
        scores: List[FactorScore] = []

        at = financial_data.get("asset_turnover")
        if at is not None:
            s = _clamp(at * 30)
            scores.append(self._make_score(FactorName.ASSET_TURNOVER, s, raw_value=at))
        else:
            scores.append(self._make_score(FactorName.ASSET_TURNOVER, 50.0))

        it = financial_data.get("inventory_turnover")
        if it is not None:
            s = _clamp(min(it * 5, 100))
            scores.append(self._make_score(FactorName.INVENTORY_TURNOVER, s, raw_value=it))
        else:
            scores.append(self._make_score(FactorName.INVENTORY_TURNOVER, 50.0))

        rt = financial_data.get("receivable_turnover")
        if rt is not None:
            s = _clamp(min(rt * 3, 100))
            scores.append(self._make_score(FactorName.RECEIVABLE_TURNOVER, s, raw_value=rt))
        else:
            scores.append(self._make_score(FactorName.RECEIVABLE_TURNOVER, 50.0))

        return scores


class FinancialStrengthFactorCalculator(BaseFactorCalculator):
    @property
    def group(self) -> FactorGroup:
        return FactorGroup.FINANCIAL_STRENGTH

    @property
    def factor_names(self) -> List[FactorName]:
        return [
            FactorName.CURRENT_RATIO,
            FactorName.DEBT_TO_EQUITY,
            FactorName.INTEREST_COVERAGE,
            FactorName.FREE_CASH_FLOW_YIELD,
        ]

    def calculate(
        self,
        market_data: Dict[str, Any],
        financial_data: Dict[str, Any],
        indicator_data: Dict[str, Any],
        sector_data: Optional[Dict[str, Any]] = None,
    ) -> List[FactorScore]:
        scores: List[FactorScore] = []

        cr = financial_data.get("current_ratio")
        if cr is not None:
            if cr > 2.0:
                s = 85.0
            elif cr > 1.5:
                s = 70.0
            elif cr > 1.0:
                s = 55.0
            elif cr > 0.5:
                s = 35.0
            else:
                s = 15.0
            scores.append(self._make_score(FactorName.CURRENT_RATIO, s, raw_value=cr))
        else:
            scores.append(self._make_score(FactorName.CURRENT_RATIO, 50.0))

        de = financial_data.get("debt_to_equity")
        if de is not None:
            s = _clamp(100 - de * 20) if de >= 0 else 50.0
            scores.append(self._make_score(FactorName.DEBT_TO_EQUITY, s, raw_value=de))
        else:
            scores.append(self._make_score(FactorName.DEBT_TO_EQUITY, 50.0))

        ic = financial_data.get("interest_coverage")
        if ic is not None:
            if ic > 10:
                s = 90.0
            elif ic > 5:
                s = 70.0
            elif ic > 2:
                s = 50.0
            else:
                s = 25.0
            scores.append(self._make_score(FactorName.INTEREST_COVERAGE, s, raw_value=ic))
        else:
            scores.append(self._make_score(FactorName.INTEREST_COVERAGE, 50.0))

        fcfy = financial_data.get("free_cash_flow_yield")
        if fcfy is not None:
            s = _clamp(50 + fcfy * 10)
            scores.append(self._make_score(FactorName.FREE_CASH_FLOW_YIELD, s, raw_value=fcfy))
        else:
            scores.append(self._make_score(FactorName.FREE_CASH_FLOW_YIELD, 50.0))

        return scores


class TechnicalStrengthFactorCalculator(BaseFactorCalculator):
    @property
    def group(self) -> FactorGroup:
        return FactorGroup.TECHNICAL_STRENGTH

    @property
    def factor_names(self) -> List[FactorName]:
        return [
            FactorName.RSI,
            FactorName.ADX,
            FactorName.SMA_SIGNAL,
            FactorName.EMA_SIGNAL,
            FactorName.ATR_STRENGTH,
            FactorName.BOLLINGER_STRENGTH,
            FactorName.VWAP_STRENGTH,
        ]

    def calculate(
        self,
        market_data: Dict[str, Any],
        financial_data: Dict[str, Any],
        indicator_data: Dict[str, Any],
        sector_data: Optional[Dict[str, Any]] = None,
    ) -> List[FactorScore]:
        scores: List[FactorScore] = []
        price = market_data.get("price", 0)

        rsi = indicator_data.get("rsi")
        if rsi is not None:
            if rsi > 70:
                s = 85.0
            elif rsi > 50:
                s = 65.0 + (rsi - 50)
            elif rsi > 30:
                s = 40.0 + rsi
            else:
                s = 25.0
            scores.append(self._make_score(FactorName.RSI, s, raw_value=rsi))
        else:
            scores.append(self._make_score(FactorName.RSI, 50.0))

        adx = indicator_data.get("adx")
        if adx is not None:
            plus_di = indicator_data.get("plus_di", 25)
            minus_di = indicator_data.get("minus_di", 25)
            direction = 1.0 if plus_di > minus_di else -1.0
            s = _clamp(50 + direction * (adx / 100) * 40)
            scores.append(self._make_score(FactorName.ADX, s, raw_value=adx))
        else:
            scores.append(self._make_score(FactorName.ADX, 50.0))

        sma20 = indicator_data.get("sma20") or indicator_data.get("ma20")
        sma50 = indicator_data.get("sma50") or indicator_data.get("ma50")
        if sma20 and sma50 and price:
            above_count = int(price > sma20) + int(sma20 > sma50)
            s = _clamp(25 + above_count * 25)
            scores.append(self._make_score(FactorName.SMA_SIGNAL, s, raw_value=float(above_count)))
        else:
            scores.append(self._make_score(FactorName.SMA_SIGNAL, 50.0))

        ema12 = indicator_data.get("ema12")
        ema26 = indicator_data.get("ema26")
        if ema12 and ema26:
            diff_pct = (ema12 - ema26) / ema26 * 100 if ema26 != 0 else 0
            s = _clamp(50 + diff_pct * 10)
            scores.append(self._make_score(FactorName.EMA_SIGNAL, s, raw_value=diff_pct))
        else:
            scores.append(self._make_score(FactorName.EMA_SIGNAL, 50.0))

        atr = indicator_data.get("atr")
        if atr is not None and price:
            atr_pct = atr / price * 100
            if atr_pct < 1.0:
                s = 75.0
            elif atr_pct < 2.0:
                s = 60.0
            elif atr_pct < 3.0:
                s = 45.0
            else:
                s = 30.0
            scores.append(self._make_score(FactorName.ATR_STRENGTH, s, raw_value=atr_pct))
        else:
            scores.append(self._make_score(FactorName.ATR_STRENGTH, 50.0))

        bb_upper = indicator_data.get("bollinger_upper")
        bb_lower = indicator_data.get("bollinger_lower")
        if bb_upper and bb_lower and price:
            bb_range = bb_upper - bb_lower
            if bb_range > 0:
                position = (price - bb_lower) / bb_range
                s = _clamp(position * 100)
            else:
                s = 50.0
            scores.append(self._make_score(FactorName.BOLLINGER_STRENGTH, s, raw_value=price))
        else:
            scores.append(self._make_score(FactorName.BOLLINGER_STRENGTH, 50.0))

        vwap = indicator_data.get("vwap")
        if vwap is not None and price:
            diff_pct = (price - vwap) / vwap * 100 if vwap != 0 else 0
            s = _clamp(50 + diff_pct * 10)
            scores.append(self._make_score(FactorName.VWAP_STRENGTH, s, raw_value=diff_pct))
        else:
            scores.append(self._make_score(FactorName.VWAP_STRENGTH, 50.0))

        return scores


class LiquidityFactorCalculator(BaseFactorCalculator):
    @property
    def group(self) -> FactorGroup:
        return FactorGroup.LIQUIDITY

    @property
    def factor_names(self) -> List[FactorName]:
        return [
            FactorName.DEPTH_OF_MARKET,
            FactorName.BID_ASK_SPREAD,
            FactorName.RELATIVE_VOLUME,
            FactorName.LIQUIDITY_RISK,
        ]

    def calculate(
        self,
        market_data: Dict[str, Any],
        financial_data: Dict[str, Any],
        indicator_data: Dict[str, Any],
        sector_data: Optional[Dict[str, Any]] = None,
    ) -> List[FactorScore]:
        scores: List[FactorScore] = []

        dom = market_data.get("depth_of_market") or indicator_data.get("market_depth")
        if dom is not None:
            s = _clamp(dom * 30)
            scores.append(self._make_score(FactorName.DEPTH_OF_MARKET, s, raw_value=dom))
        else:
            scores.append(self._make_score(FactorName.DEPTH_OF_MARKET, 50.0))

        spread = market_data.get("bid_ask_spread")
        if spread is not None:
            s = _clamp(100 - spread * 1000)
            scores.append(self._make_score(FactorName.BID_ASK_SPREAD, s, raw_value=spread))
        else:
            scores.append(self._make_score(FactorName.BID_ASK_SPREAD, 50.0))

        rv = indicator_data.get("relative_volume")
        if rv is not None:
            if rv > 1.5:
                s = 75.0
            elif rv > 1.0:
                s = 60.0
            elif rv > 0.5:
                s = 45.0
            else:
                s = 30.0
            scores.append(self._make_score(FactorName.RELATIVE_VOLUME, s, raw_value=rv))
        else:
            scores.append(self._make_score(FactorName.RELATIVE_VOLUME, 50.0))

        spread_lr = market_data.get("bid_ask_spread")
        if spread_lr is not None:
            s = _clamp(100 - spread_lr * 1000)
            scores.append(self._make_score(FactorName.LIQUIDITY_RISK, s, raw_value=spread_lr))
        else:
            scores.append(self._make_score(FactorName.LIQUIDITY_RISK, 50.0))

        return scores


# ---------------------------------------------------------------------------
# Calculator registry
# ---------------------------------------------------------------------------

ALL_CALCULATORS: Dict[FactorGroup, BaseFactorCalculator] = {
    FactorGroup.VALUE: ValueFactorCalculator(),
    FactorGroup.GROWTH: GrowthFactorCalculator(),
    FactorGroup.QUALITY: QualityFactorCalculator(),
    FactorGroup.MOMENTUM: MomentumFactorCalculator(),
    FactorGroup.TREND: TrendFactorCalculator(),
    FactorGroup.RISK: RiskFactorCalculator(),
    FactorGroup.SMART_MONEY: SmartMoneyFactorCalculator(),
    FactorGroup.PROFITABILITY: ProfitabilityFactorCalculator(),
    FactorGroup.EFFICIENCY: EfficiencyFactorCalculator(),
    FactorGroup.FINANCIAL_STRENGTH: FinancialStrengthFactorCalculator(),
    FactorGroup.TECHNICAL_STRENGTH: TechnicalStrengthFactorCalculator(),
    FactorGroup.LIQUIDITY: LiquidityFactorCalculator(),
}
