from __future__ import annotations

import time

from modules.explainability_engine.core.types import (
    EvidenceObject, ExplanationCategory, ExplanationLevel, ExplanationResult,
    ExplanationType, ExplanationSection, Language, SignalDirection, SourceEngine,
)
from modules.explainability_engine.core.base import BaseExplanationBuilder
from modules.explainability_engine.normalizer.normalizer import EvidenceNormalizer


class SmartMoneyExplanationBuilder(BaseExplanationBuilder):

    @property
    def explanation_type(self) -> ExplanationType:
        return ExplanationType.SMART_MONEY

    @property
    def name(self) -> str:
        return "smart_money_explanation"

    def build(
        self, symbol: str, metrics: dict, evidence: list[EvidenceObject],
        level: ExplanationLevel = ExplanationLevel.DETAILED,
        language: Language = Language.ENGLISH, **kwargs,
    ) -> ExplanationResult:
        start = time.perf_counter()
        normalizer = EvidenceNormalizer()
        sections = []

        ob = metrics.get("order_block", False)
        breaker = metrics.get("breaker_block", False)
        fvg = metrics.get("fair_value_gap", False)
        sweep = metrics.get("liquidity_sweep", False)
        bos = metrics.get("bos_bullish", False)
        choc = metrics.get("choc_bullish", False)
        discount = metrics.get("in_discount_zone", False)
        mitigation = metrics.get("mitigation_block", False)
        equal_lows = metrics.get("equal_lows", False)

        detected = []
        if ob: detected.append(("Order Block" if language == Language.ENGLISH else "Emir Bloğu", "Institutional buying zone" if language == Language.ENGLISH else "Kurumsal alım bölgesi"))
        if breaker: detected.append(("Breaker Block" if language == Language.ENGLISH else "Kırıcı Blok", "Previous resistance turned support" if language == Language.ENGLISH else "Önceki direnç destek haline geldi"))
        if fvg: detected.append(("Fair Value Gap" if language == Language.ENGLISH else "Adil Değer Boşluğu", "Price imbalance zone" if language == Language.ENGLISH else "Fiyat dengesizlik bölgesi"))
        if bos: detected.append(("Break of Structure (Bullish)" if language == Language.ENGLISH else "Yapı Kırılımı (Boğa)", "Market structure shift bullish" if language == Language.ENGLISH else "Piyasa yapısı boğa yönünde değişti"))
        if choc: detected.append(("Change of Character (Bullish)" if language == Language.ENGLISH else "Karakter Değişikliği (Boğa)", "Sentiment shift detected" if language == Language.ENGLISH else "Duygu değişikliği tespit edildi"))
        if discount: detected.append(("Discount Zone" if language == Language.ENGLISH else "İndirim Bölgesi", "Price below institutional fair value" if language == Language.ENGLISH else "Fiyat kurumsal adil değer altında"))
        if mitigation: detected.append(("Mitigation Block" if language == Language.ENGLISH else "Azaltma Bloğu", "Previous supply zone mitigated" if language == Language.ENGLISH else "Önceki arz bölgesi azaltıldı"))
        if sweep: detected.append(("Liquidity Sweep" if language == Language.ENGLISH else "Likidite Süpürmesi", "Stop hunt detected" if language == Language.ENGLISH else "Stop avcılığı tespit edildi"))

        sections.append(ExplanationSection(
            title="Smart Money Indicators" if language == Language.ENGLISH else "Akıllı Para Göstergeleri",
            content=self._explain_smart_money(detected, language),
            category=ExplanationCategory.KEY_REASONS,
            evidence_refs=[e.reference for e in evidence if e.metric_name in ("order_block", "breaker_block", "fair_value_gap", "bos_bullish", "choc_bullish", "in_discount_zone")],
        ))

        if detected:
            detail_lines = []
            for name, desc in detected:
                detail_lines.append(f"  - {name}: {desc}")
            sections.append(ExplanationSection(
                title="Detection Details" if language == Language.ENGLISH else "Tespit Detayları",
                content="\n".join(detail_lines),
                category=ExplanationCategory.SUPPORTING_EVIDENCE,
            ))

        pos_ev = [e for e in evidence if e.direction == SignalDirection.POSITIVE and e.source_engine == SourceEngine.PATTERN]
        neg_ev = [e for e in evidence if e.direction == SignalDirection.NEGATIVE and e.source_engine == SourceEngine.PATTERN]

        sections.append(ExplanationSection(
            title="Positive Signals" if language == Language.ENGLISH else "Olumlu Sinyaller",
            content="\n".join(f"+ {e.description}" for e in pos_ev[:10]) or ("None" if language == Language.ENGLISH else "Yok"),
            category=ExplanationCategory.POSITIVE_SIGNALS, evidence_refs=[e.reference for e in pos_ev],
        ))
        sections.append(ExplanationSection(
            title="Negative Signals" if language == Language.ENGLISH else "Olumsuz Sinyaller",
            content="\n".join(f"- {e.description}" for e in neg_ev[:10]) or ("None" if language == Language.ENGLISH else "Yok"),
            category=ExplanationCategory.NEGATIVE_SIGNALS, evidence_refs=[e.reference for e in neg_ev],
        ))

        elapsed = (time.perf_counter() - start) * 1000
        smev = [e for e in evidence if e.metric_name in ("order_block", "breaker_block", "fair_value_gap", "bos_bullish", "choc_bullish", "in_discount_zone")]
        return ExplanationResult(
            symbol=symbol, explanation_type=ExplanationType.SMART_MONEY,
            level=level, language=language, sections=sections,
            evidence_count=len(smev),
            evidence_quality_avg=sum(e.confidence for e in smev) / max(1, len(smev)),
            scores=normalizer.compute_explainability_scores(smev),
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"), generation_time_ms=elapsed,
        )

    def _explain_smart_money(self, detected, lang) -> str:
        if not detected:
            return "No smart money indicators detected" if lang == Language.ENGLISH else "Akıllı para göstergesi tespit edilmedi"
        names = [d[0] for d in detected]
        count = len(detected)
        if count >= 3:
            return f"Strong institutional activity detected ({count} signals: {', '.join(names)})" if lang == Language.ENGLISH else f"Güçlü kurumsal aktivite tespit edildi ({count} sinyal: {', '.join(names)})"
        elif count >= 2:
            return f"Moderate smart money signals ({count}: {', '.join(names)})" if lang == Language.ENGLISH else f"Orta düzey akıllı para sinyalleri ({count}: {', '.join(names)})"
        return f"Single smart money signal: {names[0]}" if lang == Language.ENGLISH else f"Tek akıllı para sinyali: {names[0]}"
