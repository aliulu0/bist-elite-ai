from __future__ import annotations

import time

from modules.explainability_engine.core.types import (
    EvidenceObject,
    ExplanationCategory,
    ExplanationLevel,
    ExplanationResult,
    ExplanationType,
    ExplanationSection,
    Language,
    SignalDirection,
    SourceEngine,
)
from modules.explainability_engine.core.base import BaseExplanationBuilder
from modules.explainability_engine.normalizer.normalizer import EvidenceNormalizer


class FundamentalExplanationBuilder(BaseExplanationBuilder):

    @property
    def explanation_type(self) -> ExplanationType:
        return ExplanationType.FUNDAMENTAL

    @property
    def name(self) -> str:
        return "fundamental_explanation"

    def build(
        self,
        symbol: str,
        metrics: dict,
        evidence: list[EvidenceObject],
        level: ExplanationLevel = ExplanationLevel.DETAILED,
        language: Language = Language.ENGLISH,
        **kwargs,
    ) -> ExplanationResult:
        start = time.perf_counter()
        normalizer = EvidenceNormalizer()
        sections = []

        pe = metrics.get("pe_ratio")
        pb = metrics.get("pb_ratio")
        roe = metrics.get("roe")
        de = metrics.get("debt_to_equity")
        eg = metrics.get("earnings_growth")
        dy = metrics.get("dividend_yield")
        peg = metrics.get("peg_ratio")
        cr = metrics.get("current_ratio")
        nm = metrics.get("net_margin")
        roa = metrics.get("roa")
        rg = metrics.get("revenue_growth")

        valuation_content = self._explain_valuation(pe, pb, peg, evidence, language)
        sections.append(ExplanationSection(
            title="Valuation Analysis" if language == Language.ENGLISH else "Değerleme Analizi",
            content=valuation_content,
            category=ExplanationCategory.SUPPORTING_EVIDENCE,
            evidence_refs=[e.reference for e in evidence if e.metric_name in ("pe_ratio", "pb_ratio", "peg_ratio")],
            confidence=normalizer.compute_signal_strength(
                [e for e in evidence if e.metric_name in ("pe_ratio", "pb_ratio", "peg_ratio")],
            ),
        ))

        profitability_content = self._explain_profitability(roe, roa, nm, evidence, language)
        sections.append(ExplanationSection(
            title="Profitability Analysis" if language == Language.ENGLISH else "Karlılık Analizi",
            content=profitability_content,
            category=ExplanationCategory.SUPPORTING_EVIDENCE,
            evidence_refs=[e.reference for e in evidence if e.metric_name in ("roe", "roa", "net_margin")],
            confidence=normalizer.compute_signal_strength(
                [e for e in evidence if e.metric_name in ("roe", "roa", "net_margin")],
            ),
        ))

        growth_content = self._explain_growth(eg, rg, evidence, language)
        sections.append(ExplanationSection(
            title="Growth Analysis" if language == Language.ENGLISH else "Büyüme Analizi",
            content=growth_content,
            category=ExplanationCategory.KEY_REASONS,
            evidence_refs=[e.reference for e in evidence if e.metric_name in ("earnings_growth", "revenue_growth")],
        ))

        financial_health = self._explain_financial_health(de, cr, dy, evidence, language)
        sections.append(ExplanationSection(
            title="Financial Health" if language == Language.ENGLISH else "Finansal Sağlık",
            content=financial_health,
            category=ExplanationCategory.SUPPORTING_EVIDENCE,
            evidence_refs=[e.reference for e in evidence if e.metric_name in ("debt_to_equity", "current_ratio", "dividend_yield")],
        ))

        pos_ev = [e for e in evidence if e.direction == SignalDirection.POSITIVE and e.source_engine == SourceEngine.FINANCIAL]
        neg_ev = [e for e in evidence if e.direction == SignalDirection.NEGATIVE and e.source_engine == SourceEngine.FINANCIAL]

        sections.append(ExplanationSection(
            title="Positive Signals" if language == Language.ENGLISH else "Olumlu Sinyaller",
            content=self._format_signal_list(pos_ev, SignalDirection.POSITIVE, language),
            category=ExplanationCategory.POSITIVE_SIGNALS,
            evidence_refs=[e.reference for e in pos_ev],
            signals=[SignalDirection.POSITIVE],
        ))

        sections.append(ExplanationSection(
            title="Negative Signals" if language == Language.ENGLISH else "Olumsuz Sinyaller",
            content=self._format_signal_list(neg_ev, SignalDirection.NEGATIVE, language),
            category=ExplanationCategory.NEGATIVE_SIGNALS,
            evidence_refs=[e.reference for e in neg_ev],
            signals=[SignalDirection.NEGATIVE],
        ))

        elapsed = (time.perf_counter() - start) * 1000
        fev = [e for e in evidence if e.source_engine == SourceEngine.FINANCIAL]
        return ExplanationResult(
            symbol=symbol,
            explanation_type=ExplanationType.FUNDAMENTAL,
            level=level,
            language=language,
            sections=sections,
            evidence_count=len(fev),
            evidence_quality_avg=sum(e.confidence for e in fev) / max(1, len(fev)),
            scores=normalizer.compute_explainability_scores(fev),
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            generation_time_ms=elapsed,
        )

    def _explain_valuation(self, pe, pb, peg, evidence, lang) -> str:
        parts = []
        if pe is not None:
            if pe < 10:
                parts.append(f"P/E ratio ({pe:.1f}) is deeply undervalued" if lang == Language.ENGLISH else f"P/E oranı ({pe:.1f}) derinlemesine düşük değerli")
            elif pe < 15:
                parts.append(f"P/E ratio ({pe:.1f}) suggests undervaluation" if lang == Language.ENGLISH else f"P/E oranı ({pe:.1f}) düşük değerlemeye işaret ediyor")
            elif pe < 25:
                parts.append(f"P/E ratio ({pe:.1f}) is fairly valued" if lang == Language.ENGLISH else f"P/E oranı ({pe:.1f}) adil değerlemede")
            else:
                parts.append(f"P/E ratio ({pe:.1f}) indicates overvaluation risk" if lang == Language.ENGLISH else f"P/E oranı ({pe:.1f}) aşırı değerleme riski gösteriyor")
        if pb is not None:
            if pb < 1.0:
                parts.append(f"P/B ratio ({pb:.2f}) below book value — strong value signal" if lang == Language.ENGLISH else f"P/B oranı ({pb:.2f}) defter değerinin altında — güçlü değer sinyali")
            elif pb < 2.0:
                parts.append(f"P/B ratio ({pb:.2f}) is reasonable" if lang == Language.ENGLISH else f"P/B oranı ({pb:.2f}) makul seviyede")
            else:
                parts.append(f"P/B ratio ({pb:.2f}) is elevated" if lang == Language.ENGLISH else f"P/B oranı ({pb:.2f}) yüksek seviyede")
        if peg is not None:
            if 0 < peg < 1:
                parts.append(f"PEG ratio ({peg:.2f}) indicates undervalued growth" if lang == Language.ENGLISH else f"PEG oranı ({peg:.2f}) düşük değerli büyümeyi gösteriyor")
            elif peg < 1.5:
                parts.append(f"PEG ratio ({peg:.2f}) is fairly valued for growth" if lang == Language.ENGLISH else f"PEG oranı ({peg:.2f}) büyüme için adil değerlemede")
            else:
                parts.append(f"PEG ratio ({peg:.2f}) suggests growth is expensive" if lang == Language.ENGLISH else f"PEG oranı ({peg:.2f}) büyümenin pahalı olduğunu gösteriyor")
        return ". ".join(parts) + "." if parts else ("No valuation data available" if lang == Language.ENGLISH else "Değerleme verisi mevcut değil")

    def _explain_profitability(self, roe, roa, nm, evidence, lang) -> str:
        parts = []
        if roe is not None:
            if roe > 20:
                parts.append(f"ROE ({roe:.1f}%) is excellent — strong capital efficiency" if lang == Language.ENGLISH else f"ROE ({roe:.1f}%) mükemmel — güçlü sermaye verimliliği")
            elif roe > 10:
                parts.append(f"ROE ({roe:.1f}%) is healthy" if lang == Language.ENGLISH else f"ROE ({roe:.1f}%) sağlıklı")
            else:
                parts.append(f"ROE ({roe:.1f}%) indicates weak returns" if lang == Language.ENGLISH else f"ROE ({roe:.1f}%) zayıf getirilere işaret ediyor")
        if nm is not None:
            if nm > 15:
                parts.append(f"Net margin ({nm:.1f}%) shows strong pricing power" if lang == Language.ENGLISH else f"Net kar marjı ({nm:.1f}%) güçlü fiyatlandırma gücü gösteriyor")
            elif nm > 5:
                parts.append(f"Net margin ({nm:.1f}%) is adequate" if lang == Language.ENGLISH else f"Net kar marjı ({nm:.1f}%) yeterli")
            else:
                parts.append(f"Net margin ({nm:.1f}%) is thin" if lang == Language.ENGLISH else f"Net kar marjı ({nm:.1f}%) ince")
        return ". ".join(parts) + "." if parts else ("No profitability data available" if lang == Language.ENGLISH else "Karlılık verisi mevcut değil")

    def _explain_growth(self, eg, rg, evidence, lang) -> str:
        parts = []
        if eg is not None:
            if eg > 20:
                parts.append(f"Strong earnings growth ({eg:.1f}%) signals accelerating profitability" if lang == Language.ENGLISH else f"Güçlü kâr büyümesi ({eg:.1f}%) hızlanan kârlılığı gösteriyor")
            elif eg > 0:
                parts.append(f"Moderate earnings growth ({eg:.1f}%)" if lang == Language.ENGLISH else f"Orta düzey kâr büyümesi ({eg:.1f}%)")
            else:
                parts.append(f"Negative earnings growth ({eg:.1f}%) is a concern" if lang == Language.ENGLISH else f"Negatif kâr büyümesi ({eg:.1f}%) endişe verici")
        if rg is not None:
            if rg > 15:
                parts.append(f"Revenue growth ({rg:.1f}%) indicates expanding market share" if lang == Language.ENGLISH else f"Gelir büyümesi ({rg:.1f}%) pazar payının genişlediğini gösteriyor")
            elif rg > 0:
                parts.append(f"Revenue growth ({rg:.1f}%) is positive" if lang == Language.ENGLISH else f"Gelir büyümesi ({rg:.1f}%) olumlu")
            else:
                parts.append(f"Revenue decline ({rg:.1f}%) signals contraction" if lang == Language.ENGLISH else f"Gelir düşüşü ({rg:.1f}%) daralmayı gösteriyor")
        return ". ".join(parts) + "." if parts else ("No growth data available" if lang == Language.ENGLISH else "Büyüme verisi mevcut değil")

    def _explain_financial_health(self, de, cr, dy, evidence, lang) -> str:
        parts = []
        if de is not None:
            if de < 0.5:
                parts.append(f"Low debt (D/E: {de:.2f}) provides financial flexibility" if lang == Language.ENGLISH else f"Düşük borç (B/Ö: {de:.2f}) finansal esneklik sağlıyor")
            elif de < 1.5:
                parts.append(f"Moderate leverage (D/E: {de:.2f})" if lang == Language.ENGLISH else f"Orta düzey kaldıraç (B/Ö: {de:.2f})")
            else:
                parts.append(f"High debt (D/E: {de:.2f}) increases financial risk" if lang == Language.ENGLISH else f"Yüksek borç (B/Ö: {de:.2f}) finansal riski artırıyor")
        if cr is not None:
            if cr > 2:
                parts.append(f"Strong liquidity (Current Ratio: {cr:.2f})" if lang == Language.ENGLISH else f"Güçlü likidite (Cari Oran: {cr:.2f})")
            elif cr > 1:
                parts.append(f"Adequate liquidity (Current Ratio: {cr:.2f})" if lang == Language.ENGLISH else f"Yeterli likidite (Cari Oran: {cr:.2f})")
            else:
                parts.append(f"Weak liquidity (Current Ratio: {cr:.2f}) raises concern" if lang == Language.ENGLISH else f"Zayıf likidite (Cari Oran: {cr:.2f}) endişe yaratıyor")
        if dy is not None and dy > 0:
            if dy > 3:
                parts.append(f"Attractive dividend yield ({dy:.1f}%)" if lang == Language.ENGLISH else f"Cazip temettü verimi ({dy:.1f}%)")
            else:
                parts.append(f"Dividend yield ({dy:.1f}%)" if lang == Language.ENGLISH else f"Temettü verimi ({dy:.1f}%)")
        return ". ".join(parts) + "." if parts else ("No financial health data available" if lang == Language.ENGLISH else "Finansal sağlık verisi mevcut değil")

    def _format_signal_list(self, evidence, direction, lang) -> str:
        if not evidence:
            return "None detected" if lang == Language.ENGLISH else "Tespit edilmedi"
        lines = []
        for e in evidence[:10]:
            sign = "+" if direction == SignalDirection.POSITIVE else "-"
            lines.append(f"{sign} {e.description}")
        return "\n".join(lines)
