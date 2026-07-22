from __future__ import annotations

import time
from modules.scoring_engine.core.types import ScoreType, ScoreBreakdown
from modules.scoring_engine.calculators.base import BaseScoreCalculator


class FinancialScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.FINANCIAL

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        pe = metrics.get("pe_ratio")
        roe = metrics.get("roe")
        de = metrics.get("debt_to_equity")
        nm = metrics.get("net_margin")
        cr = metrics.get("current_ratio")
        parts = []
        if pe is not None:
            if pe < 0:
                parts.append(20.0)
            elif pe < 10:
                parts.append(90.0)
            elif pe < 15:
                parts.append(75.0)
            elif pe < 25:
                parts.append(55.0)
            else:
                parts.append(25.0)
        if roe is not None:
            parts.append(min(100.0, max(0.0, roe * 3)))
        if de is not None:
            parts.append(max(0.0, 100.0 - de * 30))
        if nm is not None:
            parts.append(min(100.0, max(0.0, nm * 3 + 30)))
        if cr is not None:
            parts.append(min(100.0, max(0.0, cr * 30)))
        score = sum(parts) / max(1, len(parts)) if parts else 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.8, evidence_count=len(parts), calc_time=elapsed)


class ValueScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.VALUE

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        pe = metrics.get("pe_ratio")
        pb = metrics.get("pb_ratio")
        peg = metrics.get("peg_ratio")
        parts = []
        if pe is not None:
            parts.append(max(0.0, min(100.0, 100.0 - pe * 3)))
        if pb is not None:
            parts.append(max(0.0, min(100.0, 100.0 - pb * 25)))
        if peg is not None:
            if 0 < peg < 1:
                parts.append(90.0)
            elif peg < 1.5:
                parts.append(70.0)
            elif peg < 2.5:
                parts.append(50.0)
            else:
                parts.append(25.0)
        score = sum(parts) / max(1, len(parts)) if parts else 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.75, evidence_count=len(parts), calc_time=elapsed)


class GrowthScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.GROWTH

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        eg = metrics.get("earnings_growth")
        rg = metrics.get("revenue_growth")
        parts = []
        if eg is not None:
            parts.append(min(100.0, max(0.0, eg * 2 + 50)))
        if rg is not None:
            parts.append(min(100.0, max(0.0, rg * 2 + 50)))
        score = sum(parts) / max(1, len(parts)) if parts else 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.7, evidence_count=len(parts), calc_time=elapsed)


class QualityScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.QUALITY

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        roe = metrics.get("roe")
        roa = metrics.get("roa")
        nm = metrics.get("net_margin")
        cr = metrics.get("current_ratio")
        parts = []
        if roe is not None:
            parts.append(min(100.0, max(0.0, roe * 2.5)))
        if roa is not None:
            parts.append(min(100.0, max(0.0, roa * 3)))
        if nm is not None:
            parts.append(min(100.0, max(0.0, nm * 3 + 20)))
        if cr is not None:
            parts.append(min(100.0, max(0.0, cr * 25)))
        score = sum(parts) / max(1, len(parts)) if parts else 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.8, evidence_count=len(parts), calc_time=elapsed)


class RiskScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.RISK

    @property
    def direction(self):
        from modules.scoring_engine.core.types import ScoreDirection
        return ScoreDirection.LOWER_IS_BETTER

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        vol = metrics.get("volatility")
        dd = metrics.get("max_drawdown")
        beta = metrics.get("beta")
        var = metrics.get("var_95")
        parts = []
        if vol is not None:
            parts.append(max(0.0, 100.0 - vol * 2))
        if dd is not None:
            parts.append(max(0.0, 100.0 + dd * 3))
        if beta is not None:
            parts.append(max(0.0, 100.0 - abs(beta - 1.0) * 40))
        if var is not None:
            parts.append(max(0.0, 100.0 + var * 5))
        score = sum(parts) / max(1, len(parts)) if parts else 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.7, evidence_count=len(parts), calc_time=elapsed)


class LiquidityScoreCalculator(BaseScoreCalculator):
    @property
    def score_type(self) -> ScoreType:
        return ScoreType.LIQUIDITY

    def calculate(self, symbol: str, metrics: dict, evidence=None, **kwargs) -> ScoreBreakdown:
        start = time.perf_counter()
        vr = metrics.get("volume_ratio")
        rv = metrics.get("relative_volume")
        vol = metrics.get("volume")
        parts = []
        if vr is not None:
            parts.append(min(100.0, max(0.0, vr * 40)))
        if rv is not None:
            parts.append(min(100.0, max(0.0, rv * 50)))
        if vol is not None:
            parts.append(min(100.0, max(0.0, min(100.0, vol / 10000))))
        score = sum(parts) / max(1, len(parts)) if parts else 50.0
        elapsed = (time.perf_counter() - start) * 1000
        return self._build_breakdown(score, confidence=0.6, evidence_count=len(parts), calc_time=elapsed)
