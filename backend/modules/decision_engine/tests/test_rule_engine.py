import pytest
from modules.decision_engine.decision_pipeline.rule_engine import DecisionRuleEngine
from modules.decision_engine.core.types import (
    Conflict,
    ConflictSeverity,
    DecisionDimension,
    DimensionScore,
    DataSource,
    EngineOutput,
)


class TestDecisionRuleEngine:
    def setup_method(self):
        self.engine = DecisionRuleEngine()

    def _make_ds(self, dim, score, conf=70.0):
        return DimensionScore(dim, score, score, 0.1, score * 0.1, conf)

    def test_strong_across_dimensions(self):
        scores = {
            DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 85.0),
            DecisionDimension.RISK: self._make_ds(DecisionDimension.RISK, 85.0),
            DecisionDimension.CONFIDENCE: self._make_ds(DecisionDimension.CONFIDENCE, 85.0),
            DecisionDimension.FINANCIAL_QUALITY: self._make_ds(DecisionDimension.FINANCIAL_QUALITY, 85.0),
        }
        result = self.engine.evaluate(scores, {}, [])
        bonus_names = [b.factor for b in result.bonuses]
        assert "strong_across_dimensions" in bonus_names

    def test_smart_money_bonus(self):
        scores = {
            DecisionDimension.SMART_MONEY: self._make_ds(DecisionDimension.SMART_MONEY, 85.0),
            DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 70.0),
        }
        result = self.engine.evaluate(scores, {}, [])
        bonus_names = [b.factor for b in result.bonuses]
        assert "smart_money_confirmation" in bonus_names

    def test_pattern_momentum_bonus(self):
        scores = {
            DecisionDimension.PATTERN_QUALITY: self._make_ds(DecisionDimension.PATTERN_QUALITY, 85.0),
            DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 85.0),
        }
        result = self.engine.evaluate(scores, {}, [])
        bonus_names = [b.factor for b in result.bonuses]
        assert "pattern_volume_alignment" in bonus_names

    def test_sector_bonus(self):
        scores = {
            DecisionDimension.SECTOR_STRENGTH: self._make_ds(DecisionDimension.SECTOR_STRENGTH, 85.0),
        }
        result = self.engine.evaluate(scores, {}, [])
        bonus_names = [b.factor for b in result.bonuses]
        assert "sector_strength_alignment" in bonus_names

    def test_low_risk_bonus(self):
        scores = {
            DecisionDimension.RISK: self._make_ds(DecisionDimension.RISK, 85.0),
        }
        result = self.engine.evaluate(scores, {}, [])
        bonus_names = [b.factor for b in result.bonuses]
        assert "low_risk_high_reward" in bonus_names

    def test_market_regime_bonus(self):
        scores = {
            DecisionDimension.MARKET_REGIME: self._make_ds(DecisionDimension.MARKET_REGIME, 85.0),
        }
        result = self.engine.evaluate(scores, {}, [])
        bonus_names = [b.factor for b in result.bonuses]
        assert "market_regime_alignment" in bonus_names

    def test_early_opportunity_bonus(self):
        outputs = {
            DataSource.EARLY_OPPORTUNITY: EngineOutput(DataSource.EARLY_OPPORTUNITY, 85.0, 70.0),
        }
        result = self.engine.evaluate({}, outputs, [])
        bonus_names = [b.factor for b in result.bonuses]
        assert "early_opportunity_detected" in bonus_names

    def test_critical_conflict_penalty(self):
        from modules.decision_engine.core.types import Conflict, ConflictSeverity, DecisionDimension
        conflicts = [
            Conflict(DecisionDimension.MOMENTUM, DecisionDimension.RISK, ConflictSeverity.CRITICAL, "a", "b"),
        ]
        result = self.engine.evaluate({}, {}, conflicts)
        penalty_names = [p.factor for p in result.penalties]
        assert "critical_conflict" in penalty_names

    def test_high_conflict_penalty(self):
        conflicts = [
            Conflict(DecisionDimension.MOMENTUM, DecisionDimension.RISK, ConflictSeverity.HIGH, "a", "b"),
        ]
        result = self.engine.evaluate({}, {}, conflicts)
        penalty_names = [p.factor for p in result.penalties]
        assert "high_conflict" in penalty_names

    def test_weak_smart_money_penalty(self):
        scores = {
            DecisionDimension.SMART_MONEY: self._make_ds(DecisionDimension.SMART_MONEY, 20.0),
        }
        result = self.engine.evaluate(scores, {}, [])
        penalty_names = [p.factor for p in result.penalties]
        assert "weak_volume_confirmation" in penalty_names

    def test_adverse_market_penalty(self):
        scores = {
            DecisionDimension.MARKET_REGIME: self._make_ds(DecisionDimension.MARKET_REGIME, 20.0),
        }
        result = self.engine.evaluate(scores, {}, [])
        penalty_names = [p.factor for p in result.penalties]
        assert "adverse_market_regime" in penalty_names

    def test_high_risk_penalty(self):
        scores = {
            DecisionDimension.RISK: self._make_ds(DecisionDimension.RISK, 20.0),
        }
        result = self.engine.evaluate(scores, {}, [])
        penalty_names = [p.factor for p in result.penalties]
        assert "high_risk_low_reward" in penalty_names

    def test_poor_liquidity_penalty(self):
        scores = {
            DecisionDimension.LIQUIDITY: self._make_ds(DecisionDimension.LIQUIDITY, 20.0),
        }
        result = self.engine.evaluate(scores, {}, [])
        penalty_names = [p.factor for p in result.penalties]
        assert "poor_liquidity" in penalty_names

    def test_low_similarity_penalty(self):
        scores = {
            DecisionDimension.HISTORICAL_SIMILARITY: self._make_ds(DecisionDimension.HISTORICAL_SIMILARITY, 20.0),
        }
        result = self.engine.evaluate(scores, {}, [])
        penalty_names = [p.factor for p in result.penalties]
        assert "low_historical_similarity" in penalty_names

    def test_net_adjustment_positive(self):
        scores = {
            DecisionDimension.MOMENTUM: self._make_ds(DecisionDimension.MOMENTUM, 90.0),
            DecisionDimension.RISK: self._make_ds(DecisionDimension.RISK, 85.0),
            DecisionDimension.CONFIDENCE: self._make_ds(DecisionDimension.CONFIDENCE, 85.0),
            DecisionDimension.FINANCIAL_QUALITY: self._make_ds(DecisionDimension.FINANCIAL_QUALITY, 85.0),
            DecisionDimension.SMART_MONEY: self._make_ds(DecisionDimension.SMART_MONEY, 85.0),
            DecisionDimension.PATTERN_QUALITY: self._make_ds(DecisionDimension.PATTERN_QUALITY, 85.0),
            DecisionDimension.SECTOR_STRENGTH: self._make_ds(DecisionDimension.SECTOR_STRENGTH, 85.0),
            DecisionDimension.MARKET_REGIME: self._make_ds(DecisionDimension.MARKET_REGIME, 85.0),
        }
        result = self.engine.evaluate(scores, {}, [])
        assert result.adjustment > 0

    def test_net_adjustment_negative(self):
        conflicts = [
            Conflict(DecisionDimension.MOMENTUM, DecisionDimension.RISK, ConflictSeverity.CRITICAL, "a", "b"),
        ]
        scores = {
            DecisionDimension.SMART_MONEY: self._make_ds(DecisionDimension.SMART_MONEY, 15.0),
            DecisionDimension.MARKET_REGIME: self._make_ds(DecisionDimension.MARKET_REGIME, 15.0),
            DecisionDimension.RISK: self._make_ds(DecisionDimension.RISK, 15.0),
            DecisionDimension.LIQUIDITY: self._make_ds(DecisionDimension.LIQUIDITY, 15.0),
            DecisionDimension.HISTORICAL_SIMILARITY: self._make_ds(DecisionDimension.HISTORICAL_SIMILARITY, 15.0),
        }
        result = self.engine.evaluate(scores, {}, conflicts)
        assert result.adjustment < 0
