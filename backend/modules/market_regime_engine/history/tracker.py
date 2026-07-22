from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.market_regime_engine.core.types import (
    InvestmentHorizon,
    MarketRegime,
    RegimeHistoryEntry,
    _mean,
)


class RegimeHistoryTracker:
    """Tracks regime history and detects regime changes."""

    def __init__(self) -> None:
        self._history: Dict[str, List[RegimeHistoryEntry]] = {}
        self._changes: List[Dict[str, Any]] = []

    def record(self, entry: RegimeHistoryEntry, key: str = "default") -> None:
        if key not in self._history:
            self._history[key] = []
        self._history[key].append(entry)
        self._history[key].sort(key=lambda e: e.date)

    def get_history(self, key: str = "default") -> List[RegimeHistoryEntry]:
        return list(self._history.get(key, []))

    def get_history_by_date_range(
        self,
        start_date: str,
        end_date: str,
        key: str = "default",
    ) -> List[RegimeHistoryEntry]:
        entries = self._history.get(key, [])
        return [e for e in entries if start_date <= e.date <= end_date]

    def get_current_regime(self, key: str = "default") -> Optional[RegimeHistoryEntry]:
        entries = self._history.get(key, [])
        return entries[-1] if entries else None

    def detect_changes(self, key: str = "default") -> List[Dict[str, Any]]:
        entries = self._history.get(key, [])
        changes: List[Dict[str, Any]] = []
        for i in range(1, len(entries)):
            if entries[i].regime != entries[i - 1].regime:
                changes.append({
                    "date": entries[i].date,
                    "from_regime": entries[i - 1].regime.value,
                    "to_regime": entries[i].regime.value,
                    "confidence": entries[i].confidence,
                    "duration_days": entries[i].duration_days,
                })
        self._changes = changes
        return changes

    def compute_regime_durations(self, key: str = "default") -> Dict[str, List[int]]:
        entries = self._history.get(key, [])
        durations: Dict[str, List[int]] = {}
        if not entries:
            return durations
        current_regime = entries[0].regime
        count = 1
        for i in range(1, len(entries)):
            if entries[i].regime == current_regime:
                count += 1
            else:
                regime_val = current_regime.value
                if regime_val not in durations:
                    durations[regime_val] = []
                durations[regime_val].append(count)
                current_regime = entries[i].regime
                count = 1
        regime_val = current_regime.value
        if regime_val not in durations:
            durations[regime_val] = []
        durations[regime_val].append(count)
        return durations

    def compute_transition_matrix(self, key: str = "default") -> Dict[str, Dict[str, int]]:
        entries = self._history.get(key, [])
        matrix: Dict[str, Dict[str, int]] = {}
        for i in range(1, len(entries)):
            from_r = entries[i - 1].regime.value
            to_r = entries[i].regime.value
            if from_r not in matrix:
                matrix[from_r] = {}
            matrix[from_r][to_r] = matrix[from_r].get(to_r, 0) + 1
        return matrix

    def get_regime_counts(self, key: str = "default") -> Dict[str, int]:
        entries = self._history.get(key, [])
        counts: Dict[str, int] = {}
        for e in entries:
            counts[e.regime.value] = counts.get(e.regime.value, 0) + 1
        return counts

    def get_dominant_regime(self, key: str = "default") -> Optional[MarketRegime]:
        counts = self.get_regime_counts(key)
        if not counts:
            return None
        dominant = max(counts, key=counts.get)
        return MarketRegime(dominant)

    def clear(self, key: Optional[str] = None) -> None:
        if key:
            self._history.pop(key, None)
        else:
            self._history.clear()
            self._changes.clear()
