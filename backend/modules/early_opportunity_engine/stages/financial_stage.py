from __future__ import annotations

import time

from modules.early_opportunity_engine.core.types import (
    AnalysisCategory,
    AnalysisSignal,
    StageResult,
)
from modules.early_opportunity_engine.core.base import BaseAnalysisStage


class FinancialAnalysisStage(BaseAnalysisStage):

    @property
    def name(self) -> str:
        return "financial_analysis"

    @property
    def category(self) -> AnalysisCategory:
        return AnalysisCategory.FINANCIAL

    def analyze(
        self,
        symbol: str,
        metrics: dict,
        **kwargs,
    ) -> StageResult:
        start = time.perf_counter()
        signals: list[AnalysisSignal] = []
        warnings: list[str] = []

        pe = metrics.get("pe_ratio")
        if pe is not None:
            if pe < 10:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="deep_value",
                    strength=min(1.0, (10 - pe) / 10),
                    confidence=0.8,
                    description=f"Deep value: PE ratio {pe:.1f} < 10",
                    weight=1.5,
                ))
            elif pe < 15:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="undervalued",
                    strength=min(1.0, (15 - pe) / 15),
                    confidence=0.7,
                    description=f"Undervalued: PE ratio {pe:.1f} < 15",
                    weight=1.2,
                ))
            elif pe > 30:
                warnings.append(f"Overvalued: PE ratio {pe:.1f} > 30")

        pb = metrics.get("pb_ratio")
        if pb is not None:
            if pb < 1.0:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="below_book",
                    strength=min(1.0, (1.0 - pb)),
                    confidence=0.7,
                    description=f"Trading below book value: PB {pb:.2f}",
                    weight=1.3,
                ))
            elif pb > 5.0:
                warnings.append(f"High P/B ratio: {pb:.2f}")

        roe = metrics.get("roe")
        if roe is not None:
            if roe > 20:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="high_roe",
                    strength=min(1.0, (roe - 20) / 30),
                    confidence=0.75,
                    description=f"High ROE: {roe:.1f}%",
                    weight=1.2,
                ))
            elif roe < 5:
                warnings.append(f"Low ROE: {roe:.1f}%")

        debt = metrics.get("debt_to_equity")
        if debt is not None:
            if debt > 2.0:
                warnings.append(f"High debt: D/E {debt:.2f}")
            elif debt < 0.3:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="low_debt",
                    strength=min(1.0, (0.3 - debt) / 0.3),
                    confidence=0.6,
                    description=f"Low debt: D/E {debt:.2f}",
                    weight=0.8,
                ))

        eg = metrics.get("earnings_growth")
        if eg is not None:
            if eg > 20:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="high_growth",
                    strength=min(1.0, (eg - 20) / 30),
                    confidence=0.8,
                    description=f"High earnings growth: {eg:.1f}%",
                    weight=1.5,
                ))
            elif eg < 0:
                warnings.append(f"Negative earnings growth: {eg:.1f}%")

        dy = metrics.get("dividend_yield")
        if dy is not None and dy > 3.0:
            signals.append(AnalysisSignal(
                category=self.category,
                name="high_dividend",
                strength=min(1.0, (dy - 3) / 5),
                confidence=0.65,
                description=f"High dividend yield: {dy:.1f}%",
                weight=0.8,
            ))

        peg = metrics.get("peg_ratio")
        if peg is not None and peg < 1.0:
            signals.append(AnalysisSignal(
                category=self.category,
                name="attractive_peg",
                strength=min(1.0, (1.0 - peg)),
                confidence=0.7,
                description=f"Attractive PEG ratio: {peg:.2f}",
                weight=1.0,
            ))

        cr = metrics.get("current_ratio")
        if cr is not None and cr > 2.0:
            signals.append(AnalysisSignal(
                category=self.category,
                name="strong_liquidity",
                strength=min(1.0, (cr - 2) / 3),
                confidence=0.6,
                description=f"Strong current ratio: {cr:.2f}",
                weight=0.7,
            ))

        nm = metrics.get("net_margin")
        if nm is not None and nm > 15:
            signals.append(AnalysisSignal(
                category=self.category,
                name="high_margin",
                strength=min(1.0, (nm - 15) / 20),
                confidence=0.7,
                description=f"High net margin: {nm:.1f}%",
                weight=0.9,
            ))

        score = self._compute_score(signals)
        elapsed = (time.perf_counter() - start) * 1000

        return StageResult(
            category=self.category,
            score=score,
            signals=signals,
            warnings=warnings,
            details=f"Financial analysis: {len(signals)} signals, {len(warnings)} warnings",
            calculation_time_ms=elapsed,
        )

    def validate(self, metrics: dict) -> list[str]:
        warnings = []
        financial_keys = [
            "pe_ratio", "pb_ratio", "roe", "debt_to_equity",
            "earnings_growth", "dividend_yield",
        ]
        found = sum(1 for k in financial_keys if k in metrics)
        if found == 0:
            warnings.append("No financial metrics provided")
        return warnings

    def _compute_score(self, signals: list[AnalysisSignal]) -> float:
        if not signals:
            return 0.0
        total_weight = sum(s.weight for s in signals)
        if total_weight == 0:
            return 0.0
        weighted = sum(s.strength * s.confidence * s.weight for s in signals)
        return min(1.0, weighted / total_weight)
