from modules.scoring_engine.optimizers.optimizer import WeightOptimizer
from modules.scoring_engine.core.types import (
    ScoreType, WeightConfig, WeightProfile, InvestmentHorizon, MarketRegime, ScoreWeight,
)


class TestWeightOptimizer:
    def setup_method(self):
        self.optimizer = WeightOptimizer()

    def test_optimize(self):
        config = WeightConfig(
            profile=WeightProfile.BALANCED,
            horizon=InvestmentHorizon.ONE_MONTH,
            regime=MarketRegime.SIDEWAYS,
            weights={
                ScoreType.FINANCIAL: ScoreWeight(score_type=ScoreType.FINANCIAL, weight=0.3),
                ScoreType.MOMENTUM: ScoreWeight(score_type=ScoreType.MOMENTUM, weight=0.3),
                ScoreType.RISK: ScoreWeight(score_type=ScoreType.RISK, weight=0.4),
            },
        )
        result = self.optimizer.optimize(config, iterations=10)
        assert result.iterations == 10
        assert result.method == "rule_based"
        assert len(result.original_weights) == 3
        assert len(result.optimized_weights) == 3

    def test_optimize_with_historical_data(self):
        config = WeightConfig(
            profile=WeightProfile.BALANCED,
            horizon=InvestmentHorizon.ONE_MONTH,
            regime=MarketRegime.SIDEWAYS,
            weights={
                ScoreType.FINANCIAL: ScoreWeight(score_type=ScoreType.FINANCIAL, weight=0.5),
                ScoreType.MOMENTUM: ScoreWeight(score_type=ScoreType.MOMENTUM, weight=0.5),
            },
        )
        data = {"scores": {"financial": 0.8, "momentum": 0.6}}
        result = self.optimizer.optimize(config, historical_data=data, iterations=20)
        assert len(result.optimized_weights) == 2

    def test_apply_optimization(self):
        config = WeightConfig(
            profile=WeightProfile.BALANCED,
            horizon=InvestmentHorizon.ONE_MONTH,
            regime=MarketRegime.SIDEWAYS,
            weights={
                ScoreType.FINANCIAL: ScoreWeight(score_type=ScoreType.FINANCIAL, weight=0.5),
                ScoreType.MOMENTUM: ScoreWeight(score_type=ScoreType.MOMENTUM, weight=0.5),
            },
        )
        result = self.optimizer.optimize(config, iterations=10)
        updated = self.optimizer.apply_optimization(config, result)
        assert updated is config
