import pytest
from modules.elite_score_engine.weights.sector import (
    SECTOR_MULTIPLIERS,
    apply_sector_adjustments,
    get_sector_multiplier,
)
from modules.elite_score_engine.core.types import (
    ScoringDimension,
    DimensionWeight,
    SectorType,
    ScoreDirection,
)


class TestSectorMultipliers:
    def test_has_all_sectors(self):
        assert len(SECTOR_MULTIPLIERS) == 12

    def test_banks_boosts_financial(self):
        assert SECTOR_MULTIPLIERS[SectorType.BANKS][ScoringDimension.FINANCIAL_QUALITY] > 1.0

    def test_tech_boosts_growth(self):
        assert SECTOR_MULTIPLIERS[SectorType.TECHNOLOGY][ScoringDimension.GROWTH] > 1.0

    def test_other_neutral(self):
        for dim in ScoringDimension:
            assert SECTOR_MULTIPLIERS[SectorType.OTHER][dim] == 1.0


class TestApplySectorAdjustments:
    def test_basic(self):
        dims = {
            ScoringDimension.FINANCIAL_QUALITY: DimensionWeight(
                dimension=ScoringDimension.FINANCIAL_QUALITY,
                weight=0.1,
                direction=ScoreDirection.HIGHER_IS_BETTER,
            )
        }
        result = apply_sector_adjustments(dims, SectorType.BANKS)
        assert result[ScoringDimension.FINANCIAL_QUALITY].weight > 0.1

    def test_other_neutral(self):
        dims = {
            ScoringDimension.MOMENTUM: DimensionWeight(
                dimension=ScoringDimension.MOMENTUM,
                weight=0.1,
                direction=ScoreDirection.HIGHER_IS_BETTER,
            )
        }
        result = apply_sector_adjustments(dims, SectorType.OTHER)
        assert result[ScoringDimension.MOMENTUM].weight == 0.1


class TestGetSectorMultiplier:
    def test_banks_financial(self):
        assert get_sector_multiplier(SectorType.BANKS, ScoringDimension.FINANCIAL_QUALITY) > 1.0

    def test_unknown_dim(self):
        assert get_sector_multiplier(SectorType.BANKS, ScoringDimension.CONFIDENCE) == 1.0
