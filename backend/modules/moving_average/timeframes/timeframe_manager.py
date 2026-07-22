from __future__ import annotations

from modules.moving_average.core.types import Timeframe, TIMEFRAME_ORDER


class TimeframeManager:

    @staticmethod
    def get_all() -> list[Timeframe]:
        return list(Timeframe)

    @staticmethod
    def get_higher(timeframe: Timeframe) -> list[Timeframe]:
        current_order = TIMEFRAME_ORDER[timeframe]
        return [tf for tf, order in TIMEFRAME_ORDER.items() if order > current_order]

    @staticmethod
    def get_lower(timeframe: Timeframe) -> list[Timeframe]:
        current_order = TIMEFRAME_ORDER[timeframe]
        return [tf for tf, order in TIMEFRAME_ORDER.items() if order < current_order]

    @staticmethod
    def get_higher_and_equal(timeframe: Timeframe) -> list[Timeframe]:
        current_order = TIMEFRAME_ORDER[timeframe]
        return [tf for tf, order in TIMEFRAME_ORDER.items() if order >= current_order]

    @staticmethod
    def is_higher(tf1: Timeframe, tf2: Timeframe) -> bool:
        return TIMEFRAME_ORDER.get(tf1, 0) > TIMEFRAME_ORDER.get(tf2, 0)

    @staticmethod
    def get_alignment_score(timeframe: Timeframe, uptrends: list[Timeframe]) -> float:
        higher = TimeframeManager.get_higher_and_equal(timeframe)
        if not higher:
            return 0.0
        aligned = sum(1 for tf in higher if tf in uptrends)
        return aligned / len(higher)
