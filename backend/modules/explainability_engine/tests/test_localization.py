from modules.explainability_engine.localization.localization import LocalizationService
from modules.explainability_engine.core.types import Language


class TestLocalizationService:
    def setup_method(self):
        self.service = LocalizationService()

    def test_translate_english(self):
        result = self.service.translate("pe_analysis", Language.ENGLISH)
        assert isinstance(result, str)
        assert len(result) > 0

    def test_translate_turkish(self):
        result = self.service.translate("pe_analysis", Language.TURKISH)
        assert isinstance(result, str)
        assert len(result) > 0

    def test_translate_unknown_key(self):
        result = self.service.translate("nonexistent_key_xyz", Language.ENGLISH)
        assert result == "nonexistent_key_xyz"

    def test_add_language_overwrite(self):
        self.service.add_language(Language.TURKISH, {"pe_analysis": "PE Degerleme"})
        result = self.service.translate("pe_analysis", Language.TURKISH)
        assert result == "PE Degerleme"

    def test_get_all_keys_english(self):
        keys = self.service.get_all_keys(Language.ENGLISH)
        assert isinstance(keys, list)
        assert len(keys) > 0
        assert "valuation_analysis" in keys

    def test_get_all_keys_turkish(self):
        keys = self.service.get_all_keys(Language.TURKISH)
        assert isinstance(keys, list)
        assert len(keys) > 0

    def test_translations_have_same_keys(self):
        en_keys = set(self.service.get_all_keys(Language.ENGLISH))
        tr_keys = set(self.service.get_all_keys(Language.TURKISH))
        assert len(en_keys - tr_keys) == 0, f"Missing Turkish keys: {en_keys - tr_keys}"
        assert len(tr_keys - en_keys) == 0, f"Missing English keys: {tr_keys - en_keys}"

    def test_has_common_keys(self):
        keys = self.service.get_all_keys(Language.ENGLISH)
        assert "valuation_analysis" in keys
        assert "trend_analysis" in keys
        assert "volume_analysis" in keys
        assert "risk_summary" in keys
        assert "conflict_explanation" in keys
