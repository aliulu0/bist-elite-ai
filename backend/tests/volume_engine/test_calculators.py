import pytest
from modules.volume_engine.calculators.volume_calculator import VolumeCalculator
from tests.volume_engine.conftest import _bars, _trending_bars


class TestVolumeCalculator:
    def test_sma(self):
        values = [1.0, 2.0, 3.0, 4.0, 5.0]
        result = VolumeCalculator.sma(values, 3)
        assert result[0] is None
        assert result[1] is None
        assert result[2] == 2.0
        assert result[3] == 3.0
        assert result[4] == 4.0

    def test_sma_insufficient_data(self):
        result = VolumeCalculator.sma([1.0, 2.0], 5)
        assert all(v is None for v in result)

    def test_ema(self):
        values = [1.0, 2.0, 3.0, 4.0, 5.0]
        result = VolumeCalculator.ema(values, 3)
        assert result[0] is None
        assert result[1] is None
        assert result[2] is not None
        assert result[4] is not None

    def test_ema_insufficient_data(self):
        result = VolumeCalculator.ema([1.0, 2.0], 5)
        assert all(v is None for v in result)

    def test_wilder_smoothing(self):
        values = [1.0, 2.0, 3.0, 4.0, 5.0]
        result = VolumeCalculator.wilder_smoothing(values, 3)
        assert result[0] is None
        assert result[1] is None
        assert result[2] is not None

    def test_true_range(self):
        bars = _bars(10)
        result = VolumeCalculator.true_range(bars)
        assert len(result) == 10
        assert result[0] == 0.0
        assert result[1] > 0

    def test_money_flow(self):
        bars = _bars(10)
        result = VolumeCalculator.money_flow(bars)
        assert len(result) == 10
        assert result[0] > 0

    def test_positive_negative_flow(self):
        bars = _bars(10)
        pos, neg = VolumeCalculator.positive_negative_flow(bars)
        assert len(pos) == 10
        assert len(neg) == 10

    def test_volume_weighted_average(self):
        bars = _bars(10)
        result = VolumeCalculator.volume_weighted_average(bars)
        assert len(result) == 10
        assert result[0] is not None
        assert result[-1] is not None

    def test_relative_volume(self):
        bars = _bars(50)
        result = VolumeCalculator.relative_volume(bars, 20)
        assert len(result) == 50
        assert result[-1] is not None
        assert result[-1] > 0

    def test_distribution(self):
        bars = _bars(10)
        result = VolumeCalculator.distribution(bars)
        assert len(result) == 10
        for v in result:
            assert 0 <= v <= 1

    def test_analyze(self):
        bars = _bars(50)
        result = VolumeCalculator.analyze(bars, 20)
        assert result.volume_sma > 0
        assert result.volume_ema > 0
        assert result.relative_volume > 0

    def test_volume_nodes(self):
        bars = _bars(50)
        nodes = VolumeCalculator.volume_nodes(bars, 10)
        assert len(nodes) == 50

    def test_volume_nodes_empty(self):
        nodes = VolumeCalculator.volume_nodes([])
        assert nodes == []
