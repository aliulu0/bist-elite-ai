from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.market_regime_engine.core.types import MarketRegime, RegimeHistoryEntry
from modules.market_regime_engine.history.tracker import RegimeHistoryTracker


class TestRecordAndGetHistory:
    def setup_method(self):
        self.tracker = RegimeHistoryTracker()

    def test_record_and_get(self):
        entry = RegimeHistoryEntry(date="2025-01-01", regime=MarketRegime.BULL, confidence=0.8)
        self.tracker.record(entry)
        history = self.tracker.get_history()
        assert len(history) == 1
        assert history[0].regime == MarketRegime.BULL

    def test_multiple_records_sorted_by_date(self):
        self.tracker.record(RegimeHistoryEntry(date="2025-01-03", regime=MarketRegime.BEAR))
        self.tracker.record(RegimeHistoryEntry(date="2025-01-01", regime=MarketRegime.BULL))
        self.tracker.record(RegimeHistoryEntry(date="2025-01-02", regime=MarketRegime.SIDEWAYS))
        history = self.tracker.get_history()
        assert len(history) == 3
        assert [e.date for e in history] == ["2025-01-01", "2025-01-02", "2025-01-03"]

    def test_different_keys(self):
        self.tracker.record(RegimeHistoryEntry(date="2025-01-01", regime=MarketRegime.BULL), key="a")
        self.tracker.record(RegimeHistoryEntry(date="2025-01-01", regime=MarketRegime.BEAR), key="b")
        assert len(self.tracker.get_history("a")) == 1
        assert len(self.tracker.get_history("b")) == 1
        assert self.tracker.get_history("a")[0].regime == MarketRegime.BULL

    def test_empty_history(self):
        assert self.tracker.get_history() == []

    def test_returns_copy(self):
        self.tracker.record(RegimeHistoryEntry(date="2025-01-01", regime=MarketRegime.BULL))
        history = self.tracker.get_history()
        history.clear()
        assert len(self.tracker.get_history()) == 1


class TestGetHistoryByDateRange:
    def setup_method(self):
        self.tracker = RegimeHistoryTracker()
        for i in range(1, 6):
            self.tracker.record(RegimeHistoryEntry(
                date=f"2025-01-0{i}", regime=MarketRegime.BULL, confidence=0.8,
            ))

    def test_full_range(self):
        result = self.tracker.get_history_by_date_range("2025-01-01", "2025-01-05")
        assert len(result) == 5

    def test_partial_range(self):
        result = self.tracker.get_history_by_date_range("2025-01-02", "2025-01-04")
        assert len(result) == 3

    def test_no_results(self):
        result = self.tracker.get_history_by_date_range("2025-02-01", "2025-02-05")
        assert len(result) == 0

    def test_single_day(self):
        result = self.tracker.get_history_by_date_range("2025-01-03", "2025-01-03")
        assert len(result) == 1


class TestGetCurrentRegime:
    def setup_method(self):
        self.tracker = RegimeHistoryTracker()

    def test_empty(self):
        assert self.tracker.get_current_regime() is None

    def test_returns_last(self):
        self.tracker.record(RegimeHistoryEntry(date="2025-01-01", regime=MarketRegime.BULL))
        self.tracker.record(RegimeHistoryEntry(date="2025-01-02", regime=MarketRegime.BEAR))
        current = self.tracker.get_current_regime()
        assert current is not None
        assert current.regime == MarketRegime.BEAR


class TestDetectChanges:
    def setup_method(self):
        self.tracker = RegimeHistoryTracker()

    def test_no_changes(self):
        for i in range(1, 4):
            self.tracker.record(RegimeHistoryEntry(date=f"2025-01-0{i}", regime=MarketRegime.BULL))
        changes = self.tracker.detect_changes()
        assert len(changes) == 0

    def test_detects_changes(self):
        self.tracker.record(RegimeHistoryEntry(date="2025-01-01", regime=MarketRegime.BULL, confidence=0.8))
        self.tracker.record(RegimeHistoryEntry(date="2025-01-02", regime=MarketRegime.BEAR, confidence=0.7, duration_days=5))
        changes = self.tracker.detect_changes()
        assert len(changes) == 1
        assert changes[0]["from_regime"] == "bull"
        assert changes[0]["to_regime"] == "bear"

    def test_multiple_changes(self):
        entries = [
            ("2025-01-01", MarketRegime.BULL),
            ("2025-01-02", MarketRegime.SIDEWAYS),
            ("2025-01-03", MarketRegime.BEAR),
            ("2025-01-04", MarketRegime.BULL),
        ]
        for date, regime in entries:
            self.tracker.record(RegimeHistoryEntry(date=date, regime=regime))
        changes = self.tracker.detect_changes()
        assert len(changes) == 3

    def test_empty(self):
        changes = self.tracker.detect_changes()
        assert len(changes) == 0


class TestComputeRegimeDurations:
    def setup_method(self):
        self.tracker = RegimeHistoryTracker()

    def test_empty(self):
        assert self.tracker.compute_regime_durations() == {}

    def test_single_regime(self):
        for i in range(1, 4):
            self.tracker.record(RegimeHistoryEntry(date=f"2025-01-0{i}", regime=MarketRegime.BULL))
        durations = self.tracker.compute_regime_durations()
        assert durations == {"bull": [3]}

    def test_multiple_regimes(self):
        entries = [
            ("2025-01-01", MarketRegime.BULL),
            ("2025-01-02", MarketRegime.BULL),
            ("2025-01-03", MarketRegime.BEAR),
            ("2025-01-04", MarketRegime.BEAR),
            ("2025-01-05", MarketRegime.BEAR),
        ]
        for date, regime in entries:
            self.tracker.record(RegimeHistoryEntry(date=date, regime=regime))
        durations = self.tracker.compute_regime_durations()
        assert durations["bull"] == [2]
        assert durations["bear"] == [3]

    def test_repeated_regime(self):
        entries = [
            ("2025-01-01", MarketRegime.BULL),
            ("2025-01-02", MarketRegime.BEAR),
            ("2025-01-03", MarketRegime.BULL),
        ]
        for date, regime in entries:
            self.tracker.record(RegimeHistoryEntry(date=date, regime=regime))
        durations = self.tracker.compute_regime_durations()
        assert durations["bull"] == [1, 1]
        assert durations["bear"] == [1]


class TestComputeTransitionMatrix:
    def setup_method(self):
        self.tracker = RegimeHistoryTracker()

    def test_empty(self):
        assert self.tracker.compute_transition_matrix() == {}

    def test_transitions(self):
        entries = [
            ("2025-01-01", MarketRegime.BULL),
            ("2025-01-02", MarketRegime.SIDEWAYS),
            ("2025-01-03", MarketRegime.BEAR),
            ("2025-01-04", MarketRegime.SIDEWAYS),
        ]
        for date, regime in entries:
            self.tracker.record(RegimeHistoryEntry(date=date, regime=regime))
        matrix = self.tracker.compute_transition_matrix()
        assert matrix["bull"]["sideways"] == 1
        assert matrix["sideways"]["bear"] == 1
        assert matrix["bear"]["sideways"] == 1

    def test_same_regime_no_cross_transitions(self):
        for i in range(1, 4):
            self.tracker.record(RegimeHistoryEntry(date=f"2025-01-0{i}", regime=MarketRegime.BULL))
        matrix = self.tracker.compute_transition_matrix()
        assert matrix == {"bull": {"bull": 2}}


class TestGetRegimeCounts:
    def setup_method(self):
        self.tracker = RegimeHistoryTracker()

    def test_empty(self):
        assert self.tracker.get_regime_counts() == {}

    def test_counts(self):
        entries = [
            ("2025-01-01", MarketRegime.BULL),
            ("2025-01-02", MarketRegime.BULL),
            ("2025-01-03", MarketRegime.BEAR),
        ]
        for date, regime in entries:
            self.tracker.record(RegimeHistoryEntry(date=date, regime=regime))
        counts = self.tracker.get_regime_counts()
        assert counts["bull"] == 2
        assert counts["bear"] == 1


class TestGetDominantRegime:
    def setup_method(self):
        self.tracker = RegimeHistoryTracker()

    def test_empty(self):
        assert self.tracker.get_dominant_regime() is None

    def test_dominant(self):
        entries = [
            ("2025-01-01", MarketRegime.BULL),
            ("2025-01-02", MarketRegime.BULL),
            ("2025-01-03", MarketRegime.BULL),
            ("2025-01-04", MarketRegime.BEAR),
        ]
        for date, regime in entries:
            self.tracker.record(RegimeHistoryEntry(date=date, regime=regime))
        assert self.tracker.get_dominant_regime() == MarketRegime.BULL


class TestClear:
    def setup_method(self):
        self.tracker = RegimeHistoryTracker()

    def test_clear_all(self):
        self.tracker.record(RegimeHistoryEntry(date="2025-01-01", regime=MarketRegime.BULL))
        self.tracker.record(RegimeHistoryEntry(date="2025-01-01", regime=MarketRegime.BEAR), key="b")
        self.tracker.clear()
        assert self.tracker.get_history() == []
        assert self.tracker.get_history("b") == []

    def test_clear_specific_key(self):
        self.tracker.record(RegimeHistoryEntry(date="2025-01-01", regime=MarketRegime.BULL), key="a")
        self.tracker.record(RegimeHistoryEntry(date="2025-01-01", regime=MarketRegime.BEAR), key="b")
        self.tracker.clear("a")
        assert self.tracker.get_history("a") == []
        assert len(self.tracker.get_history("b")) == 1
