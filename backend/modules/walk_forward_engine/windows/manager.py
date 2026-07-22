from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from modules.walk_forward_engine.core.types import (
    MarketRegime,
    TrainTestSplit,
    WalkForwardRequest,
    WindowMode,
    WindowPeriod,
    WindowSlice,
    _mean,
    classify_market_regime,
    get_split_ratios,
)


class WindowManager:
    """Generates train/test window slices for walk-forward analysis."""

    PERIOD_DAYS = {
        WindowPeriod.WEEKLY: 7,
        WindowPeriod.MONTHLY: 30,
        WindowPeriod.QUARTERLY: 91,
        WindowPeriod.SEMI_ANNUAL: 182,
        WindowPeriod.ANNUAL: 365,
    }

    def generate_windows(
        self,
        request: WalkForwardRequest,
        total_rows: int,
        dates: Optional[List[str]] = None,
    ) -> List[WindowSlice]:
        if total_rows < request.min_train_rows + request.min_test_rows:
            return []
        generators = {
            WindowMode.ROLLING: self._rolling_windows,
            WindowMode.EXPANDING: self._expanding_windows,
            WindowMode.ANCHORED: self._anchored_windows,
            WindowMode.SLIDING: self._sliding_windows,
            WindowMode.HYBRID: self._hybrid_windows,
        }
        gen = generators.get(request.window_mode, self._rolling_windows)
        windows = gen(request, total_rows, dates)
        return self._assign_regimes(windows, dates)

    def count_windows(self, request: WalkForwardRequest, total_rows: int) -> int:
        return len(self.generate_windows(request, total_rows))

    def get_window_at(self, windows: List[WindowSlice], index: int) -> Optional[WindowSlice]:
        for w in windows:
            if w.index == index:
                return w
        return None

    def get_train_range(self, window: WindowSlice) -> Tuple[str, str]:
        return window.train_start, window.train_end

    def get_test_range(self, window: WindowSlice) -> Tuple[str, str]:
        return window.test_start, window.test_end

    def _parse_date(self, date_str: str) -> datetime:
        for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y"):
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        return datetime(2020, 1, 1)

    def _format_date(self, dt: datetime) -> str:
        return dt.strftime("%Y-%m-%d")

    def _rolling_windows(
        self,
        request: WalkForwardRequest,
        total_rows: int,
        dates: Optional[List[str]] = None,
    ) -> List[WindowSlice]:
        train_pct, test_pct = get_split_ratios(request.train_test_split, request.custom_train_pct)
        period_days = self.PERIOD_DAYS.get(request.window_period, 30)
        windows: List[WindowSlice] = []
        train_size = max(request.min_train_rows, int(total_rows * train_pct))
        test_size = max(request.min_test_rows, int(total_rows * test_pct))
        step = test_size
        start = 0
        idx = 0
        dates = dates or []
        while start + train_size + test_size <= total_rows:
            train_start = start
            train_end = start + train_size
            test_start = train_end
            test_end = min(train_end + test_size, total_rows)
            if test_end - test_start < request.min_test_rows:
                break
            windows.append(WindowSlice(
                index=idx,
                train_start=dates[train_start] if train_start < len(dates) else str(train_start),
                train_end=dates[train_end - 1] if train_end - 1 < len(dates) else str(train_end),
                test_start=dates[test_start] if test_start < len(dates) else str(test_start),
                test_end=dates[min(test_end - 1, len(dates) - 1)] if dates else str(test_end),
                train_rows=train_end - train_start,
                test_rows=test_end - test_start,
            ))
            idx += 1
            start += step
        return windows

    def _expanding_windows(
        self,
        request: WalkForwardRequest,
        total_rows: int,
        dates: Optional[List[str]] = None,
    ) -> List[WindowSlice]:
        train_pct, test_pct = get_split_ratios(request.train_test_split, request.custom_train_pct)
        windows: List[WindowSlice] = []
        initial_train = max(request.min_train_rows, int(total_rows * 0.3))
        test_size = max(request.min_test_rows, int(total_rows * test_pct))
        idx = 0
        dates = dates or []
        train_end = initial_train
        while train_end + test_size <= total_rows:
            test_start = train_end
            test_end = min(train_end + test_size, total_rows)
            if test_end - test_start < request.min_test_rows:
                break
            windows.append(WindowSlice(
                index=idx,
                train_start=dates[0] if dates else "0",
                train_end=dates[train_end - 1] if train_end - 1 < len(dates) else str(train_end),
                test_start=dates[test_start] if test_start < len(dates) else str(test_start),
                test_end=dates[min(test_end - 1, len(dates) - 1)] if dates else str(test_end),
                train_rows=train_end,
                test_rows=test_end - test_start,
            ))
            idx += 1
            train_end = test_end
        return windows

    def _anchored_windows(
        self,
        request: WalkForwardRequest,
        total_rows: int,
        dates: Optional[List[str]] = None,
    ) -> List[WindowSlice]:
        train_pct, test_pct = get_split_ratios(request.train_test_split, request.custom_train_pct)
        windows: List[WindowSlice] = []
        test_size = max(request.min_test_rows, int(total_rows * test_pct))
        idx = 0
        dates = dates or []
        test_end = total_rows
        while test_end - test_size >= max(request.min_train_rows, int(total_rows * train_pct)):
            test_start = test_end - test_size
            train_end = test_start
            if train_end < request.min_train_rows:
                break
            windows.append(WindowSlice(
                index=idx,
                train_start=dates[0] if dates else "0",
                train_end=dates[train_end - 1] if train_end - 1 < len(dates) else str(train_end),
                test_start=dates[test_start] if test_start < len(dates) else str(test_start),
                test_end=dates[min(test_end - 1, len(dates) - 1)] if dates else str(test_end),
                train_rows=train_end,
                test_rows=test_end - test_start,
            ))
            idx += 1
            test_end -= test_size
        windows.reverse()
        for i, w in enumerate(windows):
            w.index = i
        return windows

    def _sliding_windows(
        self,
        request: WalkForwardRequest,
        total_rows: int,
        dates: Optional[List[str]] = None,
    ) -> List[WindowSlice]:
        train_pct, test_pct = get_split_ratios(request.train_test_split, request.custom_train_pct)
        windows: List[WindowSlice] = []
        train_size = max(request.min_train_rows, int(total_rows * train_pct))
        test_size = max(request.min_test_rows, int(total_rows * test_pct))
        window_total = train_size + test_size
        step = max(1, test_size // 2)
        idx = 0
        dates = dates or []
        start = 0
        while start + window_total <= total_rows:
            train_start = start
            train_end = start + train_size
            test_start = train_end
            test_end = min(test_start + test_size, total_rows)
            if test_end - test_start < request.min_test_rows:
                break
            windows.append(WindowSlice(
                index=idx,
                train_start=dates[train_start] if train_start < len(dates) else str(train_start),
                train_end=dates[train_end - 1] if train_end - 1 < len(dates) else str(train_end),
                test_start=dates[test_start] if test_start < len(dates) else str(test_start),
                test_end=dates[min(test_end - 1, len(dates) - 1)] if dates else str(test_end),
                train_rows=train_end - train_start,
                test_rows=test_end - test_start,
            ))
            idx += 1
            start += step
        return windows

    def _hybrid_windows(
        self,
        request: WalkForwardRequest,
        total_rows: int,
        dates: Optional[List[str]] = None,
    ) -> List[WindowSlice]:
        windows = self._rolling_windows(request, total_rows, dates)
        if not windows:
            return windows
        expanding_part = self._expanding_windows(request, total_rows, dates)
        half = len(windows) // 2
        for w in expanding_part[:half]:
            w.index = len(windows)
            windows.append(w)
        return windows

    def _assign_regimes(
        self,
        windows: List[WindowSlice],
        dates: Optional[List[str]] = None,
    ) -> List[WindowSlice]:
        for w in windows:
            w.regime = MarketRegime.SIDEWAYS
        return windows
