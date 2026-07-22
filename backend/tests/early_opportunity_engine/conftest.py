import pytest
from modules.early_opportunity_engine.core.types import (
    OpportunityStage,
    OpportunityRating,
    MarketRegimeType,
    SignalType,
    AlertType,
    RedFlagType,
    ExpectedWindow,
    AnalysisCategory,
    AnalysisSignal,
    StageResult,
    RiskAssessment,
    SimilarityAnalysis,
    MarketRegime,
    EvidenceItem,
    EvidencePackage,
    EarlyWarning,
    RedFlag,
    OpportunityScore,
    ExpectedReturn,
    OpportunityResult,
    RankedOpportunity,
    OpportunityMetadata,
    BenchmarkResult,
)


@pytest.fixture
def strong_metrics() -> dict:
    return {
        "close": 50.0,
        "open": 48.0,
        "high": 52.0,
        "low": 47.0,
        "volume": 5_000_000,
        "avg_volume": 2_500_000,
        "rsi": 35.0,
        "macd": 0.5,
        "macd_signal": 0.2,
        "adx": 30.0,
        "sma_20": 48.0,
        "sma_50": 46.0,
        "sma_200": 44.0,
        "ema_12": 49.0,
        "ema_26": 47.5,
        "pe_ratio": 10.0,
        "pb_ratio": 1.2,
        "roe": 22.0,
        "roa": 10.0,
        "debt_to_equity": 0.3,
        "dividend_yield": 3.5,
        "earnings_growth": 25.0,
        "revenue_growth": 18.0,
        "peg_ratio": 0.8,
        "current_ratio": 2.5,
        "net_margin": 18.0,
        "volume_ratio": 2.5,
        "obv_trend": 1.5,
        "cmf": 0.25,
        "mfi": 65.0,
        "mfi_signal": 45.0,
        "vwap": 49.0,
        "nvi_trend": 1.2,
        "relative_volume": 2.0,
        "order_block": True,
        "breaker_block": False,
        "fair_value_gap": True,
        "liquidity_sweep": False,
        "bos_bullish": True,
        "choc_bullish": True,
        "in_discount_zone": True,
        "mitigation_block": False,
        "equal_lows": False,
        "classical_pattern_score": 0.6,
        "candlestick_bullish_score": 0.7,
        "candlestick_bearish": 0.2,
        "double_bottom": True,
        "cup_handle": False,
        "bull_flag": True,
        "ascending_triangle": False,
        "hammer": False,
        "bullish_engulfing": True,
        "morning_star": False,
        "max_drawdown": 8.0,
        "volatility": 18.0,
        "sharpe_ratio": 2.0,
        "sortino_ratio": 2.5,
        "beta": 0.9,
        "var_95": 4.0,
        "earnings_growth": 25.0,
        "similarity_score": 0.65,
        "historical_success_rate": 0.7,
        "market_volatility": 15.0,
        "market_trend": 0.8,
        "vix": 18.0,
    }


@pytest.fixture
def weak_metrics() -> dict:
    return {
        "close": 30.0,
        "volume": 500_000,
        "avg_volume": 2_000_000,
        "rsi": 75.0,
        "macd": -0.5,
        "sma_50": 32.0,
        "sma_200": 35.0,
        "pe_ratio": 35.0,
        "pb_ratio": 5.0,
        "roe": 5.0,
        "debt_to_equity": 3.0,
        "earnings_growth": -15.0,
        "dividend_yield": 0.5,
        "volume_ratio": 0.3,
        "obv_trend": -2.0,
        "cmf": -0.2,
        "mfi": 25.0,
        "order_block": False,
        "fair_value_gap": False,
        "bos_bullish": False,
        "choc_bullish": False,
        "in_discount_zone": False,
        "classical_pattern_score": 0.1,
        "candlestick_bullish_score": 0.1,
        "candlestick_bearish": 0.8,
        "max_drawdown": 35.0,
        "volatility": 45.0,
        "sharpe_ratio": 0.3,
        "beta": 2.5,
        "var_95": 10.0,
        "market_volatility": 35.0,
        "market_trend": -0.8,
        "vix": 30.0,
    }


@pytest.fixture
def minimal_metrics() -> dict:
    return {
        "close": 25.0,
        "volume": 1_000_000,
    }


@pytest.fixture
def empty_metrics() -> dict:
    return {}


@pytest.fixture
def analysis_signal() -> AnalysisSignal:
    return AnalysisSignal(
        name="test_signal",
        category=AnalysisCategory.FINANCIAL,
        strength=0.8,
        confidence=0.9,
        description="Test signal",
    )


@pytest.fixture
def stage_result(analysis_signal: AnalysisSignal) -> StageResult:
    return StageResult(
        category=AnalysisCategory.FINANCIAL,
        score=0.75,
        signals=[analysis_signal],
        warnings=["test warning"],
    )


@pytest.fixture
def risk_assessment() -> RiskAssessment:
    return RiskAssessment(
        score=0.3,
        drawdown_probability=0.2,
        liquidity_risk=0.1,
        volatility_risk=0.3,
        sector_risk=0.2,
    )


@pytest.fixture
def expected_return() -> ExpectedReturn:
    return ExpectedReturn(conservative=10.0, expected=25.0, optimistic=50.0)


@pytest.fixture
def full_result(risk_assessment: RiskAssessment, expected_return: ExpectedReturn) -> OpportunityResult:
    return OpportunityResult(
        symbol="TEST",
        opportunity_score=75.0,
        rating=OpportunityRating.HIGH,
        stage=OpportunityStage.STAGE_4_BREAKOUT_PREPARATION,
        confidence=80.0,
        risk=risk_assessment,
        expected_window=ExpectedWindow.TWO_WEEKS,
        expected_return=expected_return,
        evidence=EvidencePackage(items=[], score=0.0, summary="test"),
        similarity=SimilarityAnalysis(score=0.5, similar_symbols=[], historical_success_rate=0.6, timeline_match="1m", details=""),
        market_regime=MarketRegimeType.SIDEWAYS,
        stage_results=[],
        warnings=[],
        red_flags=[],
        early_warnings=[],
        explanations=[],
    )
