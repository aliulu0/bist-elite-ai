from __future__ import annotations

from modules.explainability_engine.core.types import (
    EvidenceObject, ExplanationResult, ExplanationSection, ExplanationType,
    ExplanationLevel, Language, SignalDirection,
)


class ExplanationValidator:

    def validate_result(self, result: ExplanationResult) -> list[str]:
        errors = []
        if not result.symbol:
            errors.append("Symbol is required")
        if not isinstance(result.explanation_type, ExplanationType):
            errors.append(f"Invalid explanation type: {result.explanation_type}")
        if not isinstance(result.level, ExplanationLevel):
            errors.append(f"Invalid explanation level: {result.level}")
        if not isinstance(result.language, Language):
            errors.append(f"Invalid language: {result.language}")
        if not result.sections:
            errors.append("At least one section is required")
        for i, section in enumerate(result.sections):
            section_errors = self.validate_section(section)
            for e in section_errors:
                errors.append(f"Section {i} ({section.title}): {e}")
        return errors

    def validate_section(self, section: ExplanationSection) -> list[str]:
        errors = []
        if not section.title:
            errors.append("Section title is required")
        if not section.content:
            errors.append("Section content is required")
        return errors

    def validate_evidence(self, evidence: list[EvidenceObject]) -> list[str]:
        errors = []
        if not evidence:
            errors.append("At least one evidence object is required")
            return errors
        for i, e in enumerate(evidence):
            if not e.reference:
                errors.append(f"Evidence {i}: reference is required")
            if not e.description:
                errors.append(f"Evidence {i}: description is required")
            if e.confidence < 0 or e.confidence > 1:
                errors.append(f"Evidence {i}: confidence must be 0-1, got {e.confidence}")
        return errors

    def has_evidence_backing(self, result: ExplanationResult) -> bool:
        for section in result.sections:
            if section.category.value in ("key_reasons", "positive_signals", "negative_signals", "red_flags"):
                if not section.evidence_refs:
                    return False
        return True

    def coverage_ratio(self, result: ExplanationResult) -> float:
        sections_needing_evidence = [
            s for s in result.sections
            if s.category.value in ("key_reasons", "positive_signals", "negative_signals")
        ]
        if not sections_needing_evidence:
            return 1.0
        covered = sum(1 for s in sections_needing_evidence if s.evidence_refs)
        return covered / len(sections_needing_evidence)

    def validate_comprehensive_input(
        self, symbol: str, metrics: dict, explanation_type: ExplanationType,
    ) -> list[str]:
        errors = []
        if not symbol or not isinstance(symbol, str):
            errors.append("Symbol must be a non-empty string")
        if not isinstance(metrics, dict):
            errors.append("Metrics must be a dictionary")
        elif len(metrics) == 0:
            errors.append("Metrics dictionary is empty")
        if not isinstance(explanation_type, ExplanationType):
            errors.append(f"Invalid explanation type: {explanation_type}")
        return errors

    def is_valid(self, result: ExplanationResult) -> bool:
        return len(self.validate_result(result)) == 0
