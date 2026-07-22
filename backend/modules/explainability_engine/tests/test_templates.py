from modules.explainability_engine.templates.explanation_templates import ExplanationTemplateEngine
from modules.explainability_engine.core.types import ExplanationType, ExplanationLevel, Language


class TestExplanationTemplateEngine:
    def setup_method(self):
        self.engine = ExplanationTemplateEngine()

    def test_get_template_exists(self):
        template = self.engine.get_template(ExplanationType.FUNDAMENTAL, ExplanationLevel.SUMMARY, Language.ENGLISH)
        assert template is not None
        assert "sections" in template

    def test_get_template_not_found(self):
        template = self.engine.get_template(ExplanationType.FUNDAMENTAL, "nonexistent_level", Language.ENGLISH)
        assert template is None

    def test_get_sections(self):
        sections = self.engine.get_sections(ExplanationType.FUNDAMENTAL, ExplanationLevel.SUMMARY)
        assert isinstance(sections, list)
        assert len(sections) > 0

    def test_list_templates(self):
        templates = self.engine.list_templates()
        assert len(templates) > 0
        assert all("type" in t for t in templates)

    def test_all_types_have_templates(self):
        for etype in ExplanationType:
            template = self.engine.get_template(etype, ExplanationLevel.SUMMARY, Language.ENGLISH)
            assert template is not None, f"No template for {etype.value}"

    def test_turkish_templates(self):
        for etype in ExplanationType:
            template = self.engine.get_template(etype, ExplanationLevel.SUMMARY, Language.TURKISH)
            assert template is not None, f"No Turkish template for {etype.value}"

    def test_all_levels_have_templates(self):
        for level in ExplanationLevel:
            template = self.engine.get_template(ExplanationType.FUNDAMENTAL, level, Language.ENGLISH)
            assert template is not None, f"No template for level {level.value}"
