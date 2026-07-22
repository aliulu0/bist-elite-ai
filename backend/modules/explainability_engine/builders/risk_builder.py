from __future__ import annotations

import time

from modules.explainability_engine.core.types import (
    EvidenceObject, ExplanationCategory, ExplanationLevel, ExplanationResult,
    ExplanationType, ExplanationSection, Language, RiskSummary, SeverityLevel,
    SignalDirection, SourceEngine,
)
from modules.explainability_engine.core.base import BaseExplanationBuilder
from modules.explainability_engine.normalizer.normalizer import EvidenceNormalizer


class RiskExplanationBuilder(BaseExplanationBuilder):

    @property
    def explanation_type(self) -> ExplanationType:
        return ExplanationType.RISK

    @property
    def name(self) -> str:
        return "risk_explanation"

    def build(
        self, symbol: str, metrics: dict, evidence: list[EvidenceObject],
        level: ExplanationLevel = ExplanationLevel.DETAILED,
        language: Language = Language.ENGLISH, **kwargs,
    ) -> ExplanationResult:
        start = time.perf_counter()
        normalizer = EvidenceNormalizer()
        sections = []
        risks = []

        vol = metrics.get("volatility")
        dd = metrics.get("max_drawdown")
        beta = metrics.get("beta")
        var_val = metrics.get("var_95")
        sharpe = metrics.get("sharpe_ratio")
        sortino = metrics.get("sortino_ratio")
        de = metrics.get("debt_to_equity")
        volume_ratio = metrics.get("volume_ratio")

        if vol is not None:
            sections.append(ExplanationSection(
                title="Volatility Risk" if language == Language.ENGLISH else "Volatilite Riski",
                content=self._explain_volatility(vol, language),
                category=ExplanationCategory.RISK_SUMMARY,
                evidence_refs=[e.reference for e in evidence if e.metric_name == "volatility"],
            ))
            if vol > 40:
                risks.append(RiskSummary(description=f"High volatility ({vol:.1f}%)" if language == Language.ENGLISH else f"Yüksek volatilite ({vol:.1f}%)", risk_type="volatility", severity=SeverityLevel.HIGH, probability=0.8, impact=0.7))

        if dd is not None:
            sections.append(ExplanationSection(
                title="Drawdown Risk" if language == Language.ENGLISH else "Çekişme Riski",
                content=self._explain_drawdown(dd, language),
                category=ExplanationCategory.RISK_SUMMARY,
                evidence_refs=[e.reference for e in evidence if e.metric_name == "max_drawdown"],
            ))
            if dd > 30:
                risks.append(RiskSummary(description=f"High drawdown risk ({dd:.1f}%)" if language == Language.ENGLISH else f"Yüksek drawdown riski ({dd:.1f}%)", risk_type="drawdown", severity=SeverityLevel.HIGH, probability=0.7, impact=0.8))

        if beta is not None:
            sections.append(ExplanationSection(
                title="Market Risk" if language == Language.ENGLISH else "Piyasa Riski",
                content=self._explain_beta(beta, language),
                category=ExplanationCategory.RISK_SUMMARY,
            ))
            if beta > 2.0:
                risks.append(RiskSummary(description=f"High beta ({beta:.2f}) — amplified market moves" if language == Language.ENGLISH else f"Yüksek beta ({beta:.2f}) — piyasa hareketleri büyütülüyor", risk_type="market", severity=SeverityLevel.MEDIUM, probability=0.6, impact=0.6))

        if var_val is not None and var_val > 5:
            risks.append(RiskSummary(description=f"Elevated VaR ({var_val:.1f}%)" if language == Language.ENGLISH else f"Yüksek VaR ({var_val:.1f}%)", risk_type="liquidity", severity=SeverityLevel.MEDIUM, probability=0.5, impact=0.6))

        if de is not None and de > 2.0:
            risks.append(RiskSummary(description=f"High leverage (D/E: {de:.2f})" if language == Language.ENGLISH else f"Yüksek kaldıraç (B/Ö: {de:.2f})", risk_type="financial", severity=SeverityLevel.HIGH, probability=0.6, impact=0.7))

        if volume_ratio is not None and volume_ratio < 0.5:
            risks.append(RiskSummary(description=f"Low liquidity (volume ratio: {volume_ratio:.2f}x)" if language == Language.ENGLISH else f"Düşük likidite (hacim oranı: {volume_ratio:.2f}x)", risk_type="liquidity", severity=SeverityLevel.MEDIUM, probability=0.5, impact=0.5))

        if not sections:
            sections.append(ExplanationSection(
                title="Risk Summary" if language == Language.ENGLISH else "Risk Özeti",
                content="Insufficient data for comprehensive risk assessment" if language == Language.ENGLISH else "Kapsamlı risk değerlendirmesi için yetersiz veri",
                category=ExplanationCategory.RISK_SUMMARY,
            ))

        risk_ev = [e for e in evidence if e.source_engine == SourceEngine.RISK]
        pos_ev = [e for e in evidence if e.direction == SignalDirection.POSITIVE and e.source_engine == SourceEngine.RISK]
        neg_ev = [e for e in evidence if e.direction == SignalDirection.NEGATIVE and e.source_engine == SourceEngine.RISK]

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
        return ExplanationResult(
            symbol=symbol, explanation_type=ExplanationType.RISK,
            level=level, language=language, sections=sections, risks=risks,
            evidence_count=len(risk_ev),
            evidence_quality_avg=sum(e.confidence for e in risk_ev) / max(1, len(risk_ev)),
            scores=normalizer.compute_explainability_scores(risk_ev),
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"), generation_time_ms=elapsed,
        )

    def _explain_volatility(self, vol, lang) -> str:
        if vol > 40:
            return f"Very high volatility ({vol:.1f}%) — significant price swings expected" if lang == Language.ENGLISH else f"Çok yüksek volatilite ({vol:.1f}%) — önemli fiyat salınımları bekleniyor"
        elif vol > 25:
            return f"Elevated volatility ({vol:.1f}%) — above normal range" if lang == Language.ENGLISH else f"Yüksek volatilite ({vol:.1f}%) — normal aralık üstünde"
        elif vol > 15:
            return f"Normal volatility ({vol:.1f}%)" if lang == Language.ENGLISH else f"Normal volatilite ({vol:.1f}%)"
        else:
            return f"Low volatility ({vol:.1f}%) — unusually stable" if lang == Language.ENGLISH else f"Düşük volatilite ({vol:.1f}%) — alışılmadık derecede istikrarlı"

    def _explain_drawdown(self, dd, lang) -> str:
        if dd > 30:
            return f"Severe historical drawdown ({dd:.1f}%) — high recovery risk" if lang == Language.ENGLISH else f"Ciddi tarihsel drawdown ({dd:.1f}%) — yüksek kurtarma riski"
        elif dd > 15:
            return f"Moderate drawdown history ({dd:.1f}%)" if lang == Language.ENGLISH else f"Orta düzey drawdown geçmişi ({dd:.1f}%)"
        else:
            return f"Controlled drawdown ({dd:.1f}%) — good risk management" if lang == Language.ENGLISH else f"Kontrollü drawdown ({dd:.1f}%) — iyi risk yönetimi"

    def _explain_beta(self, beta, lang) -> str:
        if beta > 2.0:
            return f"High beta ({beta:.2f}) — moves more than twice the market" if lang == Language.ENGLISH else f"Yüksek beta ({beta:.2f}) — piyasanın iki katından fazla hareket ediyor"
        elif beta > 1.2:
            return f"Above-market beta ({beta:.2f})" if lang == Language.ENGLISH else f"Piyasa üstü beta ({beta:.2f})"
        elif beta > 0.5:
            return f"Market-aligned beta ({beta:.2f})" if lang == Language.ENGLISH else f"Piyasaya uyumlu beta ({beta:.2f})"
        else:
            return f"Low beta ({beta:.2f}) — defensive characteristics" if lang == Language.ENGLISH else f"Düşük beta ({beta:.2f}) — defansif özellikler"
