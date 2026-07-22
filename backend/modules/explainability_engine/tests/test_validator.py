from modules.explainability_engine.validators.validator import ExplanationValidator
from modules.explainability_engine.core.types import (
    ExplanationType, ExplanationLevel, Language, ExplanationResult,
    ExplainabilityScore, ExplanationSection, EvidenceObject, ExplanationCategory,
    SignalDirection, SourceEngine,
)


class TestExplanationValidator:
    def setup_method(self):
        self.validator = ExplanationValidator()

    def test_validate_result_valid(self):
        result = ExplanationResult(
            symbol="TEST", explanation_type=ExplanationType.FUNDAMENTAL,
            level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
        )
        result.sections = [
            ExplanationSection(title="T", content="C", category=ExplanationCategory.SUPPORTING_EVIDENCE),
        ]
        errors = self.validator.validate_result(result)
        assert len(errors) == 0

    def test_validate_result_empty_symbol(self):
        result = ExplanationResult(
            symbol="", explanation_type=ExplanationType.FUNDAMENTAL,
            level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
        )
        errors = self.validator.validate_result(result)
        assert len(errors) > 0

    def test_validate_result_no_sections(self):
        result = ExplanationResult(
            symbol="TEST", explanation_type=ExplanationType.FUNDAMENTAL,
            level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
        )
        errors = self.validator.validate_result(result)
        assert len(errors) > 0

    def test_validate_section_valid(self):
        section = ExplanationSection(
            title="PE Analysis", content="PE is fair",
            category=ExplanationCategory.SUPPORTING_EVIDENCE,
        )
        errors = self.validator.validate_section(section)
        assert len(errors) == 0

    def test_validate_section_empty_title(self):
        section = ExplanationSection(
            title="", content="content",
            category=ExplanationCategory.SUPPORTING_EVIDENCE,
        )
        errors = self.validator.validate_section(section)
        assert len(errors) > 0

    def test_validate_section_empty_content(self):
        section = ExplanationSection(
            title="Title", content="",
            category=ExplanationCategory.SUPPORTING_EVIDENCE,
        )
        errors = self.validator.validate_section(section)
        assert len(errors) > 0

    def test_validate_evidence_valid(self):
        evidence = [EvidenceObject(
            reference="pe_ratio", description="P/E ratio",
            source_engine=SourceEngine.FINANCIAL,
        )]
        errors = self.validator.validate_evidence(evidence)
        assert len(errors) == 0

    def test_validate_evidence_empty_list(self):
        errors = self.validator.validate_evidence([])
        assert len(errors) > 0

    def test_validate_evidence_empty_reference(self):
        evidence = [EvidenceObject(
            reference="", description="P/E",
            source_engine=SourceEngine.FINANCIAL,
        )]
        errors = self.validator.validate_evidence(evidence)
        assert len(errors) > 0

    def test_has_evidence_backing_true(self):
        result = ExplanationResult(
            symbol="TEST", explanation_type=ExplanationType.FUNDAMENTAL,
            level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
            evidence_count=5,
        )
        result.sections = [
            ExplanationSection(
                title="T", content="C", category=ExplanationCategory.KEY_REASONS,
                evidence_refs=["ref1"],
            ),
        ]
        assert self.validator.has_evidence_backing(result) is True

    def test_has_evidence_backing_no_refs(self):
        result = ExplanationResult(
            symbol="TEST", explanation_type=ExplanationType.FUNDAMENTAL,
            level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
            evidence_count=0,
        )
        result.sections = [
            ExplanationSection(
                title="T", content="C", category=ExplanationCategory.KEY_REASONS,
                evidence_refs=[],
            ),
        ]
        assert self.validator.has_evidence_backing(result) is False

    def test_coverage_ratio_empty(self):
        result = ExplanationResult(
            symbol="TEST", explanation_type=ExplanationType.FUNDAMENTAL,
            level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
        )
        result.sections = []
        ratio = self.validator.coverage_ratio(result)
        assert ratio == 1.0

    def test_coverage_ratio_with_sections(self):
        result = ExplanationResult(
            symbol="TEST", explanation_type=ExplanationType.FUNDAMENTAL,
            level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
        )
        result.sections = [
            ExplanationSection(title="T1", content="C1", category=ExplanationCategory.KEY_REASONS, evidence_refs=["ref1"]),
            ExplanationSection(title="T2", content="C2", category=ExplanationCategory.POSITIVE_SIGNALS, evidence_refs=[]),
        ]
        ratio = self.validator.coverage_ratio(result)
        assert 0.0 <= ratio <= 1.0

    def test_validate_comprehensive_input_valid(self):
        errors = self.validator.validate_comprehensive_input(
            "TEST", {"pe_ratio": 15.0}, ExplanationType.FUNDAMENTAL,
        )
        assert len(errors) == 0

    def test_validate_comprehensive_input_empty_symbol(self):
        errors = self.validator.validate_comprehensive_input(
            "", {"pe_ratio": 15.0}, ExplanationType.FUNDAMENTAL,
        )
        assert len(errors) > 0

    def test_validate_comprehensive_input_empty_metrics(self):
        errors = self.validator.validate_comprehensive_input(
            "TEST", {}, ExplanationType.FUNDAMENTAL,
        )
        assert len(errors) > 0

    def test_is_valid_true(self):
        result = ExplanationResult(
            symbol="TEST", explanation_type=ExplanationType.FUNDAMENTAL,
            level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
        )
        result.sections = [
            ExplanationSection(title="T", content="C", category=ExplanationCategory.SUPPORTING_EVIDENCE),
        ]
        assert self.validator.is_valid(result) is True

    def test_is_valid_false(self):
        result = ExplanationResult(
            symbol="", explanation_type=ExplanationType.FUNDAMENTAL,
            level=ExplanationLevel.DETAILED, language=Language.ENGLISH,
        )
        assert self.validator.is_valid(result) is False
