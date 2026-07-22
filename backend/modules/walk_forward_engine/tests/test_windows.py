import pytest
from modules.walk_forward_engine.core.types import (
    TrainTestSplit,
    WalkForwardRequest,
    WindowMode,
    WindowPeriod,
)
from modules.walk_forward_engine.windows.manager import WindowManager


class TestWindowManager:
    def setup_method(self):
        self.wm = WindowManager()

    def _default_request(self, **kwargs) -> WalkForwardRequest:
        defaults = {
            "symbol": "TUPRS",
            "start_date": "2020-01-01",
            "end_date": "2025-12-31",
            "window_mode": WindowMode.ROLLING,
            "train_test_split": TrainTestSplit.EIGHTY_TWENTY,
            "window_period": WindowPeriod.MONTHLY,
            "min_train_rows": 20,
            "min_test_rows": 5,
        }
        defaults.update(kwargs)
        return WalkForwardRequest(**defaults)

    def test_rolling_windows(self):
        req = self._default_request(window_mode=WindowMode.ROLLING)
        dates = [f"2020-{i:02d}-01" for i in range(1, 13)] * 5
        windows = self.wm.generate_windows(req, len(dates), dates)
        assert len(windows) > 0
        assert windows[0].index == 0

    def test_expanding_windows(self):
        req = self._default_request(window_mode=WindowMode.EXPANDING)
        dates = [f"2020-{i:02d}-01" for i in range(1, 13)] * 5
        windows = self.wm.generate_windows(req, len(dates), dates)
        assert len(windows) > 0
        assert windows[0].train_start == dates[0]

    def test_anchored_windows(self):
        req = self._default_request(window_mode=WindowMode.ANCHORED)
        dates = [f"2020-{i:02d}-01" for i in range(1, 13)] * 5
        windows = self.wm.generate_windows(req, len(dates), dates)
        assert len(windows) > 0
        for w in windows:
            assert w.train_start == dates[0]

    def test_sliding_windows(self):
        req = self._default_request(window_mode=WindowMode.SLIDING)
        dates = [f"2020-{i:02d}-01" for i in range(1, 12)] * 5
        windows = self.wm.generate_windows(req, len(dates), dates)
        assert len(windows) > 0

    def test_hybrid_windows(self):
        req = self._default_request(window_mode=WindowMode.HYBRID)
        dates = [f"2020-{i:02d}-01" for i in range(1, 12)] * 5
        windows = self.wm.generate_windows(req, len(dates), dates)
        assert len(windows) > 0

    def test_too_few_rows_returns_empty(self):
        req = self._default_request(min_train_rows=100, min_test_rows=50)
        windows = self.wm.generate_windows(req, 10, None)
        assert windows == []

    def test_count_windows(self):
        req = self._default_request()
        dates = [f"2020-{i:02d}-01" for i in range(1, 13)] * 5
        count = self.wm.count_windows(req, len(dates))
        assert count >= 0

    def test_get_window_at(self):
        req = self._default_request()
        dates = [f"2020-{i:02d}-01" for i in range(1, 13)] * 5
        windows = self.wm.generate_windows(req, len(dates), dates)
        if windows:
            found = self.wm.get_window_at(windows, windows[0].index)
            assert found is not None
            not_found = self.wm.get_window_at(windows, 9999)
            assert not_found is None

    def test_get_train_range(self):
        ws = windows[0] if (windows := self.wm.generate_windows(
            self._default_request(), 60,
            [f"2020-{i:02d}-01" for i in range(1, 13)] * 5,
        )) else None
        if ws:
            start, end = self.wm.get_train_range(ws)
            assert start and end

    def test_get_test_range(self):
        ws = windows[0] if (windows := self.wm.generate_windows(
            self._default_request(), 60,
            [f"2020-{i:02d}-01" for i in range(1, 13)] * 5,
        )) else None
        if ws:
            start, end = self.wm.get_test_range(ws)
            assert start and end

    def test_default_rolling_window_rows(self):
        req = self._default_request()
        dates = [f"2020-{i:02d}-01" for i in range(1, 13)] * 5
        windows = self.wm.generate_windows(req, len(dates), dates)
        for w in windows:
            assert w.train_rows >= req.min_train_rows
            assert w.test_rows >= req.min_test_rows
