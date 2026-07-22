from __future__ import annotations

import time

from modules.early_opportunity_engine.core.types import (
    AnalysisCategory,
    AnalysisSignal,
    StageResult,
)
from modules.early_opportunity_engine.core.base import BaseAnalysisStage


class TechnicalAnalysisStage(BaseAnalysisStage):

    @property
    def name(self) -> str:
        return "technical_analysis"

    @property
    def category(self) -> AnalysisCategory:
        return AnalysisCategory.TECHNICAL

    def analyze(
        self,
        symbol: str,
        metrics: dict,
        **kwargs,
    ) -> StageResult:
        start = time.perf_counter()
        signals: list[AnalysisSignal] = []
        warnings: list[str] = []

        rsi = metrics.get("rsi")
        if rsi is not None:
            if rsi < 30:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="rsi_oversold",
                    strength=min(1.0, (30 - rsi) / 30),
                    confidence=0.75,
                    description=f"RSI oversold: {rsi:.1f}",
                    weight=1.3,
                ))
            elif rsi > 70:
                warnings.append(f"RSI overbought: {rsi:.1f}")

        macd = metrics.get("macd")
        macd_prev = metrics.get("macd_prev")
        if macd is not None and macd_prev is not None:
            if macd_prev <= 0 < macd:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="macd_bullish_cross",
                    strength=min(1.0, abs(macd) * 10),
                    confidence=0.8,
                    description="MACD bullish crossover",
                    weight=1.5,
                ))
            elif macd > 0:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="macd_positive",
                    strength=min(1.0, abs(macd) * 5),
                    confidence=0.55,
                    description=f"MACD positive: {macd:.4f}",
                    weight=0.8,
                ))

        adx = metrics.get("adx")
        if adx is not None:
            if adx > 25:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="strong_trend",
                    strength=min(1.0, (adx - 25) / 25),
                    confidence=0.7,
                    description=f"Strong trend: ADX {adx:.1f}",
                    weight=1.0,
                ))

        close = metrics.get("close", 0)
        sma200 = metrics.get("sma_200")
        if close and sma200 and sma200 > 0:
            ratio = close / sma200
            if ratio > 1.0 and ratio < 1.1:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="near_200sma",
                    strength=min(1.0, (ratio - 1.0) * 10),
                    confidence=0.65,
                    description=f"Price near 200-SMA: {ratio:.3f}",
                    weight=1.0,
                ))
            elif ratio > 1.2:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="above_200sma",
                    strength=min(1.0, (ratio - 1.0) * 2),
                    confidence=0.6,
                    description=f"Above 200-SMA: {ratio:.3f}",
                    weight=0.8,
                ))

        sma50 = metrics.get("sma_50")
        if sma50 and sma200 and sma50 > sma200:
            signals.append(AnalysisSignal(
                category=self.category,
                name="golden_cross_zone",
                strength=0.7,
                confidence=0.7,
                description="50-SMA above 200-SMA (golden cross zone)",
                weight=1.2,
            ))

        momentum = metrics.get("momentum")
        if momentum is not None:
            if momentum > 0:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="positive_momentum",
                    strength=min(1.0, momentum / 20),
                    confidence=0.6,
                    description=f"Positive momentum: {momentum:.2f}",
                    weight=0.9,
                ))
            elif momentum < -10:
                warnings.append(f"Negative momentum: {momentum:.2f}")

        stoch = metrics.get("stochastic_k")
        if stoch is not None and stoch < 20:
            signals.append(AnalysisSignal(
                category=self.category,
                name="stochastic_oversold",
                strength=min(1.0, (20 - stoch) / 20),
                confidence=0.65,
                description=f"Stochastic oversold: {stoch:.1f}",
                weight=0.9,
            ))

        bb_lower = metrics.get("bb_lower")
        if bb_lower and close and close > 0:
            if close < bb_lower * 1.02:
                signals.append(AnalysisSignal(
                    category=self.category,
                    name="bb_lower_bounce",
                    strength=0.7,
                    confidence=0.65,
                    description="Price near lower Bollinger Band",
                    weight=1.0,
                ))

        score = self._compute_score(signals)
        elapsed = (time.perf_counter() - start) * 1000

        return StageResult(
            category=self.category,
            score=score,
            signals=signals,
            warnings=warnings,
            details=f"Technical analysis: {len(signals)} signals, {len(warnings)} warnings",
            calculation_time_ms=elapsed,
        )

    def validate(self, metrics: dict) -> list[str]:
        warnings = []
        tech_keys = ["rsi", "macd", "adx", "close", "sma_50", "sma_200"]
        found = sum(1 for k in tech_keys if k in metrics)
        if found == 0:
            warnings.append("No technical metrics provided")
        return warnings

    def _compute_score(self, signals: list[AnalysisSignal]) -> float:
        if not signals:
            return 0.0
        total_weight = sum(s.weight for s in signals)
        if total_weight == 0:
            return 0.0
        weighted = sum(s.strength * s.confidence * s.weight for s in signals)
        return min(1.0, weighted / total_weight)
