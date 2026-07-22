from __future__ import annotations

import time

from modules.explainability_engine.core.types import (
    ConflictInfo, ConflictType, EvidenceObject, ExplanationCategory,
    ExplanationLevel, ExplanationResult, ExplanationType, ExplanationSection,
    Language, SeverityLevel, SignalDirection, SourceEngine,
)
from modules.explainability_engine.core.base import BaseExplanationBuilder
from modules.explainability_engine.normalizer.normalizer import EvidenceNormalizer


class ConflictExplanationBuilder(BaseExplanationBuilder):

    @property
    def explanation_type(self) -> ExplanationType:
        return ExplanationType.ELITE_SCORE

    @property
    def name(self) -> str:
        return "conflict_explanation"

    def build(
        self, symbol: str, metrics: dict, evidence: list[EvidenceObject],
        level: ExplanationLevel = ExplanationLevel.DETAILED,
        language: Language = Language.ENGLISH, **kwargs,
    ) -> ExplanationResult:
        start = time.perf_counter()
        normalizer = EvidenceNormalizer()
        sections = []
        conflicts = self._detect_conflicts(evidence, metrics)

        if conflicts:
            sections.append(ExplanationSection(
                title="Conflicting Indicators" if language == Language.ENGLISH else "Çelişkili Göstergeler",
                content=self._explain_conflicts(conflicts, language),
                category=ExplanationCategory.CONFLICT_EXPLANATION,
            ))
            for c in conflicts:
                sections.append(ExplanationSection(
                    title=f"Conflict: {c.conflict_type.value}" if language == Language.ENGLISH else f"Çelişki: {c.conflict_type.value}",
                    content=c.description,
                    category=ExplanationCategory.CONFLICT_EXPLANATION,
                ))
        else:
            sections.append(ExplanationSection(
                title="Indicator Consensus" if language == Language.ENGLISH else "Gösterge Uzlaşması",
                content="No significant conflicts detected between indicators" if language == Language.ENGLISH else "Göstergeler arasında önemli çelişki tespit edilmedi",
                category=ExplanationCategory.SUPPORTING_EVIDENCE,
            ))

        weak = self._detect_weak_confirmations(evidence)
        if weak:
            sections.append(ExplanationSection(
                title="Weak Confirmations" if language == Language.ENGLISH else "Zayıf Doğrulamalar",
                content="\n".join(f"- {w}" for w in weak),
                category=ExplanationCategory.MISSING_CONFIRMATIONS,
            ))

        elapsed = (time.perf_counter() - start) * 1000
        return ExplanationResult(
            symbol=symbol, explanation_type=ExplanationType.ELITE_SCORE,
            level=level, language=language, sections=sections, conflicts=conflicts,
            evidence_count=len(evidence),
            scores=normalizer.compute_explainability_scores(evidence),
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"), generation_time_ms=elapsed,
        )

    def _detect_conflicts(self, evidence, metrics) -> list[ConflictInfo]:
        conflicts = []
        positive_engines = set()
        negative_engines = set()
        for e in evidence:
            if e.direction == SignalDirection.POSITIVE:
                positive_engines.add(e.source_engine)
            elif e.direction == SignalDirection.NEGATIVE:
                negative_engines.add(e.source_engine)

        conflicting_engines = positive_engines & negative_engines
        for engine in conflicting_engines:
            pos = [e for e in evidence if e.source_engine == engine and e.direction == SignalDirection.POSITIVE]
            neg = [e for e in evidence if e.source_engine == engine and e.direction == SignalDirection.NEGATIVE]
            conflicts.append(ConflictInfo(
                conflict_type=ConflictType.SIGNAL_CONFLICT,
                description=f"{engine.value.title()} engine shows conflicting signals: {len(pos)} positive, {len(neg)} negative",
                involved_indicators=[e.metric_name for e in pos + neg],
                severity=SeverityLevel.MEDIUM if len(pos) == len(neg) else SeverityLevel.LOW,
            ))

        adx = metrics.get("adx")
        sma50 = metrics.get("sma_50")
        sma200 = metrics.get("sma_200")
        if adx is not None and adx < 20 and sma50 and sma200:
            if abs(sma50 - sma200) / max(sma200, 0.01) < 0.02:
                conflicts.append(ConflictInfo(
                    conflict_type=ConflictType.TREND_CONFLICT,
                    description="Low ADX with converging SMAs — no clear trend direction",
                    involved_indicators=["adx", "sma_50", "sma_200"],
                    severity=SeverityLevel.MEDIUM,
                ))

        rsi = metrics.get("rsi")
        macd = metrics.get("macd")
        macd_sig = metrics.get("macd_signal")
        if rsi is not None and macd is not None and macd_sig is not None:
            rsi_bull = rsi < 40
            macd_bull = macd > macd_sig
            if rsi_bull != macd_bull:
                conflicts.append(ConflictInfo(
                    conflict_type=ConflictType.INDICATOR_CONFLICT,
                    description=f"RSI ({rsi:.1f}) and MACD showing divergent signals",
                    involved_indicators=["rsi", "macd"],
                    severity=SeverityLevel.LOW,
                ))

        vol = metrics.get("volume_ratio")
        price_up = metrics.get("momentum", 0) > 0
        if vol is not None and vol > 1.5 and not price_up:
            conflicts.append(ConflictInfo(
                conflict_type=ConflictType.WEAK_CONFIRMATION,
                description="High volume without price confirmation — potential distribution",
                involved_indicators=["volume_ratio", "momentum"],
                severity=SeverityLevel.MEDIUM,
            ))

        return conflicts

    def _explain_conflicts(self, conflicts, lang) -> str:
        count = len(conflicts)
        critical = sum(1 for c in conflicts if c.severity in (SeverityLevel.CRITICAL, SeverityLevel.HIGH))
        if critical > 0:
            return f"{count} conflicts detected ({critical} critical). Conflicting signals reduce confidence in the overall analysis." if lang == Language.ENGLISH else f"{count} çelişki tespit edildi ({critical} kritik). Çelişkili sinyaller genel analiz güvenini azaltıyor."
        return f"{count} minor conflicts detected. These are normal in complex market conditions." if lang == Language.ENGLISH else f"{count} küçük çelişki tespit edildi. Bunlar karmaşık piyasa koşullarında normaldir."

    def _detect_weak_confirmations(self, evidence) -> list[str]:
        weak = []
        engines = {}
        for e in evidence:
            eng = e.source_engine.value
            if eng not in engines:
                engines[eng] = {"pos": 0, "neg": 0, "total": 0}
            engines[eng]["total"] += 1
            if e.direction == SignalDirection.POSITIVE:
                engines[eng]["pos"] += 1
            elif e.direction == SignalDirection.NEGATIVE:
                engines[eng]["neg"] += 1

        for eng, counts in engines.items():
            if counts["total"] > 0 and counts["pos"] > 0 and counts["neg"] > 0:
                ratio = min(counts["pos"], counts["neg"]) / max(counts["pos"], counts["neg"])
                if ratio > 0.6:
                    weak.append(f"{eng}: mixed signals ({counts['pos']} positive, {counts['neg']} negative)")
        return weak
