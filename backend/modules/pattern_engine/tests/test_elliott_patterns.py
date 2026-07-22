from __future__ import annotations

import pytest
from modules.pattern_engine.elliott.elliott_patterns import ElliottWavePlugin
from modules.pattern_engine.core.types import PriceBar, PatternCategory
from modules.pattern_engine.tests.conftest import make_ascending_bars, make_ranging_bars


class TestElliottPluginMetadata:
    def test_name(self):
        p = ElliottWavePlugin()
        assert p.name == "elliott_wave"

    def test_category(self):
        p = ElliottWavePlugin()
        assert p.category == PatternCategory.ELLIOTT

    def test_metadata(self):
        p = ElliottWavePlugin()
        meta = p.metadata()
        assert meta["name"] == "elliott_wave"
        assert meta["enabled"] is False

    def test_parameters(self):
        p = ElliottWavePlugin()
        params = p.parameters()
        assert "enable_elliott" in params
        assert params["enable_elliott"]["default"] is False


class TestElliottValidation:
    def test_disabled_by_default(self):
        p = ElliottWavePlugin()
        bars = make_ascending_bars(40)
        errors = p.validate(bars)
        assert any("disabled" in e.lower() for e in errors)

    def test_too_few_bars_when_enabled(self):
        p = ElliottWavePlugin(enable_elliott=True)
        bars = make_ascending_bars(5)
        errors = p.validate(bars)
        assert any("at least" in e.lower() for e in errors)

    def test_valid_when_enabled_with_bars(self):
        p = ElliottWavePlugin(enable_elliott=True)
        bars = make_ascending_bars(40)
        errors = p.validate(bars)
        assert len(errors) == 0


class TestElliottDetection:
    def test_disabled_returns_empty(self):
        p = ElliottWavePlugin()
        bars = make_ranging_bars(40, base=100, amplitude=5.0)
        results = p.detect(bars)
        assert results == []

    def test_enabled_returns_results(self):
        p = ElliottWavePlugin(enable_elliott=True)
        bars = make_ranging_bars(40, base=100, amplitude=5.0)
        results = p.detect(bars, enable_elliott=True)
        assert isinstance(results, list)

    def test_stub_result_has_warnings(self):
        p = ElliottWavePlugin(enable_elliott=True)
        bars = make_ranging_bars(40, base=100, amplitude=5.0)
        results = p.detect(bars, enable_elliott=True)
        for r in results:
            assert r.warnings
            assert "stub" in r.warnings[0].lower()

    def test_shutdown_no_error(self):
        p = ElliottWavePlugin()
        p.shutdown()
