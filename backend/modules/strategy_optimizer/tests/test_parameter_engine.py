from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.strategy_optimizer.core.types import (
    OptimizationType,
    ParameterCategory,
    ParameterRange,
)
from modules.strategy_optimizer.parameter_engine.engine import ParameterSpaceBuilder


class TestParameterSpaceBuilderConstruction:
    def test_init(self):
        builder = ParameterSpaceBuilder()
        assert builder is not None


class TestBuildSpace:
    def test_build_rule_threshold(self):
        builder = ParameterSpaceBuilder()
        space = builder.build_space(OptimizationType.RULE_THRESHOLD)
        assert "elite_score_threshold" in space
        assert "confidence_threshold" in space
        assert "risk_threshold" in space

    def test_build_weight(self):
        builder = ParameterSpaceBuilder()
        space = builder.build_space(OptimizationType.WEIGHT)
        assert "elite_score_threshold" in space
        assert "rsi_oversold" in space
        assert "rsi_overbought" in space
        assert "volume_threshold" in space

    def test_build_bonus(self):
        builder = ParameterSpaceBuilder()
        space = builder.build_space(OptimizationType.BONUS)
        assert "smart_money_weight" in space
        assert "pattern_confidence" in space
        assert "pe_ratio_max" in space

    def test_build_penalty(self):
        builder = ParameterSpaceBuilder()
        space = builder.build_space(OptimizationType.PENALTY)
        assert "risk_threshold" in space
        assert "confidence_threshold" in space

    def test_build_filter(self):
        builder = ParameterSpaceBuilder()
        space = builder.build_space(OptimizationType.FILTER)
        assert "elite_score_threshold" in space
        assert "opportunity_score_threshold" in space

    def test_build_ranking(self):
        builder = ParameterSpaceBuilder()
        space = builder.build_space(OptimizationType.RANKING)
        assert "elite_score_threshold" in space
        assert "confidence_threshold" in space
        assert "risk_threshold" in space

    def test_build_with_custom_categories(self):
        builder = ParameterSpaceBuilder()
        space = builder.build_space(
            OptimizationType.WEIGHT,
            categories=[ParameterCategory.RSI, ParameterCategory.VOLUME],
        )
        assert "rsi_oversold" in space
        assert "rsi_overbought" in space
        assert "volume_threshold" in space

    def test_build_with_overrides(self):
        builder = ParameterSpaceBuilder()
        overrides = {
            "custom_param": ParameterRange(
                name="custom_param",
                min_value=0.0,
                max_value=10.0,
                step=0.5,
                current_value=5.0,
            )
        }
        space = builder.build_space(
            OptimizationType.RULE_THRESHOLD,
            overrides=overrides,
        )
        assert "custom_param" in space
        assert space["custom_param"].max_value == 10.0

    def test_build_all_categories(self):
        builder = ParameterSpaceBuilder()
        space = builder.build_space(
            OptimizationType.WEIGHT,
            categories=list(ParameterCategory),
        )
        assert len(space) >= 10


class TestGenerateCandidates:
    def test_discrete_candidates(self):
        builder = ParameterSpaceBuilder()
        space = {
            "param1": ParameterRange(
                name="param1",
                is_discrete=True,
                values=[1, 2, 3],
                current_value=2,
            ),
        }
        candidates = builder.generate_candidates(space, max_candidates=10)
        assert len(candidates) == 3
        assert {"param1": 1} in candidates
        assert {"param1": 2} in candidates
        assert {"param1": 3} in candidates

    def test_continuous_candidates(self):
        builder = ParameterSpaceBuilder()
        space = {
            "threshold": ParameterRange(
                name="threshold",
                min_value=0.0,
                max_value=1.0,
                step=0.25,
                current_value=0.5,
            ),
        }
        candidates = builder.generate_candidates(space, max_candidates=10, seed=42)
        assert len(candidates) <= 10
        for c in candidates:
            assert 0.0 <= c["threshold"] <= 1.0

    def test_max_candidates_respected(self):
        builder = ParameterSpaceBuilder()
        space = {
            "p1": ParameterRange(name="p1", min_value=0.0, max_value=1.0, step=0.01, current_value=0.5),
            "p2": ParameterRange(name="p2", min_value=0.0, max_value=1.0, step=0.01, current_value=0.5),
        }
        candidates = builder.generate_candidates(space, max_candidates=5, seed=42)
        assert len(candidates) <= 5

    def test_mixed_candidates(self):
        builder = ParameterSpaceBuilder()
        space = {
            "discrete": ParameterRange(
                name="discrete",
                is_discrete=True,
                values=["a", "b"],
                current_value="a",
            ),
            "continuous": ParameterRange(
                name="continuous",
                min_value=0.0,
                max_value=1.0,
                step=0.5,
                current_value=0.5,
            ),
        }
        candidates = builder.generate_candidates(space, max_candidates=10)
        assert len(candidates) >= 1
        for c in candidates:
            assert c["discrete"] in ["a", "b"]

    def test_empty_space(self):
        builder = ParameterSpaceBuilder()
        candidates = builder.generate_candidates({}, max_candidates=5)
        assert candidates == []


class TestPerturbCandidate:
    def test_perturb_discrete(self):
        builder = ParameterSpaceBuilder()
        space = {
            "ma_short": ParameterRange(
                name="ma_short",
                is_discrete=True,
                values=[5, 10, 15, 20],
                current_value=10,
            ),
        }
        candidate = {"ma_short": 10}
        perturbed = builder.perturb_candidate(candidate, space, seed=42)
        assert perturbed["ma_short"] in [5, 10, 15, 20]

    def test_perturb_continuous(self):
        builder = ParameterSpaceBuilder()
        space = {
            "threshold": ParameterRange(
                name="threshold",
                min_value=0.0,
                max_value=1.0,
                step=0.01,
                current_value=0.5,
            ),
        }
        candidate = {"threshold": 0.5}
        perturbed = builder.perturb_candidate(candidate, space, magnitude=0.1, seed=42)
        assert 0.0 <= perturbed["threshold"] <= 1.0

    def test_perturb_preserves_other_keys(self):
        builder = ParameterSpaceBuilder()
        space = {
            "threshold": ParameterRange(
                name="threshold",
                min_value=0.0,
                max_value=1.0,
                step=0.1,
                current_value=0.5,
            ),
        }
        candidate = {"threshold": 0.5, "extra": "value"}
        perturbed = builder.perturb_candidate(candidate, space, seed=42)
        assert perturbed["extra"] == "value"

    def test_perturb_no_space(self):
        builder = ParameterSpaceBuilder()
        candidate = {"threshold": 0.5}
        perturbed = builder.perturb_candidate(candidate, {})
        assert perturbed == {"threshold": 0.5}


class TestGridSearchSpace:
    def test_grid_search(self):
        builder = ParameterSpaceBuilder()
        space = {
            "p1": ParameterRange(
                name="p1",
                is_discrete=True,
                values=[1, 2],
                current_value=1,
            ),
            "p2": ParameterRange(
                name="p2",
                min_value=0.0,
                max_value=1.0,
                step=0.5,
                current_value=0.5,
            ),
        }
        grid = builder.grid_search_space(space)
        assert len(grid) == 6
        for point in grid:
            assert "p1" in point
            assert "p2" in point

    def test_grid_search_large_space(self):
        builder = ParameterSpaceBuilder()
        space = {
            "p1": ParameterRange(
                name="p1",
                min_value=0.0,
                max_value=1.0,
                step=0.01,
                current_value=0.5,
            ),
        }
        grid = builder.grid_search_space(space, max_points=5)
        assert len(grid) <= 5

    def test_grid_search_empty(self):
        builder = ParameterSpaceBuilder()
        grid = builder.grid_search_space({})
        assert grid == [{}]
