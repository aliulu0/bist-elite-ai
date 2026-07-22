from __future__ import annotations

import math

from modules.explainability_engine.core.types import (
    EvidenceObject,
    ExplainabilityScore,
    ExplanationResult,
    SignalDirection,
)


class EvidenceNormalizer:

    def normalize_scores(
        self,
        scores: dict[str, float],
        target_min: float = 0.0,
        target_max: float = 100.0,
    ) -> dict[str, float]:
        if not scores:
            return {}
        values = list(scores.values())
        data_min = min(values)
        data_max = max(values)
        data_range = data_max - data_min
        if data_range == 0:
            mid = (target_min + target_max) / 2.0
            return {k: mid for k in scores}
        return {
            k: target_min + ((v - data_min) / data_range) * (target_max - target_min)
            for k, v in scores.items()
        }

    def normalize_value(
        self,
        value: float,
        data_min: float,
        data_max: float,
        target_min: float = 0.0,
        target_max: float = 100.0,
    ) -> float:
        data_range = data_max - data_min
        if data_range == 0:
            return (target_min + target_max) / 2.0
        return target_min + ((value - data_min) / data_range) * (target_max - target_min)

    def normalize_01(self, value: float) -> float:
        return max(0.0, min(1.0, value))

    def normalize_evidence(
        self,
        evidence: list[EvidenceObject],
    ) -> list[EvidenceObject]:
        if not evidence:
            return []
        confidences = [e.confidence for e in evidence]
        values = [e.value for e in evidence]

        c_min, c_max = min(confidences), max(confidences)
        v_min, v_max = min(values), max(values) if values else (0.0, 1.0)

        result = []
        for e in evidence:
            norm_conf = self.normalize_value(e.confidence, c_min, c_max) if c_max > c_min else e.confidence
            norm_val = self.normalize_value(e.value, v_min, v_max) if v_max > v_min else e.value
            result.append(EvidenceObject(
                reference=e.reference,
                description=e.description,
                source_engine=e.source_engine,
                value=norm_val,
                confidence=norm_conf,
                timestamp=e.timestamp,
                metric_name=e.metric_name,
                direction=e.direction,
                metadata=e.metadata,
            ))
        return result

    def compute_explainability_scores(
        self,
        evidence: list[EvidenceObject],
        total_expected: int = 20,
    ) -> ExplainabilityScore:
        if not evidence:
            return ExplainabilityScore()

        evidence_count = len(evidence)
        valid_evidence = [e for e in evidence if e.is_valid()]
        valid_count = len(valid_evidence)

        coverage = min(1.0, valid_count / max(1, total_expected))

        avg_confidence = sum(e.confidence for e in valid_evidence) / max(1, valid_count)

        engine_sources = set(e.source_engine for e in valid_evidence)
        total_engines = len(SourceEngine)
        transparency = min(1.0, len(engine_sources) / max(1, total_engines))

        directional_count = sum(
            1 for e in valid_evidence
            if e.direction != SignalDirection.NEUTRAL
        )
        directional_ratio = directional_count / max(1, valid_count)

        explainability = (coverage * 0.3 + avg_confidence * 0.4 + directional_ratio * 0.3)

        quality_score = avg_confidence * coverage

        return ExplainabilityScore(
            explainability=round(explainability * 100, 2),
            coverage=round(coverage * 100, 2),
            transparency=round(transparency * 100, 2),
            evidence_quality=round(quality_score * 100, 2),
        )

    def aggregate_direction(
        self,
        evidence: list[EvidenceObject],
    ) -> tuple[SignalDirection, float]:
        if not evidence:
            return SignalDirection.NEUTRAL, 0.0

        pos = sum(e.confidence for e in evidence if e.direction == SignalDirection.POSITIVE)
        neg = sum(e.confidence for e in evidence if e.direction == SignalDirection.NEGATIVE)
        total = pos + neg
        if total == 0:
            return SignalDirection.NEUTRAL, 0.0

        net = (pos - neg) / total
        if net > 0.1:
            return SignalDirection.POSITIVE, net
        elif net < -0.1:
            return SignalDirection.NEGATIVE, abs(net)
        return SignalDirection.NEUTRAL, abs(net)

    def compute_signal_strength(
        self,
        evidence: list[EvidenceObject],
        direction: SignalDirection | None = None,
    ) -> float:
        filtered = evidence
        if direction is not None:
            filtered = [e for e in evidence if e.direction == direction]
        if not filtered:
            return 0.0
        total_conf = sum(e.confidence for e in filtered)
        weighted_sum = sum(e.value * e.confidence for e in filtered)
        return weighted_sum / max(0.001, total_conf)

    def detect_conflicts(
        self,
        evidence: list[EvidenceObject],
        threshold: float = 0.3,
    ) -> list[tuple[EvidenceObject, EvidenceObject, str]]:
        conflicts = []
        for i, e1 in enumerate(evidence):
            for e2 in evidence[i + 1:]:
                if e1.source_engine == e2.source_engine:
                    continue
                if (e1.direction != SignalDirection.NEUTRAL and
                        e2.direction != SignalDirection.NEUTRAL and
                        e1.direction != e2.direction):
                    strength = min(e1.confidence, e2.confidence)
                    if strength >= threshold:
                        conflicts.append((e1, e2, f"Conflict between {e1.metric_name} and {e2.metric_name}"))
        return conflicts


from modules.explainability_engine.core.types import SourceEngine
