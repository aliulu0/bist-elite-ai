from __future__ import annotations

import time

from modules.explainability_engine.core.types import (
    EvidenceObject, ExplanationCategory, ExplanationLevel, ExplanationResult,
    ExplanationType, ExplanationSection, Language, SignalDirection, SourceEngine,
)
from modules.explainability_engine.core.base import BaseExplanationBuilder
from modules.explainability_engine.normalizer.normalizer import EvidenceNormalizer


class VolumeExplanationBuilder(BaseExplanationBuilder):

    @property
    def explanation_type(self) -> ExplanationType:
        return ExplanationType.VOLUME

    @property
    def name(self) -> str:
        return "volume_explanation"

    def build(
        self, symbol: str, metrics: dict, evidence: list[EvidenceObject],
        level: ExplanationLevel = ExplanationLevel.DETAILED,
        language: Language = Language.ENGLISH, **kwargs,
    ) -> ExplanationResult:
        start = time.perf_counter()
        normalizer = EvidenceNormalizer()
        sections = []

        vr = metrics.get("volume_ratio")
        obv = metrics.get("obv_trend")
        cmf = metrics.get("cmf")
        mfi = metrics.get("mfi")
        rv = metrics.get("relative_volume")
        nvi = metrics.get("nvi_trend")

        sections.append(ExplanationSection(
            title="Volume Analysis" if language == Language.ENGLISH else "Hacim Analizi",
            content=self._explain_volume(vr, rv, nvi, language),
            category=ExplanationCategory.SUPPORTING_EVIDENCE,
            evidence_refs=[e.reference for e in evidence if e.metric_name in ("volume_ratio", "relative_volume", "nvi_trend")],
        ))

        sections.append(ExplanationSection(
            title="Money Flow Analysis" if language == Language.ENGLISH else "Para Akışı Analizi",
            content=self._explain_money_flow(cmf, mfi, language),
            category=ExplanationCategory.KEY_REASONS,
            evidence_refs=[e.reference for e in evidence if e.metric_name in ("cmf", "mfi")],
        ))

        sections.append(ExplanationSection(
            title="Accumulation/Distribution" if language == Language.ENGLISH else "Birikim/Dağılım",
            content=self._explain_accumulation(obv, cmf, language),
            category=ExplanationCategory.SUPPORTING_EVIDENCE,
            evidence_refs=[e.reference for e in evidence if e.metric_name in ("obv_trend", "cmf")],
        ))

        pos_ev = [e for e in evidence if e.direction == SignalDirection.POSITIVE and e.source_engine == SourceEngine.VOLUME]
        neg_ev = [e for e in evidence if e.direction == SignalDirection.NEGATIVE and e.source_engine == SourceEngine.VOLUME]

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
        vev = [e for e in evidence if e.source_engine == SourceEngine.VOLUME]
        return ExplanationResult(
            symbol=symbol, explanation_type=ExplanationType.VOLUME,
            level=level, language=language, sections=sections,
            evidence_count=len(vev),
            evidence_quality_avg=sum(e.confidence for e in vev) / max(1, len(vev)),
            scores=normalizer.compute_explainability_scores(vev),
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"), generation_time_ms=elapsed,
        )

    def _explain_volume(self, vr, rv, nvi, lang) -> str:
        parts = []
        if vr is not None:
            if vr > 2:
                parts.append(f"Volume spike ({vr:.1f}x average) — strong institutional interest" if lang == Language.ENGLISH else f"Hacim patlaması ({vr:.1f}x ortalama) — güçlü kurumsal ilgi")
            elif vr > 1.5:
                parts.append(f"Above-average volume ({vr:.1f}x) — elevated activity" if lang == Language.ENGLISH else f"Ortalama üstü hacim ({vr:.1f}x) — artan aktivite")
            elif vr < 0.5:
                parts.append(f"Low volume ({vr:.1f}x) — weak participation" if lang == Language.ENGLISH else f"Düşük hacim ({vr:.1f}x) — zayıf katılım")
            else:
                parts.append(f"Normal volume ({vr:.1f}x)" if lang == Language.ENGLISH else f"Normal hacim ({vr:.1f}x)")
        if rv is not None and rv > 0:
            parts.append(f"Relative volume: {rv:.1f}x" if lang == Language.ENGLISH else f"Bağıl hacim: {rv:.1f}x")
        return ". ".join(parts) + "." if parts else "Insufficient volume data" if lang == Language.ENGLISH else "Yetersiz hacim verisi"

    def _explain_money_flow(self, cmf, mfi, lang) -> str:
        parts = []
        if cmf is not None:
            if cmf > 0.1:
                parts.append(f"CMF ({cmf:.2f}) shows strong accumulation" if lang == Language.ENGLISH else f"CMF ({cmf:.2f}) güçlü birikimi gösteriyor")
            elif cmf > 0:
                parts.append(f"CMF ({cmf:.2f}) mild accumulation" if lang == Language.ENGLISH else f"CMF ({cmf:.2f}) hafif birikim")
            elif cmf > -0.1:
                parts.append(f"CMF ({cmf:.2f}) mild distribution" if lang == Language.ENGLISH else f"CMF ({cmf:.2f}) hafif dağılım")
            else:
                parts.append(f"CMF ({cmf:.2f}) shows distribution — smart money exiting" if lang == Language.ENGLISH else f"CMF ({cmf:.2f}) dağılım gösteriyor — akıllı para çıkıyor")
        if mfi is not None:
            if mfi < 20:
                parts.append(f"MFI ({mfi:.1f}) oversold — potential accumulation zone" if lang == Language.ENGLISH else f"MFI ({mfi:.1f}) aşırı satım — olası birikim bölgesi")
            elif mfi > 80:
                parts.append(f"MFI ({mfi:.1f}) overbought" if lang == Language.ENGLISH else f"MFI ({mfi:.1f}) aşırı alım")
            else:
                parts.append(f"MFI ({mfi:.1f}) neutral" if lang == Language.ENGLISH else f"MFI ({mfi:.1f}) nötr")
        return ". ".join(parts) + "." if parts else "Insufficient money flow data" if lang == Language.ENGLISH else "Yetersiz para akışı verisi"

    def _explain_accumulation(self, obv, cmf, lang) -> str:
        parts = []
        if obv is not None:
            if obv > 0:
                parts.append("OBV trending up — accumulation phase" if lang == Language.ENGLISH else "OBV yükselişte — birikim aşaması")
            elif obv < 0:
                parts.append("OBV declining — distribution phase" if lang == Language.ENGLISH else "OBV düşüşte — dağılım aşaması")
            else:
                parts.append("OBV flat" if lang == Language.ENGLISH else "OBV düz")
        return ". ".join(parts) + "." if parts else "No OBV data" if lang == Language.ENGLISH else "OBV verisi yok"
