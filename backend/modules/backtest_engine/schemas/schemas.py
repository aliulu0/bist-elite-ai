from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class PriceBarSchema(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    symbol: str = ""
    adjusted_close: Optional[float] = None


class SignalSchema(BaseModel):
    timestamp: str
    symbol: str
    action: str
    score: float = 0.0
    confidence: float = 0.0
    reason: str = ""


class BacktestRunRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    strategy: str = Field(default="default")
    start_date: str = Field(default="2023-01-01")
    end_date: str = Field(default="2025-12-31")
    initial_capital: float = Field(default=100000.0, gt=0)
    commission_pct: float = Field(default=0.001, ge=0, le=0.1)
    slippage_pct: float = Field(default=0.001, ge=0, le=0.1)
    position_size_pct: float = Field(default=10.0, gt=0, le=100)
    stop_loss_pct: float = Field(default=5.0, ge=0, le=50)
    take_profit_pct: float = Field(default=15.0, ge=0, le=100)
    max_positions: int = Field(default=10, ge=1, le=100)
    horizon: str = Field(default="3_months")
    backtest_type: str = Field(default="single_strategy")
    benchmark: str = Field(default="bist100")
    data_source: str = Field(default="strategy_engine")
    parameters: Dict[str, Any] = Field(default_factory=dict)


class TradeSchema(BaseModel):
    symbol: str
    entry_date: str
    entry_price: float
    exit_date: str = ""
    exit_price: float = 0.0
    quantity: float = 0.0
    direction: str = "buy"
    exit_reason: str = "signal"
    pnl: float = 0.0
    pnl_pct: float = 0.0
    holding_days: int = 0
    mfe: float = 0.0
    mae: float = 0.0
    entry_score: float = 0.0
    entry_confidence: float = 0.0


class PerformanceMetricsSchema(BaseModel):
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


class EquityPointSchema(BaseModel):
    timestamp: str
    equity: float
    drawdown: float = 0.0
    benchmark_equity: float = 0.0


class TradeAnalysisSchema(BaseModel):
    total_signals: int = 0
    signals_executed: int = 0
    false_positives: int = 0
    false_negatives: int = 0
    avg_holding_time: float = 0.0
    avg_opportunity_score: float = 0.0
    avg_confidence: float = 0.0
    signal_accuracy: float = 0.0


class PortfolioAnalysisSchema(BaseModel):
    portfolio_return: float = 0.0
    portfolio_risk: float = 0.0
    sector_distribution: Dict[str, float] = Field(default_factory=dict)
    cash_utilization: float = 0.0
    exposure: float = 0.0
    turnover: float = 0.0
    diversification_ratio: float = 0.0


class BacktestResultResponse(BaseModel):
    symbol: str
    strategy: str
    market_period: str
    metrics: PerformanceMetricsSchema
    trade_analysis: TradeAnalysisSchema
    portfolio_analysis: PortfolioAnalysisSchema
    trades: List[TradeSchema] = Field(default_factory=list)
    equity_curve: List[EquityPointSchema] = Field(default_factory=list)
    benchmark_metrics: Optional[PerformanceMetricsSchema] = None
    execution_time_ms: float = 0.0
    generated_at: str = ""


class BacktestListItem(BaseModel):
    symbol: str
    strategy: str
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    total_trades: int
    market_period: str


class BacktestListResponse(BaseModel):
    items: List[BacktestListItem] = Field(default_factory=list)
    total: int = 0
    generated_at: str = ""


class BacktestCompareRequest(BaseModel):
    symbols: List[str] = Field(..., min_length=2, max_length=20)
    strategy: str = Field(default="default")
    start_date: str = Field(default="2023-01-01")
    end_date: str = Field(default="2025-12-31")
    initial_capital: float = Field(default=100000.0, gt=0)
    parameters: Dict[str, Any] = Field(default_factory=dict)


class BacktestCompareResponse(BaseModel):
    count: int = 0
    best_performer: str = ""
    worst_performer: str = ""
    avg_return: float = 0.0
    avg_sharpe: float = 0.0
    metrics: Dict[str, PerformanceMetricsSchema] = Field(default_factory=dict)


class ReportRequest(BaseModel):
    symbol: str = Field(..., min_length=1)
    report_type: str = Field(default="executive")


class ReportResponse(BaseModel):
    symbol: str
    report_type: str
    content: str
    generated_at: str
    sections: Dict[str, str] = Field(default_factory=dict)


class BenchmarkResponse(BaseModel):
    operation: str
    iterations: int
    avg_time_ms: float
    min_time_ms: float
    max_time_ms: float
    success: bool


class CacheStatsResponse(BaseModel):
    size: int
    max_size: int
    hits: int
    misses: int
    hit_rate: float
    ttl_seconds: int


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    datasets_available: int = 0
    cache_stats: Optional[CacheStatsResponse] = None


class SummaryResponse(BaseModel):
    total_backtests: int = 0
    avg_return: float = 0.0
    avg_sharpe: float = 0.0
    avg_drawdown: float = 0.0
    best_symbol: str = ""
    worst_symbol: str = ""
    strategies_used: List[str] = Field(default_factory=list)


class HistoryResponse(BaseModel):
    symbol: str
    history: List[BacktestListItem] = Field(default_factory=list)
    total: int = 0
