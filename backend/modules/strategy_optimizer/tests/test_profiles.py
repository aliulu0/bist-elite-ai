from __future__ import annotations

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import pytest

from modules.strategy_optimizer.core.types import (
    InvestmentHorizon,
    OptimizationObjective,
    OptimizationType,
    ParameterCategory,
)
from modules.strategy_optimizer.profiles.manager import HorizonProfile, ProfileManager


class TestProfileManagerConstruction:
    def test_init(self):
        pm = ProfileManager()
        assert pm is not None

    def test_defaults_loaded(self):
        pm = ProfileManager()
        profiles = pm.get_all_profiles()
        assert len(profiles) == 5
        assert InvestmentHorizon.WEEKLY in profiles
        assert InvestmentHorizon.MONTH_1 in profiles
        assert InvestmentHorizon.MONTH_3 in profiles
        assert InvestmentHorizon.MONTH_6 in profiles
        assert InvestmentHorizon.MONTH_12 in profiles


class TestGetProfile:
    def test_get_weekly(self):
        pm = ProfileManager()
        profile = pm.get_profile(InvestmentHorizon.WEEKLY)
        assert profile.horizon == InvestmentHorizon.WEEKLY
        assert profile.rebalance_frequency_days == 5
        assert InvestmentHorizon.WEEKLY in pm.list_horizons()

    def test_get_monthly(self):
        pm = ProfileManager()
        profile = pm.get_profile(InvestmentHorizon.MONTH_1)
        assert profile.horizon == InvestmentHorizon.MONTH_1
        assert profile.rebalance_frequency_days == 21

    def test_get_3month(self):
        pm = ProfileManager()
        profile = pm.get_profile(InvestmentHorizon.MONTH_3)
        assert profile.horizon == InvestmentHorizon.MONTH_3
        assert InvestmentHorizon.MONTH_3 in pm.list_horizons()

    def test_get_6month(self):
        pm = ProfileManager()
        profile = pm.get_profile(InvestmentHorizon.MONTH_6)
        assert profile.horizon == InvestmentHorizon.MONTH_6

    def test_get_12month(self):
        pm = ProfileManager()
        profile = pm.get_profile(InvestmentHorizon.MONTH_12)
        assert profile.horizon == InvestmentHorizon.MONTH_12


class TestSetProfile:
    def test_set_custom_profile(self):
        pm = ProfileManager()
        custom = HorizonProfile(
            horizon=InvestmentHorizon.MONTH_3,
            lookback_days=100,
            min_trades=20,
        )
        pm.set_profile(InvestmentHorizon.MONTH_3, custom)
        result = pm.get_profile(InvestmentHorizon.MONTH_3)
        assert result.lookback_days == 100
        assert result.min_trades == 20


class TestObjectivesForHorizon:
    def test_weekly_objectives(self):
        pm = ProfileManager()
        objs = pm.get_objectives_for_horizon(InvestmentHorizon.WEEKLY)
        assert OptimizationObjective.MAXIMIZE_RETURN in objs
        assert OptimizationObjective.MAXIMIZE_WIN_RATE in objs

    def test_3month_objectives(self):
        pm = ProfileManager()
        objs = pm.get_objectives_for_horizon(InvestmentHorizon.MONTH_3)
        assert OptimizationObjective.MAXIMIZE_SHARPE in objs
        assert OptimizationObjective.MINIMIZE_DRAWDOWN in objs
        assert OptimizationObjective.IMPROVE_ROBUSTNESS in objs

    def test_12month_objectives(self):
        pm = ProfileManager()
        objs = pm.get_objectives_for_horizon(InvestmentHorizon.MONTH_12)
        assert len(objs) >= 4


class TestCategoriesForHorizon:
    def test_weekly_categories(self):
        pm = ProfileManager()
        cats = pm.get_categories_for_horizon(InvestmentHorizon.WEEKLY)
        assert ParameterCategory.ELITE_SCORE in cats
        assert ParameterCategory.CONFIDENCE in cats

    def test_3month_categories(self):
        pm = ProfileManager()
        cats = pm.get_categories_for_horizon(InvestmentHorizon.MONTH_3)
        assert len(cats) >= 8

    def test_12month_categories(self):
        pm = ProfileManager()
        cats = pm.get_categories_for_horizon(InvestmentHorizon.MONTH_12)
        assert len(cats) == len(ParameterCategory)


class TestTypesForHorizon:
    def test_weekly_types(self):
        pm = ProfileManager()
        types = pm.get_types_for_horizon(InvestmentHorizon.WEEKLY)
        assert OptimizationType.RULE_THRESHOLD in types

    def test_3month_types(self):
        pm = ProfileManager()
        types = pm.get_types_for_horizon(InvestmentHorizon.MONTH_3)
        assert len(types) == len(OptimizationType)


class TestListHorizons:
    def test_list_all(self):
        pm = ProfileManager()
        horizons = pm.list_horizons()
        assert len(horizons) == 5
        assert InvestmentHorizon.WEEKLY in horizons
        assert InvestmentHorizon.MONTH_12 in horizons


class TestHorizonProfileDataclass:
    def test_default_values(self):
        hp = HorizonProfile()
        assert hp.horizon == InvestmentHorizon.MONTH_3
        assert hp.lookback_days == 63
        assert hp.min_trades == 10
        assert hp.metadata == {}
