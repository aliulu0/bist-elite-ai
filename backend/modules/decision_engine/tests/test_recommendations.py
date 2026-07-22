import pytest
from modules.decision_engine.recommendations.generator import RecommendationGenerator
from modules.decision_engine.core.types import (
    DecisionDimension,
    DecisionType,
    DimensionScore,
    EntryTiming,
    ExitAction,
    InvestmentHorizon,
)


class TestRecommendationGenerator:
    def setup_method(self):
        self.gen = RecommendationGenerator()

    def _make_ds(self, dim, score, conf=70.0):
        return DimensionScore(dim, score, score, 0.1, score * 0.1, conf)

    def test_entry_strong_buy_high_momentum(self):
        entry = self.gen.generate_entry(DecisionType.STRONG_BUY, 90.0, 80.0, 85.0)
        assert entry.timing == EntryTiming.IMMEDIATE
        assert entry.max_position_pct > 0

    def test_entry_strong_buy_low_momentum(self):
        entry = self.gen.generate_entry(DecisionType.STRONG_BUY, 90.0, 80.0, 40.0)
        assert entry.timing == EntryTiming.WAIT_PULLBACK

    def test_entry_buy_moderate_momentum(self):
        entry = self.gen.generate_entry(DecisionType.BUY, 82.0, 60.0, 65.0)
        assert entry.timing == EntryTiming.SCALE_IN
        assert len(entry.scale_in_levels) > 0

    def test_entry_accumulate_low_risk(self):
        entry = self.gen.generate_entry(DecisionType.ACCUMULATE, 65.0, 65.0, 50.0)
        assert entry.timing == EntryTiming.SCALE_IN

    def test_entry_watch(self):
        entry = self.gen.generate_entry(DecisionType.WATCH, 55.0, 50.0, 40.0)
        assert entry.timing == EntryTiming.WAIT_BREAKOUT

    def test_entry_avoid(self):
        entry = self.gen.generate_entry(DecisionType.AVOID, 8.0, 20.0, 10.0)
        assert entry.timing == EntryTiming.NO_ENTRY

    def test_entry_distribution_risk(self):
        entry = self.gen.generate_entry(DecisionType.DISTRIBUTION_RISK, 2.0, 10.0, 5.0)
        assert entry.timing == EntryTiming.NO_ENTRY

    def test_exit_strong_buy(self):
        exit_g = self.gen.generate_exit(DecisionType.STRONG_BUY, 90.0, 80.0)
        assert exit_g.action == ExitAction.TRAILING_STOP
        assert exit_g.trailing_stop_pct is not None

    def test_exit_accumulate(self):
        exit_g = self.gen.generate_exit(DecisionType.ACCUMULATE, 65.0, 60.0)
        assert exit_g.action == ExitAction.HOLD
        assert exit_g.initial_target is not None

    def test_exit_watch(self):
        exit_g = self.gen.generate_exit(DecisionType.WATCH, 55.0, 50.0)
        assert exit_g.action == ExitAction.HOLD
        assert exit_g.initial_target is not None

    def test_exit_reduce(self):
        exit_g = self.gen.generate_exit(DecisionType.REDUCE, 25.0, 40.0)
        assert exit_g.action == ExitAction.TAKE_PARTIAL

    def test_exit_avoid(self):
        exit_g = self.gen.generate_exit(DecisionType.AVOID, 8.0, 20.0)
        assert exit_g.action == ExitAction.EXIT

    def test_exit_neutral(self):
        exit_g = self.gen.generate_exit(DecisionType.NEUTRAL, 35.0, 50.0)
        assert exit_g.action == ExitAction.HOLD

    def test_horizon_recommendations(self):
        scores = {
            DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 70.0),
            DecisionDimension.RISK: self._make_ds(DecisionDimension.RISK, 65.0),
        }
        recs = self.gen.generate_horizon_recommendations("TUPRS", 72.0, scores, 65.0, 70.0)
        assert len(recs) == 5
        horizons = [r.horizon for r in recs]
        assert InvestmentHorizon.WEEKLY in horizons
        assert InvestmentHorizon.MONTH_12 in horizons

    def test_horizon_weekly_adjusted(self):
        scores = {DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 70.0)}
        recs = self.gen.generate_horizon_recommendations("TUPRS", 50.0, scores, 50.0, 50.0)
        weekly = [r for r in recs if r.horizon == InvestmentHorizon.WEEKLY][0]
        assert weekly.score < 50.0

    def test_horizon_3month_adjusted(self):
        scores = {DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 70.0)}
        recs = self.gen.generate_horizon_recommendations("TUPRS", 50.0, scores, 50.0, 50.0)
        m3 = [r for r in recs if r.horizon == InvestmentHorizon.MONTH_3][0]
        assert m3.score > 50.0

    def test_all_horizons_have_entry_exit(self):
        scores = {DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 70.0)}
        recs = self.gen.generate_horizon_recommendations("TUPRS", 60.0, scores, 60.0, 60.0)
        for r in recs:
            assert r.entry is not None
            assert r.exit is not None
