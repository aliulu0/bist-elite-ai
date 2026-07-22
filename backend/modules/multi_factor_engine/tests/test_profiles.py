from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.multi_factor_engine.core.types import (
    FactorGroup,
    FactorName,
    FactorScore,
    GroupScore,
    InvestmentHorizon,
    MarketRegime,
    ScoreStrength,
)
from modules.multi_factor_engine.profiles.generator import FactorProfileGenerator


def _make_group_score(group: FactorGroup, score: float) -> GroupScore:
    return GroupScore(
        group=group,
        score=score,
        factors=[FactorScore(factor=FactorName.RSI, score=score)],
        strength=ScoreStrength.NEUTRAL,
    )


def _make_factor_score(name: FactorName, score: float) -> FactorScore:
    return FactorScore(factor=name, score=score, strength=ScoreStrength.NEUTRAL)


class TestProfileGenerator:
    def setup_method(self):
        self.gen = FactorProfileGenerator()

    def test_basic_generation(self):
        gs = [_make_group_score(FactorGroup.VALUE, 70.0)]
        fs = [_make_factor_score(FactorName.RSI, 80.0)]
        profile = self.gen.generate("AAPL", "2024-01-01", gs, fs)
        assert profile.symbol == "AAPL"
        assert profile.reference_date == "2024-01-01"

    def test_overall_score_is_mean(self):
        gs = [
            _make_group_score(FactorGroup.VALUE, 80.0),
            _make_group_score(FactorGroup.GROWTH, 60.0),
        ]
        profile = self.gen.generate("TEST", "2024-01-01", gs, [])
        assert abs(profile.overall_score - 70.0) < 1e-6

    def test_overall_strength_matches_score(self):
        gs = [_make_group_score(FactorGroup.VALUE, 85.0)]
        profile = self.gen.generate("TEST", "2024-01-01", gs, [])
        assert profile.overall_strength == ScoreStrength.VERY_STRONG

    def test_radar_data_populated(self):
        gs = [
            _make_group_score(FactorGroup.VALUE, 75.0),
            _make_group_score(FactorGroup.GROWTH, 85.0),
        ]
        profile = self.gen.generate("TEST", "2024-01-01", gs, [])
        assert "value" in profile.radar_data
        assert "growth" in profile.radar_data
        assert profile.radar_data["value"] == 75.0
        assert profile.radar_data["growth"] == 85.0

    def test_strengths_identified_high_scores(self):
        gs = [
            _make_group_score(FactorGroup.VALUE, 80.0),
            _make_group_score(FactorGroup.GROWTH, 70.0),
            _make_group_score(FactorGroup.QUALITY, 65.0),
            _make_group_score(FactorGroup.MOMENTUM, 30.0),
        ]
        profile = self.gen.generate("TEST", "2024-01-01", gs, [])
        assert len(profile.strengths) == 3
        assert any("value" in s for s in profile.strengths)

    def test_weaknesses_identified_low_scores(self):
        gs = [
            _make_group_score(FactorGroup.VALUE, 80.0),
            _make_group_score(FactorGroup.GROWTH, 70.0),
            _make_group_score(FactorGroup.RISK, 20.0),
            _make_group_score(FactorGroup.LIQUIDITY, 15.0),
            _make_group_score(FactorGroup.EFFICIENCY, 30.0),
        ]
        profile = self.gen.generate("TEST", "2024-01-01", gs, [])
        assert any("risk" in w for w in profile.weaknesses)
        assert any("liquidity" in w for w in profile.weaknesses)

    def test_top_factors(self):
        fs = [
            _make_factor_score(FactorName.RSI, 95.0),
            _make_factor_score(FactorName.ADX, 85.0),
            _make_factor_score(FactorName.ROC, 30.0),
        ]
        gs = [_make_group_score(FactorGroup.VALUE, 70.0)]
        profile = self.gen.generate("TEST", "2024-01-01", gs, fs)
        assert len(profile.top_factors) >= 1
        assert any("rsi" in f for f in profile.top_factors)

    def test_bottom_factors(self):
        fs = [
            _make_factor_score(FactorName.RSI, 95.0),
            _make_factor_score(FactorName.ADX, 10.0),
            _make_factor_score(FactorName.ROC, 5.0),
        ]
        gs = [_make_group_score(FactorGroup.VALUE, 70.0)]
        profile = self.gen.generate("TEST", "2024-01-01", gs, fs)
        assert len(profile.bottom_factors) >= 1

    def test_horizon_preserved(self):
        gs = [_make_group_score(FactorGroup.VALUE, 70.0)]
        profile = self.gen.generate(
            "TEST", "2024-01-01", gs, [],
            horizon=InvestmentHorizon.MONTH_12,
        )
        assert profile.horizon == InvestmentHorizon.MONTH_12

    def test_regime_preserved(self):
        gs = [_make_group_score(FactorGroup.VALUE, 70.0)]
        profile = self.gen.generate(
            "TEST", "2024-01-01", gs, [],
            regime=MarketRegime.BULL,
        )
        assert profile.regime == MarketRegime.BULL

    def test_sector_preserved(self):
        gs = [_make_group_score(FactorGroup.VALUE, 70.0)]
        profile = self.gen.generate(
            "TEST", "2024-01-01", gs, [],
            sector="technology",
        )
        assert profile.sector == "technology"

    def test_group_scores_and_factor_scores_stored(self):
        gs = [_make_group_score(FactorGroup.VALUE, 70.0)]
        fs = [_make_factor_score(FactorName.RSI, 80.0)]
        profile = self.gen.generate("TEST", "2024-01-01", gs, fs)
        assert len(profile.group_scores) == 1
        assert len(profile.factor_scores) == 1

    def test_empty_groups(self):
        profile = self.gen.generate("TEST", "2024-01-01", [], [])
        assert profile.overall_score == 0.0

    def test_strengths_limit_3(self):
        gs = [
            _make_group_score(FactorGroup.VALUE, 90.0),
            _make_group_score(FactorGroup.GROWTH, 85.0),
            _make_group_score(FactorGroup.QUALITY, 80.0),
            _make_group_score(FactorGroup.MOMENTUM, 75.0),
        ]
        profile = self.gen.generate("TEST", "2024-01-01", gs, [])
        assert len(profile.strengths) <= 3

    def test_top_factors_limit_5(self):
        fs = [
            _make_factor_score(FactorName.RSI, 95.0),
            _make_factor_score(FactorName.ADX, 90.0),
            _make_factor_score(FactorName.ROC, 85.0),
            _make_factor_score(FactorName.CMF, 80.0),
            _make_factor_score(FactorName.OBV, 75.0),
            _make_factor_score(FactorName.BETA, 70.0),
        ]
        gs = [_make_group_score(FactorGroup.VALUE, 70.0)]
        profile = self.gen.generate("TEST", "2024-01-01", gs, fs)
        assert len(profile.top_factors) <= 5
