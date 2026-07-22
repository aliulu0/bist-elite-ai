import pytest
from modules.confidence_engine.calculators.dimension_calculators import (
    DataConfidenceCalculator,
    SignalConfidenceCalculator,
    EvidenceConfidenceCalculator,
    ModelConfidenceCalculator,
    HistoricalConfidenceCalculator,
    PatternConfidenceCalculator,
    RiskConfidenceCalculator,
    MarketConfidenceCalculator,
    SectorConfidenceCalculator,
    ExecutionConfidenceCalculator,
    LiquidityConfidenceCalculator,
    ALL_CALCULATORS,
    get_calculator,
)
from modules.confidence_engine.core.types import ConfidenceDimension


class TestDataConfidenceCalculator:
    def test_perfect_data(self):
        calc = DataConfidenceCalculator()
        result = calc.calculate({
            "missing_fields": [],
            "freshness_hours": 1,
            "completeness": 100.0,
            "provider_reliability": 100.0,
            "consistency": 100.0,
        })
        assert result.normalized_score >= 90

    def test_poor_data(self):
        calc = DataConfidenceCalculator()
        result = calc.calculate({
            "missing_fields": ["a", "b", "c", "d"],
            "freshness_hours": 48,
            "completeness": 30.0,
            "provider_reliability": 40.0,
            "consistency": 30.0,
        })
        assert result.normalized_score < 50

    def test_default_data(self):
        calc = DataConfidenceCalculator()
        result = calc.calculate({})
        assert 0 <= result.normalized_score <= 100

    def test_dimension(self):
        assert DataConfidenceCalculator().dimension == ConfidenceDimension.DATA


class TestSignalConfidenceCalculator:
    def test_all_confirm(self):
        calc = SignalConfidenceCalculator()
        result = calc.calculate({
            "financial_confirmation": 80,
            "technical_confirmation": 80,
            "volume_confirmation": 80,
            "pattern_confirmation": 80,
            "smart_money_confirmation": 80,
        })
        assert result.normalized_score >= 75

    def test_none_confirm(self):
        calc = SignalConfidenceCalculator()
        result = calc.calculate({
            "financial_confirmation": 20,
            "technical_confirmation": 20,
            "volume_confirmation": 20,
            "pattern_confirmation": 20,
            "smart_money_confirmation": 20,
        })
        assert result.normalized_score < 40

    def test_dimension(self):
        assert SignalConfidenceCalculator().dimension == ConfidenceDimension.SIGNAL


class TestEvidenceConfidenceCalculator:
    def test_high_evidence(self):
        calc = EvidenceConfidenceCalculator()
        result = calc.calculate({
            "evidence_coverage": 90,
            "evidence_quality": 90,
            "evidence_consistency": 90,
            "evidence_reliability": 90,
        })
        assert result.normalized_score >= 80

    def test_low_evidence(self):
        calc = EvidenceConfidenceCalculator()
        result = calc.calculate({
            "evidence_coverage": 20,
            "evidence_quality": 20,
            "evidence_consistency": 20,
            "evidence_reliability": 20,
        })
        assert result.normalized_score < 40


class TestModelConfidenceCalculator:
    def test_strong_model(self):
        calc = ModelConfidenceCalculator()
        result = calc.calculate({
            "historical_accuracy": 85,
            "previous_success": 80,
            "backtest_performance": 75,
            "walk_forward_performance": 80,
        })
        assert result.normalized_score >= 70

    def test_weak_model(self):
        calc = ModelConfidenceCalculator()
        result = calc.calculate({
            "historical_accuracy": 30,
            "previous_success": 25,
            "backtest_performance": 30,
            "walk_forward_performance": 25,
        })
        assert result.normalized_score < 50


class TestHistoricalConfidenceCalculator:
    def test_high_win_rate(self):
        calc = HistoricalConfidenceCalculator()
        result = calc.calculate({
            "historical_win_rate": 75,
            "historical_consistency": 80,
            "historical_sample_size": 20,
            "historical_avg_return": 10.0,
        })
        assert result.normalized_score >= 60

    def test_low_win_rate(self):
        calc = HistoricalConfidenceCalculator()
        result = calc.calculate({
            "historical_win_rate": 25,
            "historical_consistency": 30,
            "historical_sample_size": 3,
            "historical_avg_return": 1.0,
        })
        assert result.normalized_score < 45


class TestPatternConfidenceCalculator:
    def test_strong_pattern(self):
        calc = PatternConfidenceCalculator()
        result = calc.calculate({
            "pattern_win_rate": 70,
            "pattern_confirmation": 80,
            "pattern_quality": 75,
            "pattern_age_days": 2,
            "pattern_count": 3,
        })
        assert result.normalized_score >= 60

    def test_old_pattern(self):
        calc = PatternConfidenceCalculator()
        result = calc.calculate({
            "pattern_win_rate": 50,
            "pattern_confirmation": 50,
            "pattern_quality": 50,
            "pattern_age_days": 30,
            "pattern_count": 1,
        })
        assert result.normalized_score < 60


class TestRiskConfidenceCalculator:
    def test_good_risk(self):
        calc = RiskConfidenceCalculator()
        result = calc.calculate({
            "risk_score": 80,
            "risk_reward_ratio": 3.0,
            "max_drawdown": 5.0,
            "stop_loss_distance": 3.0,
        })
        assert result.normalized_score >= 60

    def test_bad_risk(self):
        calc = RiskConfidenceCalculator()
        result = calc.calculate({
            "risk_score": 30,
            "risk_reward_ratio": 0.5,
            "max_drawdown": 25.0,
            "stop_loss_distance": 15.0,
        })
        assert result.normalized_score < 50


class TestMarketConfidenceCalculator:
    def test_bull_market(self):
        calc = MarketConfidenceCalculator()
        result = calc.calculate({
            "market_regime_score": 80,
            "sector_trend": 75,
            "macro_environment": 70,
            "market_volatility": 15,
        })
        assert result.normalized_score >= 65

    def test_volatile_market(self):
        calc = MarketConfidenceCalculator()
        result = calc.calculate({
            "market_regime_score": 30,
            "sector_trend": 30,
            "macro_environment": 30,
            "market_volatility": 70,
        })
        assert result.normalized_score < 45


class TestSectorConfidenceCalculator:
    def test_strong_sector(self):
        calc = SectorConfidenceCalculator()
        result = calc.calculate({
            "sector_momentum": 80,
            "sector_relative_strength": 75,
            "sector_rotation_score": 70,
            "peer_comparison": 75,
        })
        assert result.normalized_score >= 70

    def test_weak_sector(self):
        calc = SectorConfidenceCalculator()
        result = calc.calculate({
            "sector_momentum": 20,
            "sector_relative_strength": 25,
            "sector_rotation_score": 30,
            "peer_comparison": 20,
        })
        assert result.normalized_score < 40


class TestExecutionConfidenceCalculator:
    def test_easy_execution(self):
        calc = ExecutionConfidenceCalculator()
        result = calc.calculate({
            "liquidity_score": 80,
            "spread_bps": 2,
            "avg_daily_volume": 500000,
            "trade_size_capacity": 100000,
        })
        assert result.normalized_score >= 60

    def test_hard_execution(self):
        calc = ExecutionConfidenceCalculator()
        result = calc.calculate({
            "liquidity_score": 20,
            "spread_bps": 50,
            "avg_daily_volume": 5000,
            "trade_size_capacity": 1000,
        })
        assert result.normalized_score < 40


class TestLiquidityConfidenceCalculator:
    def test_high_liquidity(self):
        calc = LiquidityConfidenceCalculator()
        result = calc.calculate({
            "bid_ask_spread": 1,
            "daily_volume": 500000,
            "market_cap": 5e9,
            "stock_volatility": 15,
        })
        assert result.normalized_score >= 70

    def test_low_liquidity(self):
        calc = LiquidityConfidenceCalculator()
        result = calc.calculate({
            "bid_ask_spread": 30,
            "daily_volume": 5000,
            "market_cap": 5e7,
            "stock_volatility": 60,
        })
        assert result.normalized_score < 40


class TestAllCalculators:
    def test_all_dimensions_covered(self):
        assert len(ALL_CALCULATORS) == 11

    def test_get_calculator(self):
        for dim in ConfidenceDimension:
            calc = get_calculator(dim)
            assert calc is not None

    def test_get_unknown(self):
        assert get_calculator("unknown") is None
