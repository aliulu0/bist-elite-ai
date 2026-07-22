import pytest
from modules.moving_average.timeframes.timeframe_manager import TimeframeManager
from modules.moving_average.core.types import Timeframe


class TestTimeframeManager:
    def setup_method(self):
        self.manager = TimeframeManager()

    def test_get_all(self):
        all_tfs = self.manager.get_all()
        assert len(all_tfs) == 7
        assert Timeframe.M5 in all_tfs
        assert Timeframe.MO1 in all_tfs

    def test_get_higher(self):
        higher = self.manager.get_higher(Timeframe.D1)
        assert Timeframe.W1 in higher
        assert Timeframe.MO1 in higher
        assert Timeframe.M5 not in higher

    def test_get_lower(self):
        lower = self.manager.get_lower(Timeframe.D1)
        assert Timeframe.H4 in lower
        assert Timeframe.M5 in lower
        assert Timeframe.W1 not in lower

    def test_get_higher_and_equal(self):
        result = self.manager.get_higher_and_equal(Timeframe.H1)
        assert Timeframe.H1 in result
        assert Timeframe.H4 in result
        assert Timeframe.M5 not in result

    def test_is_higher(self):
        assert self.manager.is_higher(Timeframe.W1, Timeframe.D1) is True
        assert self.manager.is_higher(Timeframe.M5, Timeframe.D1) is False

    def test_alignment_score_full(self):
        score = self.manager.get_alignment_score(
            Timeframe.D1, [Timeframe.D1, Timeframe.W1, Timeframe.MO1]
        )
        assert score == 1.0

    def test_alignment_score_partial(self):
        score = self.manager.get_alignment_score(
            Timeframe.D1, [Timeframe.D1]
        )
        assert 0 < score <= 1.0

    def test_alignment_score_none(self):
        score = self.manager.get_alignment_score(Timeframe.D1, [])
        assert score == 0.0
