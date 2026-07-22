from __future__ import annotations

import enum
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


# ── Enums ──────────────────────────────────────────────────────────────────

class BacktestType(enum.Enum):
    SINGLE_STRATEGY = "single_strategy"
    PORTFOLIO = "portfolio"
    MULTI_STRATEGY = "multi_strategy"
    ROLLING = "rolling"
    INCREMENTAL = "incremental"
    EVENT_DRIVEN = "event_driven"


class InvestmentHorizon(enum.Enum):
    WEEKLY = "weekly"
    MONTH_1 = "1_month"
    MONTH_3 = "3_months"
    MONTH_6 = "6_months"
    MONTH_12 = "12_months"


class MarketPeriod(enum.Enum):
    BULL = "bull"
    BEAR = "bear"
    SIDEWAYS = "sideways"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"
    CRISIS = "crisis"
    RECOVERY = "recovery"


class SignalAction(enum.Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"
    SHORT = "short"
    COVER = "cover"


class BenchmarkType(enum.Enum):
    BIST100 = "bist100"
    SECTOR_INDEX = "sector_index"
    EQUAL_WEIGHT = "equal_weight"
    BUY_AND_HOLD = "buy_and_hold"
    CUSTOM = "custom"


class ExportFormat(enum.Enum):
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"
    JSON = "json"


class DataSource(enum.Enum):
    STRATEGY_ENGINE = "strategy_engine"
    UNIFIED_SCORING = "unified_scoring"
    ELITE_SCORE = "elite_score"
    EARLY_OPPORTUNITY = "early_opportunity"
    DECISION_ENGINE = "decision_engine"
    CONFIDENCE_ENGINE = "confidence_engine"


class TradeExitReason(enum.Enum):
    SIGNAL = "signal"
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"
    TRAILING_STOP = "trailing_stop"
    TIME_EXIT = "time_exit"
    END_OF_DATA = "end_of_data"


class ReportType(enum.Enum):
    EXECUTIVE = "executive"
    TRADE_LIST = "trade_list"
    PERFORMANCE = "performance"
    RISK = "risk"
    BENCHMARK = "benchmark"
    FULL = "full"


# ── Core Data Classes ──────────────────────────────────────────────────────

@dataclass
class PriceBar:
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    symbol: str = ""
    adjusted_close: Optional[float] = None

    @property
    def typical_price(self) -> float:
        return (self.high + self.low + self.close) / 3.0


@dataclass
class Signal:
    timestamp: str
    symbol: str
    action: SignalAction
    score: float = 0.0
    confidence: float = 0.0
    reason: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Trade:
    symbol: str
    entry_date: str
    entry_price: float
    exit_date: str = ""
    exit_price: float = 0.0
    quantity: float = 0.0
    direction: SignalAction = SignalAction.BUY
    exit_reason: TradeExitReason = TradeExitReason.SIGNAL
    pnl: float = 0.0
    pnl_pct: float = 0.0
    holding_days: int = 0
    mfe: float = 0.0
    mae: float = 0.0
    entry_score: float = 0.0
    entry_confidence: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PerformanceMetrics:
    total_return: float = 0.0
    annualized_return: float = 0.0
    max_drawdown: float = 0.0
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0
    calmar_ratio: float = 0.0
    win_rate: float = 0.0
    profit_factor: float = 0.0
    average_gain: float = 0.0
    average_loss: float = 0.0
    expectancy: float = 0.0
    recovery_factor: float = 0.0
    ulcer_index: float = 0.0
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    avg_holding_days: float = 0.0
    max_consecutive_wins: int = 0
    max_consecutive_losses: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EquityPoint:
    timestamp: str
    equity: float
    drawdown: float = 0.0
    benchmark_equity: float = 0.0


@dataclass
class TradeAnalysis:
    total_signals: int = 0
    signals_executed: int = 0
    false_positives: int = 0
    false_negatives: int = 0
    avg_holding_time: float = 0.0
    avg_opportunity_score: float = 0.0
    avg_confidence: float = 0.0
    signal_accuracy: float = 0.0


@dataclass
class PortfolioAnalysis:
    portfolio_return: float = 0.0
    portfolio_risk: float = 0.0
    sector_distribution: Dict[str, float] = field(default_factory=dict)
    cash_utilization: float = 0.0
    exposure: float = 0.0
    turnover: float = 0.0
    diversification_ratio: float = 0.0


@dataclass
class BenchmarkResult:
    operation: str
    iterations: int
    avg_time_ms: float
    min_time_ms: float
    max_time_ms: float
    std_dev_ms: float
    total_time_ms: float
    memory_mb: float
    success: bool
    error_message: str = ""


@dataclass
class BacktestRequest:
    symbol: str
    strategy: str
    start_date: str
    end_date: str
    initial_capital: float = 100000.0
    commission_pct: float = 0.001
    slippage_pct: float = 0.001
    position_size_pct: float = 10.0
    stop_loss_pct: float = 5.0
    take_profit_pct: float = 15.0
    max_positions: int = 10
    horizon: InvestmentHorizon = InvestmentHorizon.MONTH_3
    backtest_type: BacktestType = BacktestType.SINGLE_STRATEGY
    benchmark: BenchmarkType = BenchmarkType.BIST100
    data_source: DataSource = DataSource.STRATEGY_ENGINE
    parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BacktestResult:
    request: BacktestRequest
    trades: List[Trade] = field(default_factory=list)
    equity_curve: List[EquityPoint] = field(default_factory=list)
    metrics: PerformanceMetrics = field(default_factory=PerformanceMetrics)
    trade_analysis: TradeAnalysis = field(default_factory=TradeAnalysis)
    portfolio_analysis: PortfolioAnalysis = field(default_factory=PortfolioAnalysis)
    benchmark_metrics: Optional[PerformanceMetrics] = None
    market_period: MarketPeriod = MarketPeriod.SIDEWAYS
    execution_time_ms: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BacktestComparison:
    backtest_ids: List[str] = field(default_factory=list)
    metrics_comparison: Dict[str, PerformanceMetrics] = field(default_factory=dict)
    best_performer: str = ""
    worst_performer: str = ""
    correlation_matrix: Dict[str, Dict[str, float]] = field(default_factory=dict)


# ── Classification Helpers ─────────────────────────────────────────────────

def classify_market_period(returns: List[float], volatility: float = 0.0) -> MarketPeriod:
    if not returns:
        return MarketPeriod.SIDEWAYS
    avg_return = sum(returns) / len(returns)
    if volatility > 40:
        return MarketPeriod.HIGH_VOLATILITY
    if avg_return > 0.14:
        return MarketPeriod.BULL
    elif avg_return < -0.10:
        return MarketPeriod.BEAR
    elif abs(avg_return) < 0.05:
        return MarketPeriod.SIDEWAYS
    elif avg_return > 0:
        return MarketPeriod.RECOVERY
    else:
        return MarketPeriod.CRISIS


def classify_trade_quality(trade: Trade) -> str:
    if trade.pnl_pct > 10 and trade.holding_days < 30:
        return "excellent"
    elif trade.pnl_pct > 5:
        return "good"
    elif trade.pnl_pct > 0:
        return "fair"
    elif trade.pnl_pct > -5:
        return "poor"
    else:
        return "terrible"


def classify_sharpe(ratio: float) -> str:
    if ratio >= 3.0:
        return "exceptional"
    elif ratio >= 2.0:
        return "excellent"
    elif ratio >= 1.0:
        return "good"
    elif ratio >= 0.5:
        return "acceptable"
    elif ratio >= 0:
        return "poor"
    else:
        return "unacceptable"
