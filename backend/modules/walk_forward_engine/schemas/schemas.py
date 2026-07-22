from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class WalkForwardRunRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    strategy: str = Field(default="default")
    start_date: str = Field(default="2020-01-01")
    end_date: str = Field(default="2025-12-31")
    window_mode: str = Field(default="rolling")
    train_test_split: str = Field(default="80_20")
    custom_train_pct: float = Field(default=0.8, gt=0.1, lt=0.95)
    window_period: str = Field(default="monthly")
    min_train_rows: int = Field(default=100, ge=10)
    min_test_rows: int = Field(default=20, ge=5)
    optimization_metric: str = Field(default="sharpe")
    validation_target: str = Field(default="strategy")
    parameter_space: Dict[str, List[Any]] = Field(default_factory=dict)
    max_combinations: int = Field(default=100, ge=1, le=10000)
    regime_aware: bool = Field(default=True)
    initial_capital: float = Field(default=100000.0, gt=0)
    commission_pct: float = Field(default=0.001, ge=0, le=0.1)
    slippage_pct: float = Field(default=0.001, ge=0, le=0.1)
    stop_loss_pct: float = Field(default=5.0, ge=0, le=50)
    take_profit_pct: float = Field(default=15.0, ge=0, le=100)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class WindowSliceSchema(BaseModel):
    index: int
    train_start: str
    train_end: str
    test_start: str
    test_end: str
    train_rows: int = 0
    test_rows: int = 0
    regime: str = "sideways"


class OptimizationResultSchema(BaseModel):
    parameters: Dict[str, Any] = Field(default_factory=dict)
    train_return: float = 0.0
    train_sharpe: float = 0.0
    train_drawdown: float = 0.0
    train_win_rate: float = 0.0
    train_trades: int = 0
    score: float = 0.0
    execution_time_ms: float = 0.0


class ValidationMetricsSchema(BaseModel):
    out_of_sample_return: float = 0.0
    out_of_sample_win_rate: float = 0.0
    out_of_sample_sharpe: float = 0.0
    out_of_sample_sortino: float = 0.0
    out_of_sample_drawdown: float = 0.0
    out_of_sample_trades: int = 0
    total_return: float = 0.0
    sharpe_ratio: float = 0.0
    max_drawdown: float = 0.0
    win_rate: float = 0.0
    profit_factor: float = 0.0
    expectancy: float = 0.0


class WindowResultSchema(BaseModel):
    window: WindowSliceSchema
    optimization: Optional[OptimizationResultSchema] = None
    validation: Optional[ValidationMetricsSchema] = None
    selected_parameters: Dict[str, Any] = Field(default_factory=dict)
    execution_time_ms: float = 0.0
    success: bool = True
    error_message: str = ""


class GeneralizationScoresSchema(BaseModel):
    generalization_score: float = 0.0
    overfitting_score: float = 0.0
    robustness_score: float = 0.0
    consistency_score: float = 0.0
    parameter_sensitivity: float = 0.0
    performance_degradation: float = 0.0
    regime_dependency: float = 0.0
    historical_drift: float = 0.0
    severity: str = "none"
    recommendation: str = ""


class RegimePerformanceSchema(BaseModel):
    regime: str
    windows_count: int = 0
    avg_return: float = 0.0
    avg_sharpe: float = 0.0
    avg_drawdown: float = 0.0
    avg_win_rate: float = 0.0
    stability: float = 0.0


class WalkForwardResultResponse(BaseModel):
    symbol: str
    strategy: str
    window_mode: str
    train_test_split: str
    total_windows: int = 0
    successful_windows: int = 0
    failed_windows: int = 0
    overall_train_return: float = 0.0
    overall_test_return: float = 0.0
    overall_train_sharpe: float = 0.0
    overall_test_sharpe: float = 0.0
    generalization: GeneralizationScoresSchema
    regime_performance: List[RegimePerformanceSchema] = Field(default_factory=list)
    recommended_parameters: Dict[str, Any] = Field(default_factory=dict)
    window_results: List[WindowResultSchema] = Field(default_factory=list)
    execution_time_ms: float = 0.0
    generated_at: str = ""


class WalkForwardListItem(BaseModel):
    symbol: str
    strategy: str
    window_mode: str
    total_windows: int
    generalization_score: float
    overfitting_score: float
    robustness_score: float
    test_return: float
    test_sharpe: float


class WalkForwardListResponse(BaseModel):
    items: List[WalkForwardListItem] = Field(default_factory=list)
    total: int = 0
    generated_at: str = ""


class WalkForwardHistoryItem(BaseModel):
    symbol: str
    strategy: str
    window_mode: str
    start_date: str
    end_date: str
    total_windows: int
    generalization_score: float
    severity: str
    execution_time_ms: float


class WalkForwardHistoryResponse(BaseModel):
    symbol: str
    history: List[WalkForwardHistoryItem] = Field(default_factory=list)
    total: int = 0


class WalkForwardReportRequest(BaseModel):
    symbol: str = Field(..., min_length=1)
    report_type: str = Field(default="executive")


class WalkForwardReportResponse(BaseModel):
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
    window_cache_size: int = 0


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    cache_stats: Optional[CacheStatsResponse] = None


class SummaryResponse(BaseModel):
    total_analyses: int = 0
    avg_generalization: float = 0.0
    avg_overfitting: float = 0.0
    avg_robustness: float = 0.0
    avg_consistency: float = 0.0
    best_symbol: str = ""
    worst_symbol: str = ""
    strategies_used: List[str] = Field(default_factory=list)
