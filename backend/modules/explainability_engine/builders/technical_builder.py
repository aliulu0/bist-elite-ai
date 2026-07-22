from __future__ import annotations

import time

from modules.explainability_engine.core.types import (
    EvidenceObject, ExplanationCategory, ExplanationLevel, ExplanationResult,
    ExplanationType, ExplanationSection, Language, SignalDirection, SourceEngine,
)
from modules.explainability_engine.core.base import BaseExplanationBuilder
from modules.explainability_engine.normalizer.normalizer import EvidenceNormalizer


class TechnicalExplanationBuilder(BaseExplanationBuilder):

    @property
    def explanation_type(self) -> ExplanationType:
        return ExplanationType.TECHNICAL

    @property
    def name(self) -> str:
        return "technical_explanation"

    def build(
        self, symbol: str, metrics: dict, evidence: list[EvidenceObject],
        level: ExplanationLevel = ExplanationLevel.DETAILED,
        language: Language = Language.ENGLISH, **kwargs,
    ) -> ExplanationResult:
        start = time.perf_counter()
        normalizer = EvidenceNormalizer()
        sections = []

        rsi = metrics.get("rsi")
        macd = metrics.get("macd")
        macd_sig = metrics.get("macd_signal")
        adx = metrics.get("adx")
        sma20 = metrics.get("sma_20")
        sma50 = metrics.get("sma_50")
        sma200 = metrics.get("sma_200")
        momentum = metrics.get("momentum")
        stoch_k = metrics.get("stoch_k")
        supertrend = metrics.get("supertrend")

        sections.append(ExplanationSection(
            title="Trend Analysis" if language == Language.ENGLISH else "Trend Analizi",
            content=self._explain_trend(sma20, sma50, sma200, adx, momentum, language),
            category=ExplanationCategory.SUPPORTING_EVIDENCE,
            evidence_refs=[e.reference for e in evidence if e.metric_name in ("sma_20", "sma_50", "sma_200", "adx", "momentum")],
        ))

        sections.append(ExplanationSection(
            title="Momentum Analysis" if language == Language.ENGLISH else "Momentum Analizi",
            content=self._explain_momentum(rsi, macd, macd_sig, stoch_k, language),
            category=ExplanationCategory.KEY_REASONS,
            evidence_refs=[e.reference for e in evidence if e.metric_name in ("rsi", "macd", "macd_signal", "stoch_k")],
        ))

        cross_content = self._explain_crosses(sma50, sma200, macd, macd_sig, language)
        if cross_content:
            sections.append(ExplanationSection(
                title="Crossover Signals" if language == Language.ENGLISH else "Kesişim Sinyalleri",
                content=cross_content,
                category=ExplanationCategory.KEY_REASONS,
                evidence_refs=[e.reference for e in evidence if e.metric_name in ("sma_50", "sma_200", "macd", "macd_signal")],
            ))

        pos_ev = [e for e in evidence if e.direction == SignalDirection.POSITIVE and e.source_engine == SourceEngine.INDICATOR]
        neg_ev = [e for e in evidence if e.direction == SignalDirection.NEGATIVE and e.source_engine == SourceEngine.INDICATOR]

        sections.append(ExplanationSection(
            title="Positive Signals" if language == Language.ENGLISH else "Olumlu Sinyaller",
            content=self._format_signals(pos_ev, language),
            category=ExplanationCategory.POSITIVE_SIGNALS,
            evidence_refs=[e.reference for e in pos_ev],
            signals=[SignalDirection.POSITIVE],
        ))

        sections.append(ExplanationSection(
            title="Negative Signals" if language == Language.ENGLISH else "Olumsuz Sinyaller",
            content=self._format_signals(neg_ev, language),
            category=ExplanationCategory.NEGATIVE_SIGNALS,
            evidence_refs=[e.reference for e in neg_ev],
            signals=[SignalDirection.NEGATIVE],
        ))

        elapsed = (time.perf_counter() - start) * 1000
        tev = [e for e in evidence if e.source_engine == SourceEngine.INDICATOR]
        return ExplanationResult(
            symbol=symbol, explanation_type=ExplanationType.TECHNICAL,
            level=level, language=language, sections=sections,
            evidence_count=len(tev),
            evidence_quality_avg=sum(e.confidence for e in tev) / max(1, len(tev)),
            scores=normalizer.compute_explainability_scores(tev),
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"), generation_time_ms=elapsed,
        )

    def _explain_trend(self, sma20, sma50, sma200, adx, momentum, lang) -> str:
        parts = []
        if sma50 and sma200:
            if sma50 > sma200:
                parts.append("Price above 200-SMA with 50-SMA bullish" if lang == Language.ENGLISH else "Fiyat 200-SMA üzerinde ve 50-SMA boğa yönünde")
            else:
                parts.append("Price below 200-SMA with bearish structure" if lang == Language.ENGLISH else "Fiyat 200-SMA altında ve ayı yapısında")
        if adx is not None:
            if adx > 25:
                parts.append(f"Strong trend (ADX: {adx:.1f})" if lang == Language.ENGLISH else f"Güçlü trend (ADX: {adx:.1f})")
            else:
                parts.append(f"Weak trend (ADX: {adx:.1f}) — consolidation possible" if lang == Language.ENGLISH else f"Zayıf trend (ADX: {adx:.1f}) — konsolidasyon olası")
        if momentum is not None:
            if momentum > 0:
                parts.append("Positive momentum" if lang == Language.ENGLISH else "Olumlu momentum")
            else:
                parts.append("Negative momentum" if lang == Language.ENGLISH else "Olumsuz momentum")
        return ". ".join(parts) + "." if parts else "Insufficient trend data" if lang == Language.ENGLISH else "Yetersiz trend verisi"

    def _explain_momentum(self, rsi, macd, macd_sig, stoch_k, lang) -> str:
        parts = []
        if rsi is not None:
            if rsi < 30:
                parts.append(f"RSI ({rsi:.1f}) is oversold — potential bounce" if lang == Language.ENGLISH else f"RSI ({rsi:.1f}) aşırı satım bölgesinde — olası tepki")
            elif rsi > 70:
                parts.append(f"RSI ({rsi:.1f}) is overbought — caution warranted" if lang == Language.ENGLISH else f"RSI ({rsi:.1f}) aşırı alım bölgesinde — dikkatli olunmalı")
            elif rsi < 45:
                parts.append(f"RSI ({rsi:.1f}) is in bearish territory" if lang == Language.ENGLISH else f"RSI ({rsi:.1f}) ayı bölgesinde")
            else:
                parts.append(f"RSI ({rsi:.1f}) is neutral" if lang == Language.ENGLISH else f"RSI ({rsi:.1f}) nötr bölgede")
        if macd is not None and macd_sig is not None:
            if macd > macd_sig:
                parts.append("MACD bullish crossover active" if lang == Language.ENGLISH else "MACD boğa kesişimi aktif")
            else:
                parts.append("MACD below signal — bearish momentum" if lang == Language.ENGLISH else "MACD sinyal altında — ayı momentumu")
        if stoch_k is not None:
            if stoch_k < 20:
                parts.append(f"Stochastic ({stoch_k:.1f}) oversold" if lang == Language.ENGLISH else f"Stochastic ({stoch_k:.1f}) aşırı satım")
            elif stoch_k > 80:
                parts.append(f"Stochastic ({stoch_k:.1f}) overbought" if lang == Language.ENGLISH else f"Stochastic ({stoch_k:.1f}) aşırı alım")
        return ". ".join(parts) + "." if parts else "Insufficient momentum data" if lang == Language.ENGLISH else "Yetersiz momentum verisi"

    def _explain_crosses(self, sma50, sma200, macd, macd_sig, lang) -> str:
        parts = []
        if sma50 and sma200:
            ratio = sma50 / sma200 if sma200 != 0 else 1.0
            if 0.99 < ratio < 1.02:
                parts.append("50-SMA near 200-SMA — potential Golden/Death Cross zone" if lang == Language.ENGLISH else "50-SMA 200-SMA'ya yakın — olası Altın/Ölüm Kesişimi bölgesi")
            elif ratio > 1.02:
                parts.append("Golden Cross in effect (50-SMA above 200-SMA)" if lang == Language.ENGLISH else "Altın Kesişim etkin (50-SMA 200-SMA上面ında)")
            elif ratio < 0.98:
                parts.append("Death Cross in effect (50-SMA below 200-SMA)" if lang == Language.ENGLISH else "Ölüm Kesişimi etkin (50-SMA 200-SMA下面ında)")
        return ". ".join(parts) + "." if parts else ""

    def _format_signals(self, evidence, lang) -> str:
        if not evidence:
            return "None" if lang == Language.ENGLISH else "Yok"
        return "\n".join(f"+ {e.description}" for e in evidence[:10])
