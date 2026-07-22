from __future__ import annotations

import time

from modules.early_opportunity_engine.core.types import (
    AnalysisCategory,
    AnalysisSignal,
    RedFlag,
    RedFlagType,
    RiskAssessment,
    StageResult,
)
from modules.early_opportunity_engine.core.base import BaseAnalysisStage


class RiskAnalysisStage(BaseAnalysisStage):

    @property
    def name(self) -> str:
        return "risk_analysis"

    @property
    def category(self) -> AnalysisCategory:
        return AnalysisCategory.RISK

    def analyze(
        self,
        symbol: str,
        metrics: dict,
        **kwargs,
    ) -> StageResult:
        start = time.perf_counter()
        signals: list[AnalysisSignal] = []
        warnings: list[str] = []
        red_flags: list[RedFlag] = []

        dd = metrics.get("max_drawdown")
        if dd is not None:
            if dd < 10:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="low_drawdown",
                    strength=min(1.0, (10 - dd) / 10),
                    confidence=0.7,
                    description=f"Low max drawdown: {dd:.1f}%",
                    weight=1.0,
                ))
            elif dd > 30:
                red_flags.append(RedFlag(
                    flag_type=RedFlagType.LATE_TREND,
                    severity=min(1.0, (dd - 30) / 20),
                    description=f"High drawdown risk: {dd:.1f}%",
                    metric="max_drawdown",
                    value=dd,
                ))

        vol = metrics.get("volatility")
        if vol is not None:
            if vol < 15:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="low_volatility",
                    strength=min(1.0, (15 - vol) / 15),
                    confidence=0.6,
                    description=f"Low volatility: {vol:.1f}%",
                    weight=0.8,
                ))
            elif vol > 40:
                red_flags.append(RedFlag(
                    flag_type=RedFlagType.OVERBOUGHT,
                    severity=min(1.0, (vol - 40) / 20),
                    description=f"High volatility: {vol:.1f}%",
                    metric="volatility",
                    value=vol,
                ))

        sharpe = metrics.get("sharpe_ratio")
        if sharpe is not None:
            if sharpe > 1.5:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="high_sharpe",
                    strength=min(1.0, (sharpe - 1) / 2),
                    confidence=0.75,
                    description=f"High Sharpe ratio: {sharpe:.2f}",
                    weight=1.2,
                ))
            elif sharpe < 0:
                warnings.append(f"Negative Sharpe ratio: {sharpe:.2f}")

        sortino = metrics.get("sortino_ratio")
        if sortino is not None and sortino > 2.0:
            signals.append(AnalysisSignal(
                category=self.category,
                name="high_sortino",
                strength=min(1.0, (sortino - 1) / 2),
                confidence=0.7,
                description=f"High Sortino ratio: {sortino:.2f}",
                weight=1.0,
            ))

        beta = metrics.get("beta")
        if beta is not None:
            if 0.5 <= beta <= 1.2:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="reasonable_beta",
                    strength=0.6,
                    confidence=0.6,
                    description=f"Reasonable beta: {beta:.2f}",
                    weight=0.7,
                ))
            elif beta > 2.0:
                warnings.append(f"High beta: {beta:.2f}")

        var_val = metrics.get("var_95")
        if var_val is not None:
            if var_val < 3:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="low_var",
                    strength=min(1.0, (3 - var_val) / 3),
                    confidence=0.65,
                    description=f"Low VaR (95%): {var_val:.1f}%",
                    weight=0.8,
                ))
            elif var_val > 8:
                red_flags.append(RedFlag(
                    flag_type=RedFlagType.LIQUIDITY_RISK,
                    severity=min(1.0, (var_val - 8) / 5),
                    description=f"High VaR: {var_val:.1f}%",
                    metric="var_95",
                    value=var_val,
                ))

        debt = metrics.get("debt_to_equity")
        if debt is not None and debt > 2.0:
            red_flags.append(RedFlag(
                flag_type=RedFlagType.HIGH_DEBT,
                severity=min(1.0, (debt - 2) / 3),
                description=f"High debt-to-equity: {debt:.2f}",
                metric="debt_to_equity",
                value=debt,
            ))

        earnings = metrics.get("earnings_growth")
        if earnings is not None and earnings < 0:
            red_flags.append(RedFlag(
                flag_type=RedFlagType.WEAK_EARNINGS,
                severity=min(1.0, abs(earnings) / 20),
                description=f"Negative earnings growth: {earnings:.1f}%",
                metric="earnings_growth",
                value=earnings,
            ))

        vr = metrics.get("volume_ratio")
        if vr is not None and vr < 0.5:
            red_flags.append(RedFlag(
                flag_type=RedFlagType.WEAK_VOLUME,
                severity=min(1.0, (0.5 - vr) / 0.5),
                description=f"Weak volume: {vr:.1f}x average",
                metric="volume_ratio",
                value=vr,
            ))

        risk_score = self._compute_risk_score(metrics)
        dd_prob = self._compute_drawdown_prob(metrics)
        liq_risk = self._compute_liquidity_risk(metrics)
        vol_risk = self._compute_volatility_risk(metrics)
        sec_risk = self._compute_sector_risk(metrics)

        risk = RiskAssessment(
            score=risk_score,
            drawdown_probability=dd_prob,
            liquidity_risk=liq_risk,
            volatility_risk=vol_risk,
            sector_risk=sec_risk,
            details=[r.description for r in red_flags],
        )

        score = self._compute_score(signals)
        elapsed = (time.perf_counter() - start) * 1000

        result = StageResult(
            category=self.category,
            score=score,
            signals=signals,
            warnings=warnings,
            details=f"Risk analysis: {len(signals)} signals, {len(red_flags)} red flags",
            calculation_time_ms=elapsed,
        )
        result.signals.extend([
            AnalysisSignal(
                category=self.category,
                name="risk_assessment",
                strength=1.0 - risk_score,
                confidence=0.8,
                description=f"Risk score: {risk_score:.2f}",
            )
        ])
        return result

    def validate(self, metrics: dict) -> list[str]:
        warnings = []
        risk_keys = ["max_drawdown", "volatility", "sharpe_ratio", "beta"]
        found = sum(1 for k in risk_keys if k in metrics)
        if found == 0:
            warnings.append("No risk metrics provided")
        return warnings

    def _compute_risk_score(self, metrics: dict) -> float:
        factors = []
        dd = metrics.get("max_drawdown")
        if dd is not None:
            factors.append(min(1.0, dd / 50))
        vol = metrics.get("volatility")
        if vol is not None:
            factors.append(min(1.0, vol / 60))
        sharpe = metrics.get("sharpe_ratio")
        if sharpe is not None:
            factors.append(max(0, 1.0 - sharpe / 3))
        beta = metrics.get("beta")
        if beta is not None:
            factors.append(min(1.0, abs(beta - 1) / 2))
        if not factors:
            return 0.5
        return sum(factors) / len(factors)

    def _compute_drawdown_prob(self, metrics: dict) -> float:
        dd = metrics.get("max_drawdown")
        vol = metrics.get("volatility")
        if dd is None and vol is None:
            return 0.5
        prob = 0.3
        if dd is not None:
            prob += min(0.3, dd / 100)
        if vol is not None:
            prob += min(0.2, vol / 200)
        return min(0.9, prob)

    def _compute_liquidity_risk(self, metrics: dict) -> float:
        vol_ratio = metrics.get("volume_ratio")
        avg_vol = metrics.get("avg_volume")
        if vol_ratio is None and avg_vol is None:
            return 0.5
        risk = 0.3
        if vol_ratio is not None and vol_ratio < 0.5:
            risk += 0.3
        if avg_vol is not None and avg_vol < 100000:
            risk += 0.3
        return min(0.9, risk)

    def _compute_volatility_risk(self, metrics: dict) -> float:
        vol = metrics.get("volatility")
        if vol is None:
            return 0.5
        return min(0.9, vol / 60)

    def _compute_sector_risk(self, metrics: dict) -> float:
        rs = metrics.get("sector_relative_strength")
        if rs is None:
            return 0.5
        if rs > 5:
            return 0.2
        elif rs > 0:
            return 0.4
        else:
            return 0.7

    def _compute_score(self, signals: list[AnalysisSignal]) -> float:
        if not signals:
            return 0.0
        total_weight = sum(s.weight for s in signals)
        if total_weight == 0:
            return 0.0
        weighted = sum(s.strength * s.confidence * s.weight for s in signals)
        return min(1.0, weighted / total_weight)
