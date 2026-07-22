from modules.scoring_engine.calculators.financial_calculators import (
    FinancialScoreCalculator, ValueScoreCalculator, GrowthScoreCalculator,
    QualityScoreCalculator, RiskScoreCalculator, LiquidityScoreCalculator,
)
from modules.scoring_engine.calculators.technical_calculators import (
    TechnicalScoreCalculator, MomentumScoreCalculator, TrendScoreCalculator,
    VolumeScoreCalculator, SmartMoneyScoreCalculator, PatternScoreCalculator,
    TimingScoreCalculator, SectorStrengthScoreCalculator, ProbabilityScoreCalculator,
    CompositeScoreCalculator,
)
from modules.scoring_engine.core.types import ScoreType, ScoreDirection


class TestFinancialScoreCalculator:
    def setup_method(self):
        self.calc = FinancialScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.FINANCIAL

    def test_calculate_full(self):
        metrics = {"pe_ratio": 15.0, "roe": 12.0, "debt_to_equity": 0.8, "net_margin": 10.0, "current_ratio": 1.5}
        bd = self.calc.calculate("TEST", metrics)
        assert 0 <= bd.normalized_score <= 100
        assert bd.evidence_count == 5

    def test_calculate_partial(self):
        bd = self.calc.calculate("TEST", {"pe_ratio": 15.0})
        assert 0 <= bd.normalized_score <= 100

    def test_calculate_empty(self):
        bd = self.calc.calculate("TEST", {})
        assert bd.normalized_score == 50.0


class TestValueScoreCalculator:
    def setup_method(self):
        self.calc = ValueScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.VALUE

    def test_calculate(self):
        bd = self.calc.calculate("TEST", {"pe_ratio": 10.0, "pb_ratio": 1.2, "peg_ratio": 0.9})
        assert 0 <= bd.normalized_score <= 100


class TestGrowthScoreCalculator:
    def setup_method(self):
        self.calc = GrowthScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.GROWTH

    def test_calculate(self):
        bd = self.calc.calculate("TEST", {"earnings_growth": 25.0, "revenue_growth": 20.0})
        assert 0 <= bd.normalized_score <= 100

    def test_negative_growth(self):
        bd = self.calc.calculate("TEST", {"earnings_growth": -10.0})
        assert 0 <= bd.normalized_score <= 100


class TestQualityScoreCalculator:
    def setup_method(self):
        self.calc = QualityScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.QUALITY

    def test_calculate(self):
        bd = self.calc.calculate("TEST", {"roe": 15.0, "roa": 8.0, "net_margin": 12.0, "current_ratio": 2.0})
        assert 0 <= bd.normalized_score <= 100


class TestRiskScoreCalculator:
    def setup_method(self):
        self.calc = RiskScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.RISK

    def test_direction(self):
        assert self.calc.direction == ScoreDirection.LOWER_IS_BETTER

    def test_calculate(self):
        bd = self.calc.calculate("TEST", {"volatility": 20.0, "max_drawdown": -10.0, "beta": 1.1})
        assert 0 <= bd.normalized_score <= 100

    def test_low_volatility_high_score(self):
        bd_low = self.calc.calculate("TEST", {"volatility": 10.0})
        bd_high = self.calc.calculate("TEST", {"volatility": 50.0})
        assert bd_low.normalized_score > bd_high.normalized_score


class TestLiquidityScoreCalculator:
    def setup_method(self):
        self.calc = LiquidityScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.LIQUIDITY

    def test_calculate(self):
        bd = self.calc.calculate("TEST", {"volume_ratio": 1.5, "relative_volume": 1.2})
        assert 0 <= bd.normalized_score <= 100


class TestTechnicalScoreCalculator:
    def setup_method(self):
        self.calc = TechnicalScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.TECHNICAL

    def test_calculate(self):
        bd = self.calc.calculate("TEST", {"rsi": 45.0, "macd": 1.5, "macd_signal": 0.8, "adx": 25.0})
        assert 0 <= bd.normalized_score <= 100


class TestMomentumScoreCalculator:
    def setup_method(self):
        self.calc = MomentumScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.MOMENTUM

    def test_calculate(self):
        bd = self.calc.calculate("TEST", {"momentum": 5.0, "roc": 3.0, "rsi": 60.0})
        assert 0 <= bd.normalized_score <= 100


class TestTrendScoreCalculator:
    def setup_method(self):
        self.calc = TrendScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.TREND

    def test_bullish_trend(self):
        bd = self.calc.calculate("TEST", {"sma_50": 55.0, "sma_200": 45.0, "close": 56.0})
        assert bd.normalized_score > 50

    def test_bearish_trend(self):
        bd = self.calc.calculate("TEST", {"sma_50": 40.0, "sma_200": 50.0, "close": 38.0})
        assert bd.normalized_score < 50


class TestVolumeScoreCalculator:
    def setup_method(self):
        self.calc = VolumeScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.VOLUME

    def test_calculate(self):
        bd = self.calc.calculate("TEST", {"volume_ratio": 2.0, "cmf": 0.15, "mfi": 65.0})
        assert 0 <= bd.normalized_score <= 100


class TestSmartMoneyScoreCalculator:
    def setup_method(self):
        self.calc = SmartMoneyScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.SMART_MONEY

    def test_with_signals(self):
        bd = self.calc.calculate("TEST", {"order_block": 1, "fair_value_gap": 1, "bos_bullish": 1})
        assert bd.normalized_score > 50

    def test_no_signals(self):
        bd = self.calc.calculate("TEST", {})
        assert bd.normalized_score <= 50


class TestPatternScoreCalculator:
    def setup_method(self):
        self.calc = PatternScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.PATTERN

    def test_calculate(self):
        bd = self.calc.calculate("TEST", {"classical_pattern_score": 75.0, "candlestick_bullish_score": 0.8})
        assert 0 <= bd.normalized_score <= 100


class TestTimingScoreCalculator:
    def setup_method(self):
        self.calc = TimingScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.TIMING

    def test_oversold_high_score(self):
        bd = self.calc.calculate("TEST", {"rsi": 25.0, "stoch_k": 15.0})
        assert bd.normalized_score > 50

    def test_overbought_low_score(self):
        bd = self.calc.calculate("TEST", {"rsi": 80.0, "stoch_k": 85.0})
        assert bd.normalized_score < 50


class TestSectorStrengthScoreCalculator:
    def setup_method(self):
        self.calc = SectorStrengthScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.SECTOR_STRENGTH

    def test_calculate(self):
        bd = self.calc.calculate("TEST", {"sector_momentum": 3.0, "sector_relative_strength": 0.5})
        assert 0 <= bd.normalized_score <= 100


class TestProbabilityScoreCalculator:
    def setup_method(self):
        self.calc = ProbabilityScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.PROBABILITY

    def test_calculate(self):
        bd = self.calc.calculate("TEST", {"opportunity_score": 80.0, "opportunity_confidence": 0.85})
        assert 0 <= bd.normalized_score <= 100


class TestCompositeScoreCalculator:
    def setup_method(self):
        self.calc = CompositeScoreCalculator()

    def test_score_type(self):
        assert self.calc.score_type == ScoreType.COMPOSITE

    def test_with_sub_scores(self):
        bd = self.calc.calculate("TEST", {}, sub_scores={"financial": 80.0, "momentum": 60.0})
        assert bd.normalized_score == 70.0

    def test_without_sub_scores(self):
        bd = self.calc.calculate("TEST", {})
        assert bd.normalized_score == 50.0
