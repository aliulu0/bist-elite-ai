from __future__ import annotations

import pytest
from modules.pattern_engine.services.pattern_service import PatternService
from modules.pattern_engine.core.types import PriceBar, PatternDirection, PatternCategory
from modules.pattern_engine.tests.conftest import make_ascending_bars, make_descending_bars, make_ranging_bars


@pytest.fixture
def service():
    return PatternService()


class TestPatternService:
    def test_detect_classical(self, service):
        bars = make_ascending_bars(40)
        results = service.detect_classical(bars)
        assert isinstance(results, list)

    def test_detect_candlestick(self, service):
        bars = make_ascending_bars(10)
        results = service.detect_candlestick(bars)
        assert isinstance(results, list)

    def test_detect_smc(self, service):
        bars = make_ascending_bars(30)
        results = service.detect_smc(bars)
        assert isinstance(results, list)

    def test_detect_wyckoff(self, service):
        bars = make_ranging_bars(50, base=100, amplitude=2.0)
        results = service.detect_wyckoff(bars)
        assert isinstance(results, list)

    def test_detect_all(self, service):
        bars = make_ascending_bars(40)
        analysis = service.detect(bars)
        assert analysis.total_patterns >= 0

    def test_detect_by_category(self, service):
        bars = make_ascending_bars(40)
        analysis = service.detect(bars, category="classical")
        assert analysis.total_patterns >= 0

    def test_detect_specific_patterns(self, service):
        bars = make_ascending_bars(40)
        analysis = service.detect(bars, patterns=["hammer", "doji"])
        assert analysis.total_patterns >= 0

    def test_list_plugins(self, service):
        plugins = service.list_plugins()
        assert len(plugins) > 0
        assert all("name" in p for p in plugins)

    def test_get_plugin(self, service):
        info = service.get_plugin("hammer")
        assert info is not None
        assert info["name"] == "hammer"
        assert "parameters" in info

    def test_get_plugin_nonexistent(self, service):
        assert service.get_plugin("nonexistent") is None

    def test_validate_prices_valid(self, service):
        bars = make_ascending_bars(10)
        errors = service.validate_prices(bars)
        assert len(errors) == 0

    def test_validate_prices_invalid(self, service):
        errors = service.validate_prices([])
        assert len(errors) > 0

    def test_invalidate_cache(self, service):
        bars = make_ascending_bars(40)
        service.detect(bars, patterns=["hammer"])
        count = service.invalidate_cache()
        assert count >= 0

    def test_invalidate_cache_pattern(self, service):
        count = service.invalidate_cache("hammer")
        assert count >= 0

    def test_build_analysis_empty(self, service):
        analysis = service._build_analysis([])
        assert analysis.total_patterns == 0
        assert analysis.bullish_count == 0
        assert analysis.bearish_count == 0

    def test_build_analysis_with_results(self, service):
        from modules.pattern_engine.core.types import PatternResult
        results = [
            PatternResult(
                pattern_name="Test1", category=PatternCategory.CLASSICAL,
                direction=PatternDirection.BULLISH, confidence=0.8,
            ),
            PatternResult(
                pattern_name="Test2", category=PatternCategory.CLASSICAL,
                direction=PatternDirection.BEARISH, confidence=0.7,
            ),
        ]
        analysis = service._build_analysis(results)
        assert analysis.total_patterns == 2
        assert analysis.bullish_count == 1
        assert analysis.bearish_count == 1
        assert analysis.dominant_direction == PatternDirection.NEUTRAL
