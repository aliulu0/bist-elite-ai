from __future__ import annotations

from modules.explainability_engine.core.types import (
    ExplanationType, ExplanationLevel, Language, ExplanationCategory,
)


class ExplanationTemplateEngine:

    def __init__(self) -> None:
        self._templates = self._build_default_templates()

    def get_template(
        self,
        explanation_type: ExplanationType,
        level: ExplanationLevel,
        language: Language = Language.ENGLISH,
    ) -> dict | None:
        key = (explanation_type, level, language)
        return self._templates.get(key)

    def get_sections(
        self,
        explanation_type: ExplanationType,
        level: ExplanationLevel,
    ) -> list[str]:
        template = self.get_template(explanation_type, level)
        if template:
            return template.get("sections", [])
        return []

    def list_templates(self) -> list[dict]:
        return [
            {
                "type": k[0].value,
                "level": k[1].value,
                "language": k[2].value,
                "sections": v.get("sections", []),
            }
            for k, v in self._templates.items()
        ]

    def _build_default_templates(self) -> dict:
        templates = {}
        base_sections = [
            ExplanationCategory.EXECUTIVE_SUMMARY.value,
            ExplanationCategory.KEY_REASONS.value,
            ExplanationCategory.SUPPORTING_EVIDENCE.value,
            ExplanationCategory.POSITIVE_SIGNALS.value,
            ExplanationCategory.NEGATIVE_SIGNALS.value,
            ExplanationCategory.FINAL_CONCLUSION.value,
        ]
        detailed_sections = base_sections + [
            ExplanationCategory.RED_FLAGS.value,
            ExplanationCategory.MISSING_CONFIRMATIONS.value,
            ExplanationCategory.HISTORICAL_CONTEXT.value,
            ExplanationCategory.RISK_SUMMARY.value,
            ExplanationCategory.EXPECTED_SCENARIO.value,
        ]
        expert_sections = detailed_sections + [
            ExplanationCategory.CONFLICT_EXPLANATION.value,
        ]

        for etype in ExplanationType:
            for lang in Language:
                templates[(etype, ExplanationLevel.SUMMARY, lang)] = {
                    "sections": [
                        ExplanationCategory.EXECUTIVE_SUMMARY.value,
                        ExplanationCategory.KEY_REASONS.value,
                        ExplanationCategory.FINAL_CONCLUSION.value,
                    ],
                }
                templates[(etype, ExplanationLevel.DETAILED, lang)] = {
                    "sections": base_sections,
                }
                templates[(etype, ExplanationLevel.EXPERT, lang)] = {
                    "sections": detailed_sections,
                }
                templates[(etype, ExplanationLevel.DEVELOPER, lang)] = {
                    "sections": expert_sections + ["evidence_count", "scores", "generation_time_ms"],
                }

        return templates
