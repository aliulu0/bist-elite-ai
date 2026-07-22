from __future__ import annotations

import time

from modules.early_opportunity_engine.core.types import (
    AnalysisCategory,
    AnalysisSignal,
    StageResult,
)
from modules.early_opportunity_engine.core.base import BaseAnalysisStage


class SmartMoneyAnalysisStage(BaseAnalysisStage):

    @property
    def name(self) -> str:
        return "smart_money_analysis"

    @property
    def category(self) -> AnalysisCategory:
        return AnalysisCategory.SMART_MONEY

    def analyze(
        self,
        symbol: str,
        metrics: dict,
        **kwargs,
    ) -> StageResult:
        start = time.perf_counter()
        signals: list[AnalysisSignal] = []
        warnings: list[str] = []

        ob = metrics.get("order_block")
        if ob and ob >= 1:
            signals.append(AnalysisSignal(
                category=self.category,
                name="order_block",
                strength=0.85,
                confidence=0.8,
                description="Order block detected",
                weight=1.5,
            ))

        bb = metrics.get("breaker_block")
        if bb and bb >= 1:
            signals.append(AnalysisSignal(
                category=self.category,
                name="breaker_block",
                strength=0.8,
                confidence=0.75,
                description="Breaker block detected",
                weight=1.3,
            ))

        fvg = metrics.get("fair_value_gap")
        if fvg and fvg >= 1:
            signals.append(AnalysisSignal(
                category=self.category,
                name="fair_value_gap",
                strength=0.7,
                confidence=0.7,
                description="Fair value gap detected",
                weight=1.1,
            ))

        ls = metrics.get("liquidity_sweep")
        if ls and ls >= 1:
            signals.append(AnalysisSignal(
                category=self.category,
                name="liquidity_sweep",
                strength=0.85,
                confidence=0.8,
                description="Liquidity sweep detected",
                weight=1.5,
            ))

        bos = metrics.get("bos_bullish")
        if bos and bos >= 1:
            signals.append(AnalysisSignal(
                category=self.category,
                name="bullish_bos",
                strength=0.85,
                confidence=0.8,
                description="Bullish break of structure",
                weight=1.5,
            ))

        choc = metrics.get("choc_bullish")
        if choc and choc >= 1:
            signals.append(AnalysisSignal(
                category=self.category,
                name="bullish_choc",
                strength=0.8,
                confidence=0.75,
                description="Bullish change of character",
                weight=1.3,
            ))

        dz = metrics.get("in_discount_zone")
        if dz and dz >= 1:
            signals.append(AnalysisSignal(
                category=self.category,
                name="discount_zone",
                strength=0.7,
                confidence=0.7,
                description="Price in discount zone",
                weight=1.0,
            ))

        mb = metrics.get("mitigation_block")
        if mb and mb >= 1:
            signals.append(AnalysisSignal(
                category=self.category,
                name="mitigation",
                strength=0.65,
                confidence=0.65,
                description="Mitigation block detected",
                weight=0.9,
            ))

        el = metrics.get("equal_lows")
        if el and el >= 1:
            signals.append(AnalysisSignal(
                category=self.category,
                name="equal_lows",
                strength=0.6,
                confidence=0.6,
                description="Equal lows (liquidity pool)",
                weight=0.8,
            ))

        if not signals:
            warnings.append("No smart money concepts detected")

        score = self._compute_score(signals)
        elapsed = (time.perf_counter() - start) * 1000

        return StageResult(
            category=self.category,
            score=score,
            signals=signals,
            warnings=warnings,
            details=f"Smart money analysis: {len(signals)} signals, {len(warnings)} warnings",
            calculation_time_ms=elapsed,
        )

    def validate(self, metrics: dict) -> list[str]:
        warnings = []
        smc_keys = [
            "order_block", "breaker_block", "fair_value_gap",
            "liquidity_sweep", "bos_bullish", "choc_bullish",
        ]
        found = sum(1 for k in smc_keys if k in metrics)
        if found == 0:
            warnings.append("No smart money metrics provided")
        return warnings

    def _compute_score(self, signals: list[AnalysisSignal]) -> float:
        if not signals:
            return 0.0
        total_weight = sum(s.weight for s in signals)
        if total_weight == 0:
            return 0.0
        weighted = sum(s.strength * s.confidence * s.weight for s in signals)
        return min(1.0, weighted / total_weight)
