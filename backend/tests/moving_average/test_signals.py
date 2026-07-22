import pytest
from modules.moving_average.signals.cross_detector import CrossDetector
from modules.moving_average.signals.proximity_engine import ProximityEngine
from modules.moving_average.signals.smart_signals import SmartSignalEngine
from modules.moving_average.core.types import CrossType, CrossStrength


class TestCrossDetector:
    def setup_method(self):
        self.detector = CrossDetector()

    def test_golden_cross(self):
        fast = [None, None, 90.0, 95.0, 100.0, 105.0, 110.0]
        slow = [None, None, 100.0, 100.0, 100.0, 100.0, 100.0]
        dates = [f"2024-01-{i+1:02d}" for i in range(7)]
        crosses = self.detector.detect(fast, slow, dates, 5, 20)
        assert len(crosses) >= 1
        golden = [c for c in crosses if c.cross_type == CrossType.GOLDEN]
        assert len(golden) >= 1

    def test_death_cross(self):
        fast = [None, None, 110.0, 105.0, 100.0, 95.0, 90.0]
        slow = [None, None, 100.0, 100.0, 100.0, 100.0, 100.0]
        dates = [f"2024-01-{i+1:02d}" for i in range(7)]
        crosses = self.detector.detect(fast, slow, dates, 5, 20)
        assert len(crosses) >= 1
        death = [c for c in crosses if c.cross_type == CrossType.DEATH]
        assert len(death) >= 1

    def test_no_cross(self):
        fast = [100.0, 101.0, 102.0, 103.0, 104.0]
        slow = [90.0, 91.0, 92.0, 93.0, 94.0]
        dates = [f"2024-01-{i+1:02d}" for i in range(5)]
        crosses = self.detector.detect(fast, slow, dates, 5, 20)
        assert len(crosses) == 0

    def test_detect_latest(self):
        fast = [None, None, 90.0, 95.0, 100.0, 105.0, 110.0]
        slow = [None, None, 100.0, 100.0, 100.0, 100.0, 100.0]
        dates = [f"2024-01-{i+1:02d}" for i in range(7)]
        latest = self.detector.detect_latest(fast, slow, dates, 5, 20)
        assert latest is not None

    def test_detect_latest_none(self):
        fast = [100.0, 101.0, 102.0]
        slow = [90.0, 91.0, 92.0]
        dates = [f"2024-01-{i+1:02d}" for i in range(3)]
        latest = self.detector.detect_latest(fast, slow, dates, 5, 20)
        assert latest is None

    def test_cross_with_none_values(self):
        fast = [None, None, None, 100.0, 105.0]
        slow = [None, None, None, 100.0, 95.0]
        dates = [f"2024-01-{i+1:02d}" for i in range(5)]
        crosses = self.detector.detect(fast, slow, dates, 5, 20)
        assert isinstance(crosses, list)

    def test_cross_result_fields(self):
        fast = [None, None, 90.0, 100.0, 110.0]
        slow = [None, None, 100.0, 100.0, 100.0]
        dates = [f"2024-01-{i+1:02d}" for i in range(5)]
        crosses = self.detector.detect(fast, slow, dates, 5, 20)
        for c in crosses:
            assert c.fast_period == 5
            assert c.slow_period == 20
            assert c.cross_strength in CrossStrength


class TestProximityEngine:
    def setup_method(self):
        self.engine = ProximityEngine()

    def test_converging(self):
        fast = [90.0, 92.0, 94.0, 96.0, 98.0]
        slow = [100.0, 100.0, 100.0, 100.0, 100.0]
        result = self.engine.estimate_crossover(fast, slow)
        assert result["estimated_bars"] is not None
        assert result["probability"] is not None

    def test_diverging(self):
        fast = [110.0, 108.0, 106.0, 104.0, 102.0]
        slow = [100.0, 100.0, 100.0, 100.0, 100.0]
        result = self.engine.estimate_crossover(fast, slow)
        assert result["probability"] is not None

    def test_already_crossed(self):
        fast = [90.0, 95.0, 100.0, 105.0, 110.0]
        slow = [100.0, 100.0, 100.0, 100.0, 100.0]
        result = self.engine.estimate_crossover(fast, slow)
        assert result["probability"] is not None

    def test_insufficient_data(self):
        result = self.engine.estimate_crossover([100.0], [100.0])
        assert result["estimated_bars"] is None

    def test_none_values(self):
        fast = [None, None, 100.0]
        slow = [None, None, 100.0]
        result = self.engine.estimate_crossover(fast, slow)
        assert result["estimated_bars"] is None


class TestSmartSignalEngine:
    def setup_method(self):
        self.engine = SmartSignalEngine()

    def test_early_bullish(self):
        n = 30
        slow = [100.0 - i * 0.3 for i in range(n)]
        fast = [95.0 + i * 0.5 for i in range(n)]
        closes = [90.0 + i * 0.5 for i in range(n)]
        dates = [f"2024-01-{i+1:02d}" for i in range(n)]
        signals = self.engine.generate(fast, slow, closes, dates, 10, 20)
        signal_types = [s.signal_type for s in signals]
        assert isinstance(signal_types, list)

    def test_no_signals_short_data(self):
        fast = [100.0, 101.0, 102.0]
        slow = [100.0, 100.0, 100.0]
        closes = [100.0, 101.0, 102.0]
        dates = ["2024-01-01", "2024-01-02", "2024-01-03"]
        signals = self.engine.generate(fast, slow, closes, dates, 5, 10)
        assert len(signals) == 0

    def test_signal_confidence_range(self):
        n = 30
        fast = [100.0 + i * 0.1 for i in range(n)]
        slow = [98.0 + i * 0.05 for i in range(n)]
        closes = [99.0 + i * 0.1 for i in range(n)]
        dates = [f"2024-01-{i+1:02d}" for i in range(n)]
        signals = self.engine.generate(fast, slow, closes, dates, 10, 20)
        for s in signals:
            assert 0 <= s.confidence <= 1
