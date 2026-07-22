# Changelog

## [2.4.0] - 2026-07-21

### Audit
- Enterprise Architecture Freeze & Project Audit completed
- 25 modules audited, 208 API endpoints reviewed, 4,561 tests verified
- Architecture Score: 72/100, Production Readiness: 40/100
- Decision: REVISION REQUIRED
- 3 critical, 5 high, 8 medium severity issues identified
- Revision sprint plan generated (4 weeks)
- Full audit report: docs/ARCHITECTURE_AUDIT.md

## [2.3.0] - 2026-07-20

### Added

#### Enterprise Position Sizing & Risk Allocation Engine (`modules/position_sizing_engine/`)
- **Core Types**: InvestmentHorizon (7), RiskProfile (4), PositionGrade (5), StopLossType (4), ReportType (6)
- **PositionCalculator**: Raw size computation, risk/regime/liquidity adjustments, stop loss generation (4 types), take profit, position grading, explainability
- **RiskAllocator**: Sector exposure limits, correlation limits, HHI-based concentration risk, bear market reduction, high volatility cash increase, portfolio exposure calculation
- **Risk Profile Manager**: Conservative/Balanced/Aggressive/Custom presets with configurable max/min position, sector limits, cash reserve, risk per trade
- **Stop Loss Types**: Suggested, ATR-based, Volatility-based, Trailing (optional)
- **Take Profit**: Primary/secondary targets with risk/reward ratio
- **Position Grades**: A+ (≥90), A (≥75), B (≥55), C (≥35), D (<35)
- **Portfolio Exposure**: Sector, market, risk exposure, cash ratio, concentration risk
- **Validators**: Request validation (positions, horizon, profile, capital), Result validation (positions, grades, scores)
- **6 Report Types**: Full, Summary, Allocation, Risk, Exposure, Explainability
- **Position Sizing Cache**: TTL + LRU with hit/miss tracking
- **11 Pydantic Schemas**: Request/response models for all endpoints
- **Service Layer**: calculate(), get_current(), get_history(), generate_report(), get_exposure(), clear_cache(), get_cache_stats()
- **6 API Endpoints**: POST calculate, GET current, GET report/{type}, GET exposure, GET cache/stats, POST cache/clear
- **Router**: Registered in app/main.py as position_sizing_router
- **274 tests** across core (63), calculator (55), allocator (30), profiles (32), service (29), cache+validators (45), api (20)

## [2.2.0] - 2026-07-20

### Added

#### Enterprise Portfolio Construction Engine (`modules/portfolio_engine/`)
- **Core Types**: PortfolioSize (5/10/15/20), InvestmentHorizon (5), RiskLevel (5), RejectionReason (7), ReportType (6), SortField (6)
- **StockRanker**: rank() with 6 sort fields (composite, elite, decision, confidence, risk, liquidity), compute_composite_scores()
- **PortfolioSelector**: 5 selection rules (elite score, confidence, liquidity, risk, decision score) with configurable thresholds
- **Diversifier**: Sector-based diversification with max_per_sector, HHI-based diversification score, concentration risk, sector/liquidity/risk distribution
- **6 Report Types**: Full, Summary, Selected Stocks, Rejected Stocks, Sector Distribution, Risk Summary
- **Portfolio Quality Metrics**: Average elite/confidence/risk/liquidity scores, sector distribution, diversification score, concentration risk
- **Validators**: Request validation (candidates, size, sector limits, date), Result validation (proposal, quality)
- **Portfolio Cache**: TTL + LRU with hit/miss tracking
- **Singleton Registry**: ranker, selector, diversifier, validator, report_generator, cache
- **18 Pydantic Schemas**: Request/response models for all endpoints
- **Service Layer**: generate(), get_current(), get_history(), generate_report(), clear_cache(), get_cache_stats()
- **6 API Endpoints**: POST generate, GET list, GET current, GET report/{type}, GET cache/stats, POST cache/clear
- **Router**: Registered in app/main.py as portfolio_router
- **252 tests** across core (67), ranking (26), selection (20), diversification (37), cache+registry (40), service (35), api (25)

## [2.1.0] - 2026-07-20

### Added

#### Enterprise Multi-Factor Analysis Engine (`modules/multi_factor_engine/`)
- **Core Types**: 12 FactorGroups, 49 FactorNames, 12 MarketRegimes, 5 InvestmentHorizons, 6 ReportTypes, 3 BenchmarkResultStatuses
- **12 Factor Groups**: Value, Growth, Quality, Momentum, Trend, Risk, Smart Money, Profitability, Efficiency, Financial Strength, Technical Strength, Liquidity
- **49 Individual Factors**: PD/DD, F/K, FD/FAVÖK, PEG, Enterprise Value, Sector Relative Valuation, Revenue Growth, Net Profit Growth, EBITDA Growth, EPS Growth, Cash Flow Growth, ROE, ROA, Gross Margin, Operating Margin, Net Margin, Piotroski Score, Altman Z, RSI, MACD, ADX, ROC, Relative Strength, SMA/EMA Signals, Golden Cross, SuperTrend, Ichimoku, Volatility, Beta, Max Drawdown, Liquidity Risk, OBV, CMF, Relative Volume, Volume Spike, Institutional Accumulation, Gross Profit Margin, Operating Profitability, Asset/Inventory/Receivable Turnover, Current Ratio, Debt/Equity, Interest Coverage, Free Cash Flow Yield, ATR/Bollinger/VWAP Strength, Depth of Market, Bid-Ask Spread
- **12 Factor Calculators**: BaseFactorCalculator (ABC), ValueFactorCalculator, GrowthFactorCalculator, QualityFactorCalculator, MomentumFactorCalculator, TrendFactorCalculator, RiskFactorCalculator, SmartMoneyFactorCalculator, ProfitabilityFactorCalculator, EfficiencyFactorCalculator, FinancialStrengthFactorCalculator, TechnicalStrengthFactorCalculator, LiquidityFactorCalculator
- **Dynamic Weights**: Adapt by Market Regime, Investment Horizon, Sector — 5 horizon profiles, 6 regime profiles
- **Factor Ranker**: rank() groups and factors, strength/weakness identification, rank_batch() for multi-symbol comparison
- **Factor Profile Generator**: Radar data, strength/weakness ranking, top/bottom factor identification
- **Validators**: Request validation (symbol, date, data sources), Result validation (score range, group completeness)
- **Factor Cache**: TTL + LRU with hit/miss tracking
- **Benchmark Runner**: Timed execution, error capture, summary statistics
- **6 Report Types**: Full, Summary, Factor Breakdown, Ranking, Comparison, Regime-Adapted
- **28 Pydantic Schemas**: Request/response models for all endpoints
- **Service Layer**: analyze(), get_factor_list(), get_factor_details(), get_history(), generate_report(), clear_cache(), get_cache_stats()
- **7 API Endpoints**: POST analyze, GET list, GET details/{group}, GET history/{symbol}, GET cache/stats, POST cache/clear, GET report/{type}
- **Router**: Registered in app/main.py as multi_factor_router
- **340 tests** across core (52), calculators (98), ranking (14), validators (18), profiles (15), cache+registry (30), service (28), api (27)

## [2.0.0] - 2026-07-20

### Added

#### Enterprise Market Regime Engine (`modules/market_regime_engine/`)
- **Core Types**: 12 MarketRegimes, 9 DetectionSignals, 5 InvestmentHorizons, 7 ReportTypes, 3 SectorStrengths, 7 TransitionTypes, 8 StrategyProfiles, plus 7 dataclasses (RegimeSignal, RegimeClassification, SectorAnalysis, RegimeTransition, RegimeHistoryEntry, RegimeAnalysisRequest, RegimeAnalysisResult)
- **12 Market Regimes**: Strong Bull, Bull, Weak Bull, Sideways, Weak Bear, Bear, Strong Bear, Recovery, Distribution, Accumulation, High Volatility, Low Volatility
- **9 Detection Signals**: Moving Average Structure, Breadth Indicators, Volatility, Momentum, Trend Strength, Volume Expansion, Sector Rotation, Liquidity, Market Participation
- **9 Detectors**: MovingAverageDetector (MA alignment scoring), BreadthDetector (AD ratio, % above MA, new highs/lows), VolatilityDetector (VIX-based, ATR), MomentumDetector (RSI, MACD, ROC, Stochastic), TrendStrengthDetector (ADX, +DI/-DI), VolumeExpansionDetector (relative volume, OBV, CMF), SectorRotationDetector (leading vs weak sectors), LiquidityDetector (spread, depth, turnover), ParticipationDetector (AD%, above 200MA, new highs, up volume)
- **Regime Classifier**: Weighted multi-signal classification, transition probability computation, next-regime prediction, strategy profile determination
- **History Tracker**: Record regime entries, detect changes, compute durations, build transition matrix, get dominant regime
- **Sector Analysis**: Leading/Weak/Neutral/Rotating classification with performance, momentum, volume trend scoring
- **Strategy Profiles**: Aggressive Growth, Moderate Growth, Balanced, Defensive, Very Defensive, Market Neutral, Momentum, Mean Reversion — auto-mapped from regime
- **Risk Implications**: Risk level per regime, position sizing recommendations, volatility regime classification
- **Regime Transitions**: Bull→Sideways, Sideways→Bear, Bear→Recovery, Recovery→Bull, Accumulation→Breakout, Distribution→Downtrend
- **Validators**: Request validation (date, lookback, confidence, market_data), result validation (classification, confidence, score)
- **6 Report Types**: Current Regime, Regime History, Regime Changes, Sector Rotation, Expected Next Regime, Risk Implications, Full
- **Report Generator**: Regime timeline, transition matrix, sector rotation map, risk recommendations per regime
- **Market Regime Registry**: Singleton with classifier/history_tracker/report_generator/validators/cache registration
- **Regime Cache**: TTL + LRU with hit/miss tracking
- **Benchmark Runner**: Timed execution, error capture, result history
- **28 Pydantic Schemas**: Request/response models for all endpoints
- **Service Layer**: analyze(), get_current(), get_history(), get_sectors(), get_transitions(), generate_report(), clear_cache(), get_cache_stats()
- **8 API Endpoints**: POST analyze, GET current, GET history, GET sectors, GET transitions, GET report/{type}, GET cache/stats, POST cache/clear
- **Router**: Registered in app/main.py as market_regime_router
- **237 tests** across core (48), detectors (37), classification (15), history (20), validators (14), cache (14), registry (13), service+api (40+37)

## [1.9.0] - 2026-07-20

### Added

#### Enterprise Historical Similarity Engine (`modules/similarity_engine/`)
- **Core Types**: 6 SimilarityMethods, 6 SimilarityLabels, 5 MarketRegimes, 3 PatternOutcomes, 10 FeatureCategories, 7 ReportTypes, 5 ValidationPeriods, plus 8 dataclasses (FeatureVector, SimilarityResult, HistoricalOutcome, PatternMemory, SimilarityRequest, SimilarityAnalysis, BenchmarkResult)
- **6 Similarity Methods**: Weighted Feature, Cosine Similarity, Euclidean Distance, Manhattan Distance, Dynamic Time Warping, Hybrid Similarity Score
- **6 Similarity Labels**: Very Weak, Weak, Moderate, Strong, Very Strong, Exceptional — with configurable thresholds
- **Feature Store**: Feature vector storage with symbol/date/category indexing, batch store, search with filters, normalization, common feature detection
- **Similarity Engine**: Multi-method similarity computation, find_most_similar, batch_similarity, ensemble_similarity with weighted method combination
- **Ranking Engine**: Rank by score/consistency/return/risk/regime/pattern, composite ranking, deduplication, label filtering
- **Timeline Analyzer**: Historical outcome computation (synthetic + price data), period return analysis, regime/pattern distribution, confidence scoring, pattern memory classification (successful/failed/neutral)
- **5 Market Regimes**: Bull, Bear, Sideways, High Volatility, Low Volatility
- **Pattern Memory**: Store successful/failed/neutral cases with outcome classification
- **Similarity Distance Functions**: Weighted Euclidean, Cosine, Manhattan, DTW, Hybrid — all with dictionary-based vectors
- **Validators**: Request validation (symbol, date, top_n, methods, lookback, min_similarity), result validation, completeness check
- **6 Report Types**: Executive Summary, Top Similar Stocks, Performance Comparison, Similarity Heatmap, Feature Comparison, Risk Comparison, Full
- **Report Generator**: Feature comparison with avg/min/max distances, heatmap with symbol×date matrix, risk comparison with drawdown/win rate/regime
- **Similarity Registry**: Singleton with feature_store/similarity_engine/ranking_engine/timeline_analyzer/report_generator/validators registration
- **Similarity Cache**: TTL + LRU with hit/miss tracking, deterministic key generation
- **Benchmark Runner**: Timed execution, error capture, result history
- **28 Pydantic Schemas**: Request/response models for all endpoints
- **Service Layer**: analyze(), get_list(), get_top(), get_details(), get_history(), generate_report(), store_feature_vector(), clear_cache(), get_cache_stats()
- **7 API Endpoints**: POST analyze, GET list, GET top, GET details, GET history, GET report/{symbol}, GET cache/stats, POST cache/clear
- **Router**: Registered in app/main.py as similarity_router
- **225 tests** across core (38), feature_store (22), similarity_models (17), ranking (13), timeline (17), validators (18), cache (13), registry (10), service (26), schemas (12), API (39)

## [1.8.0] - 2026-07-20

### Added

#### Enterprise Strategy Optimizer (`modules/strategy_optimizer/`)
- **Core Types**: 6 OptimizationTypes, 5 InvestmentHorizons, 8 OptimizationObjectives, 4 ValidationStages, 7 RejectionReasons, 6 ReportTypes, 11 ParameterCategories, plus 10 dataclasses (ParameterRange, ParameterCandidate, OptimizationRun, OptimizationRequest, OptimizationResult, BenchmarkResult)
- **6 Optimization Types**: Rule Threshold, Weight, Bonus, Penalty, Filter, Ranking
- **5 Investment Horizons**: Weekly, 1 Month, 3 Months, 6 Months, 12 Months — each with independent profiles
- **8 Optimization Objectives**: Maximize Return, Maximize Sharpe, Minimize Drawdown, Maximize Win Rate, Increase Consistency, Reduce False Positives, Reduce False Negatives, Improve Robustness
- **Parameter Engine**: Search space construction for each optimization type, discrete/continuous parameter support, grid search, random search, candidate perturbation
- **Fitness Calculator**: Multi-objective weighted fitness scoring, normalization (return/sharpe/drawdown/win rate), candidate ranking and top-N selection
- **Horizon Profiles**: Independent profiles per horizon with lookback days, min trades, max drawdown, rebalance frequency, targeted objectives/categories/types
- **Validators**: Request validation (symbol, dates, capital, iterations), parameter space validation, result validation, candidate score validation, rejection rule checking
- **Strategy Optimizer**: Full optimization pipeline with early stopping, patience-based convergence, candidate simulation, performance/risk improvement computation
- **7 Rejection Reasons**: Overfitting, Reduced Robustness, Excessive Drawdown, Inconsistent Regimes, Degraded Performance, High Parameter Sensitivity, Low Generalization
- **Strategy Optimizer Registry**: Singleton with optimizer/parameter_engine/fitness_calculator/profile_manager/validator registration, run history
- **Optimization Cache**: TTL + LRU with hit/miss tracking, deterministic key generation
- **Benchmark Runner**: Timed execution, args/kwargs support, error capture, result history
- **28 Pydantic Schemas**: Request/response models for all endpoints including cache stats and benchmark results
- **Service Layer**: run_optimization(), get_history(), get_history_by_symbol(), get_run(), get_report() (6 report types), get_cache_stats(), clear_cache()
- **6 Report Types**: Optimization Summary, Parameter Comparison, Performance Improvement, Rejected Candidates, Accepted Candidates, Full
- **7 API Endpoints**: POST run, GET list, GET history/{run_id}, GET report/{run_id}, GET cache/stats, POST cache/clear
- **Router**: Registered in app/main.py as strategy_optimizer_router
- **228 tests** across core (30), parameter_engine (18), fitness (20), profiles (16), optimizer (20), validators (22), registry (9), cache (14), benchmark (10), schemas (20), service (17), API (32)

## [1.7.0] - 2026-07-20

### Added

#### Enterprise Monte Carlo Risk Laboratory (`modules/monte_carlo_engine/`)
- **Core Types**: 8 SimulationMethods, 9 MarketScenarios, 10 RiskMeasures, 8 ReportTypes, 4 ConfidenceLevels, 5 ValidationTargets, plus 10 dataclasses (SimulationConfig, SimulationResult, RiskMetrics, ProbabilityMetrics, PortfolioMetrics, ScenarioResult, ConfidenceInterval, MonteCarloRequest, MonteCarloResult, BenchmarkResult)
- **8 Simulation Methods**: Historical Bootstrap, Geometric Brownian Motion, Block Bootstrap, Regime Switching, Student-t Distribution, Fat Tail Simulation, Jump Diffusion, Custom Probability Models
- **10 Risk Metrics**: Value at Risk (VaR 90/95/99), Conditional VaR (CVaR 95/99), Maximum Drawdown, Expected Drawdown, Tail Risk, Probability of Loss, Probability of Outperformance, Probability of Capital Preservation, Risk of Ruin, Ulcer Index
- **Probability Metrics**: Loss probabilities at 1%/5%/10%/20%, Gain probabilities at 5%/10%/20%/50%, Double/Halve probability, Expected/Median Return, Skewness, Kurtosis
- **Portfolio Analysis**: Portfolio Return, Volatility, Diversification Benefit, Correlation Impact, Sector Concentration, Liquidity Stress, Sharpe Ratio, Sortino Ratio
- **9 Market Scenarios**: Bull, Bear, Sideways, High Inflation, High Interest Rate, Low Liquidity, Flash Crash, Black Swan, Recovery
- **Scenario Generator**: Impact scoring, scenario ranking, probability-weighted analysis
- **Risk Model Engine**: VaR/CVaR calculation, tail risk analysis, confidence intervals, ulcer index
- **Monte Carlo Simulator**: Deterministic seeding, GBM with drift/volatility, regime switching, block bootstrap
- **Report Generator**: Executive Summary, Simulation Summary, Worst Case, Best Case, Expected Case, Tail Risk, Capital Preservation, Full Report
- **Monte Carlo Registry**: Singleton with simulator/risk_model/scenario_generator/factory registration
- **Monte Carlo Cache**: TTL + LRU with hit/miss tracking
- **Engine Benchmark**: Warmup + timed execution, memory tracking, comparison mode
- **Monte Carlo Validator**: Request validation (symbol, dates, capital, simulations, volatility), result validation (simulations, risk metrics, execution time)
- **28 Pydantic Schemas**: Request/response models for all endpoints
- **Service Layer**: run_simulation(), get_result(), list_results(), generate_report(), get_scenarios(), summary(), clear_cache(), cache_stats(), run_engine_benchmark(), health_check()
- **9 API Endpoints**: POST run, GET list, GET summary, POST report, GET scenarios, POST benchmark, GET cache/stats, POST cache/clear, GET health
- **Router**: Registered in app/main.py as monte_carlo_router
- **161 tests** across types (19), simulation (15), risk_models (11), scenario (7), portfolio (7), statistics (7), validator (12), reports (10), registry (10), cache (12), benchmark (7), schemas (14), service (18), API (10)

## [1.6.0] - 2026-07-20

### Added

#### Enterprise Walk Forward Analysis Engine Module (`modules/walk_forward_engine/`)
- **Core Types**: 6 WindowModes, 5 TrainTestSplits, 5 WindowPeriods, 5 ValidationTargets, 5 MarketRegimes, 7 ReportTypes, 5 OverfittingSeverity levels, plus dataclasses (WindowSlice, OptimizationResult, ValidationMetrics, WindowResult, GeneralizationScores, RegimePerformance, WalkForwardRequest, WalkForwardResult, WalkForwardComparison, BenchmarkResult)
- **Window Modes**: Rolling, Expanding, Anchored, Sliding, Hybrid — configurable train/test splits (70/30, 75/25, 80/20, 85/15, Custom)
- **Window Periods**: Weekly, Monthly, Quarterly, Semi Annual, Annual
- **Validation Targets**: Strategy Stability, Score Stability, Decision Stability, Opportunity Stability, Confidence Stability
- **Overfitting Detection**: Parameter Sensitivity, Performance Degradation, Regime Dependency, Historical Drift — with 5-level severity classification
- **Generalization Scores**: Generalization, Overfitting, Robustness, Consistency — composite scoring
- **Market Regimes**: Bull, Bear, Sideways, High Volatility, Low Volatility — with regime-aware analysis
- **Window Manager**: Full window generation for all 5 modes with date-aware slicing, regime assignment
- **Parameter Optimizer**: Grid search with configurable parameter space, custom strategy functions, optimization history tracking
- **Walk-Forward Statistics**: Generalization scores, regime performance, window metrics, parameter sensitivity, performance degradation, historical drift
- **Report Generator**: Executive Summary, Optimization History, Training Results, Validation Results, Failure Analysis, Generalization Report, Full Report
- **Walk-Forward Registry**: Singleton with strategy/optimizer/validator/factory registration
- **Walk-Forward Cache**: TTL + LRU with incremental window-level caching, hit/miss tracking
- **Engine Benchmark**: Warmup + timed execution, memory tracking, comparison mode
- **Walk-Forward Validator**: Request validation (symbol, dates, capital, window config, optimization), result validation (windows, generalization, consistency)
- **25 Pydantic Schemas**: Request/response models for all endpoints
- **Service Layer**: run_analysis(), get_result(), list_results(), get_history(), generate_report(), summary(), clear_cache(), cache_stats(), run_engine_benchmark(), health_check()
- **8 API Endpoints**: POST run, GET list, GET history/{symbol}, GET summary, POST report, POST benchmark, GET cache/stats, POST cache/clear, GET health
- **Router**: Registered in app/main.py as walk_forward_router
- **172 tests** across types (37), windows (11), optimization (12), validator (17), statistics (12), reports (13), registry (13), cache (17), benchmark (9), schemas (15), service (18), API (9)

## [1.5.0] - 2026-07-20

### Added

#### Enterprise Backtest Engine Module (`modules/backtest_engine/`)
- **Core Types**: 6 BacktestTypes, 5 InvestmentHorizons, 7 MarketPeriods, 5 SignalActions, 5 BenchmarkTypes, 4 ExportFormats, 6 DataSources, 6 TradeExitReasons, 6 ReportTypes, plus dataclasses (PriceBar, Signal, Trade, PerformanceMetrics, EquityPoint, TradeAnalysis, PortfolioAnalysis, BenchmarkResult, BacktestRequest, BacktestResult, BacktestComparison)
- **Backtest Types**: Single Strategy, Portfolio, Multi Strategy, Rolling, Incremental, Event Driven
- **13 Performance Metrics**: Total Return, Annualized Return, Max Drawdown, Sharpe Ratio, Sortino Ratio, Calmar Ratio, Win Rate, Profit Factor, Average Gain, Average Loss, Expectancy, Recovery Factor, Ulcer Index
- **Trade Analysis**: Entry/Exit dates, holding period, entry/exit prices, MFE/MAE, exit reasons (Signal, Stop Loss, Take Profit, Trailing Stop, Time Exit, End of Data)
- **Strategy Analysis**: Signals generated/executed, false positives/negatives, average holding time, opportunity score, confidence, signal accuracy
- **Portfolio Analysis**: Portfolio return/risk, sector distribution, cash utilization, exposure, turnover, diversification ratio
- **Benchmarks**: BIST100 proxy, Sector Index, Equal Weight, Buy and Hold, Custom
- **Dataset Manager**: Symbol data generation, caching, market period detection, data access
- **Trade Simulator**: Entry simulation with commission/slippage, exit with stop loss/take profit/trailing stop/time exit, MFE/MAE tracking
- **Portfolio Simulator**: Multi-position management, equity curve construction, drawdown tracking, portfolio analysis
- **Benchmark Comparator**: Buy-and-hold benchmark, equal-weight benchmark, index proxy, strategy vs benchmark comparison
- **Report Generator**: Executive summary, trade list, performance report, risk report, benchmark comparison, full report — with drawdown analysis
- **Backtest Engine**: Full orchestration — signal generation (SMA/RSI/momentum/volume), trade simulation, portfolio simulation, benchmark comparison
- **Backtest Registry**: Singleton with strategy/calculator/factory registration
- **Backtest Cache**: MD5 TTL + LRU, hit/miss tracking
- **Engine Benchmark**: Warmup + timed execution, memory tracking, comparison mode
- **Backtest Validator**: Request validation (symbol, dates, capital, position size, stop loss, commission), result validation
- **26 Pydantic Schemas**: Request/response models for all endpoints
- **Service Layer**: run_backtest(), run_multiple(), compare(), get_result(), list_results(), get_history(), generate_report(), summary(), clear_cache(), cache_stats(), run_engine_benchmark(), health_check()
- **10 API Endpoints**: POST run, GET list, GET history/{symbol}, GET summary, POST compare, POST report, POST benchmark, GET cache/stats, POST cache/clear, GET health
- **Router**: Registered in app/main.py as backtest_router
- **179 tests** across types (43), datasets (12), trade_simulator (8), portfolio (6), performance (14), reports (9), registry (10), cache (13), benchmark (6), validator (9), schemas (14), engine (10), service (15), API (12)

## [1.4.0] - 2026-07-20

### Added

#### Enterprise Decision Engine Module (`modules/decision_engine/`)
- **Core Types**: 11 DecisionTypes (Strong Buy→Distribution Risk), 5 EntryTimings, 4 ExitActions, 13 DecisionDimensions, 5 InvestmentHorizons, 4 ConflictSeverities, 5 DecisionUrgencies, 6 ReportTypes, 12 DataSources, plus dataclasses (EngineOutput, DimensionScore, Conflict, DecisionBonus, DecisionPenalty, EntryGuidance, ExitGuidance, PortfolioImpact, HorizonRecommendation, RecommendationPackage, DecisionResult)
- **Decision Types**: Strong Buy (90-100), Buy (80-89), Early Accumulation (70-79), Accumulate (60-69), Watch (50-59), Wait For Confirmation (40-49), Neutral (30-39), Reduce (20-29), Take Profit (10-19), Avoid (5-9), Distribution Risk (0-4)
- **Decision Dimensions**: Financial Quality, Valuation, Growth, Technical Trend, Momentum, Smart Money, Pattern Quality, Risk, Sector Strength, Market Regime, Liquidity, Confidence, Historical Similarity
- **Entry Timing**: Immediate Entry, Wait Pullback, Wait Breakout, Scale In, No Entry — generated from decision type + momentum + risk
- **Exit Guidance**: Hold, Trailing Stop, Take Partial, Exit — with initial/secondary targets, risk stops, trailing stops, review periods
- **5 Investment Horizons**: Weekly, 1 Month, 3 Months, 6 Months, 12 Months — each with independent horizon-adjusted scores
- **Decision Pipeline**: EngineOutputCollector → OutputValidator → ConflictDetector → DecisionRuleEngine → ConfidenceCalculator → RecommendationGenerator → PackageBuilder
- **Conflict Detection**: 5 pairwise conflict rules (Confidence vs Trend, Financial vs Momentum, Pattern vs Smart Money, Technical vs Market Regime, Valuation vs Growth) + extreme spread detection
- **8 Bonus Factors**: Strong Across Dimensions, High Confidence Alignment, Smart Money Confirmation, Pattern-Volume Alignment, Sector Strength, Low Risk-High Reward, Market Regime Alignment, Early Opportunity Detected
- **8 Penalty Factors**: Critical Conflict, High Conflict, Low Confidence Mismatch, Weak Volume Confirmation, Adverse Market Regime, High Risk-Low Reward, Poor Liquidity, Low Historical Similarity
- **Decision Confidence**: Weighted combination of score coherency (30%), average confidence (35%), coverage (20%), minus conflict penalty (15%)
- **Portfolio Impact**: Position size suggestion, sector concentration, risk contribution, diversification effect, overlapping position detection
- **3 Decision Profiles**: Conservative (risk tolerance 30%), Balanced (50%), Aggressive (75%) — with independent dimension weights
- **Profile Manager**: Singleton with custom profile registration/deletion
- **Decision Registry**: Singleton with calculator/factory registration
- **Decision Cache**: MD5 TTL + LRU, hit/miss tracking
- **Decision Benchmark**: Warmup + timed execution, memory tracking, comparison mode
- **Decision Validator**: Score range, label consistency, confidence range, risk range, recommendation presence
- **22 Pydantic Schemas**: Request/response models for all endpoints
- **Service Layer**: generate_decision(), get_decision(), list_decisions(), get_top_decisions(), get_history(), generate_report(), clear_cache(), cache_stats(), run_benchmark(), health_check()
- **9 API Endpoints**: POST generate, GET list, GET top, GET details/{symbol}, GET history/{symbol}, POST report, POST benchmark, GET cache/stats, POST cache/clear, GET health
- **Router**: Registered in app/main.py as decision_router
- **226 tests** across types (53), collector (16), validator (6), conflict_detector (9), rule_engine (16), confidence_calc (7), recommendations (15), profiles (10), profile_manager (10), registry (11), cache (13), benchmark (8), schemas (13), pipeline (12), service (17), API (14)

## [1.3.0] - 2026-07-20

### Added

#### Elite Score Engine Module (`modules/elite_score_engine/`)
- **Core Types**: 7 EliteCategories (Avoid→Exceptional), 6 EliteLabels, 17 ScoringDimensions, 12 SectorTypes, 8 BonusFactors, 8 PenaltyFactors, 5 EliteTrends, 5 InvestmentHorizons, 5 MarketRegimes, 3 RankingPeriods, ScoreDirection, plus dataclasses (DimensionWeight, BonusRule, PenaltyRule, EliteWeightConfig, DimensionContribution, BonusApplied, PenaltyApplied, EliteScoreResult, EliteScoreHistoryEntry, EliteRankingEntry, EliteScoreTrend, EliteProfile, EliteCalculationRequest, BenchmarkResult)
- **Elite Categories**: 0-20 Avoid, 21-40 Weak, 41-60 Watch, 61-75 Good, 76-89 Strong, 90-95 Elite, 96-100 Exceptional Opportunity
- **Elite Labels**: Undervalued, High Conviction, Early Opportunity, Breakout Candidate, Watchlist, High Risk — auto-classified from score + bonuses + penalties
- **Weight Profiles**: Conservative (quality/risk focus), Balanced (even distribution), Aggressive (momentum/technical focus)
- **Investment Horizons**: Weekly (momentum 1.5x), 1 Month, 3 Months (neutral), 6 Months, 12 Months (financial 1.3x) — each with independent dimension multipliers
- **Market Regimes**: Bull (momentum +30%), Bear (risk +40%, momentum -30%), Sideways, High Volatility (liquidity +20%), Low Volatility
- **Sector Adaptation**: 12 sector-specific weight profiles (Banks, Holdings, Industrials, Technology, Energy, Retail, Transportation, Construction, Insurance, Real Estate, Mining, Other)
- **8 Bonus Factors**: Golden Cross, Early Breakout, Strong Earnings, Volume Explosion, Institutional Accumulation, Smart Money Confirmation, Positive Sector Rotation, Low Valuation
- **8 Penalty Factors**: Weak Liquidity, High Debt, Distribution, Late Trend, Overbought, Weak Earnings, Negative Divergence, Corporate Governance Warning
- **Elite Calculator**: Maps source engine scores → 17 dimensions, computes normalized/weighted contributions, applies bonus/penalty rules, classifies category and label
- **Trend Tracker**: Historical score tracking with per-symbol/per-horizon history, delta computation, trend classification (Improving/Stable/Declining/Volatile), max history with LRU eviction
- **Ranking Manager**: Daily/Weekly/Monthly rankings, sector rankings, category distribution, rank change tracking, trend computation, top-N queries, symbol rank lookup
- **Profile Manager**: 3 default profiles (Conservative/Balanced/Aggressive), custom profile creation/registration/deletion
- **Weight Manager**: Singleton with horizon+regime+sector combination caching, custom config support, weight validation and normalization
- **Elite Validator**: Input scores validation, dimension scores validation, config validation, result validation (category match, score range, confidence)
- **Elite Registry**: Singleton with calculator/factory registration, key normalization
- **Elite Cache**: MD5 TTL (3600s) + LRU (500 max), hit/miss tracking, expiration cleanup
- **Elite Benchmark**: Warmup + timed execution, memory tracking, comparison mode
- **17 Pydantic Schemas**: Request/response models for all endpoints
- **Service Layer**: calculate(), calculate_list(), get_details(), get_history(), get_trend(), update_ranking(), get_ranking(), get_top_n(), get_profiles(), get_weight_config(), validate(), cache_stats(), clear_cache(), run_benchmark()
- **13 API Endpoints**: POST calculate, POST list, GET top, GET details, GET history, GET ranking, GET profiles, GET weights, POST validate, GET cache/stats, POST cache/clear, POST benchmark
- **Router**: Registered in app/main.py as elite_score_router
- **280 tests** across types (53), profiles (18), horizon (11), regime (9), sector (9), weight_manager (16), calculators (50), profile_manager (10), ranking (12), validator (12), registry (11), cache (13), benchmark (7), schemas (21), service (18), API (15)

## [1.2.0] - 2026-07-20

### Added

#### Unified Scoring Engine Module (`modules/scoring_engine/`)
- **Core Types**: ScoreType (19 score types), WeightProfile (6 profiles), InvestmentHorizon (5 horizons), MarketRegime (5 regimes), ScoringMethod (6 methods), ScoreDirection (3), plus dataclasses (ScoreWeight, ScoreBreakdown, ScoreHistoryEntry, ScoreTrend, ScoreResult, WeightConfig, PenaltyRule, BonusRule, OptimizationResult, ScoringProfile, BenchmarkResult)
- **Weight Profiles**: Very Conservative, Conservative, Balanced, Growth, Aggressive, Custom — each with independent per-score-type weight allocations
- **Investment Horizons**: Weekly, 1 Month, 3 Months, 6 Months, 12 Months — with per-horizon weight multipliers (e.g., Weekly boosts momentum 1.4x, 12 Months boosts financial 1.3x)
- **Market Regimes**: Bull, Bear, Sideways, High Volatility, Low Volatility — automatic regime-based weight adjustments
- **16 Score Calculators**:
  - Financial: PE/ROE/D/E/Net Margin/Current Ratio analysis
  - Value: PE/PB/PEG undervaluation scoring
  - Growth: Earnings/revenue growth momentum
  - Quality: ROE/ROA/margin/liquidity quality metrics
  - Risk: Volatility/drawdown/beta/VaR (lower = better)
  - Liquidity: Volume ratio/relative volume
  - Technical: RSI/MACD/ADX oscillator analysis
  - Momentum: Price momentum/ROC/RSI momentum
  - Trend: SMA 50/200 crossover/price vs SMA
  - Volume: CMF/MFI/OBV volume flow analysis
  - Smart Money: OB/Breaker/FVG/BOS/CHoC detection count
  - Pattern: Classical/candlestick pattern scoring
  - Timing: RSI/Stochastic oversold/overbought timing
  - Sector Strength: Sector momentum/relative strength
  - Probability: Opportunity/confidence/historical success
  - Composite: Weighted average of sub-scores
- **Weight Manager**: Singleton with profile/horizon/regime combination caching, custom weight support, penalty/bonus rules, weight validation and normalization
- **Weight Optimizer**: Rule-based optimization with configurable iterations, historical data scoring, weight transfer optimization
- **Scoring Profiles Manager**: 5 default profiles (Very Conservative through Aggressive), custom profile creation/registration/deletion
- **Scoring Validator**: Metrics validation, weight validation, result validation, breakdown validation, config validation
- **Scoring Registry**: Singleton with calculator registration, key normalization
- **Scoring Cache**: MD5 TTL (3600s) + LRU (500 max), hit/miss tracking, expiration cleanup
- **Scoring Benchmark**: Warmup + timed execution, memory tracking, comparison mode
- **Score Breakdown**: Per-category raw/normalized/weighted/penalty/bonus/final scores with confidence and evidence count
- **Score History**: Historical score tracking with trend and delta
- **17 Pydantic Schemas**: Request/response models for all endpoints
- **Service Layer**: calculate(), get_list(), get_details(), get_history(), get_weights(), get_profiles(), optimize(), validate(), cache_stats(), clear_cache()
- **13 API Endpoints**: POST calculate, GET list, GET details, GET history, GET weights, GET profiles, POST profile, POST optimize, POST validate, GET cache/stats, POST cache/clear, POST benchmark
- **Router**: Registered in app/main.py as scoring_router
- **187 tests** across types (18), profiles (7), horizon (5), regime (5), weight_manager (14), calculators (37), optimizer (3), validator (14), profile_manager (7), registry (10), cache (11), benchmark (7), schemas (17), service (16), API (13)

## [1.1.0] - 2026-07-20

### Added

#### Explainability Engine Module (`modules/explainability_engine/`)
- **Core Types**: ExplanationType (11 types), ExplanationLevel (4 levels), Language (EN/TR), ExplanationCategory (12 categories), SignalDirection (3), ConflictType (4), SeverityLevel (5), ReportFormat (5), SourceEngine (12 engines), plus dataclasses (EvidenceObject, ExplanationSection, ConflictInfo, HistoricalContext, RiskSummary, ExplainabilityScore, ExplanationResult, ExplanationTemplate, ExplanationReport, LocalizedContent, BenchmarkResult)
- **Core Base**: BaseExplanationBuilder ABC with validation framework
- **Evidence Mapper**: ENGINE_KEY_MAP (40+ metric→engine mappings), METRIC_DESCRIPTIONS (30+ descriptions), map_metrics_to_evidence(), map_stage_results(), map_signals(), merge_evidence(), filter_by_engine/confidence/direction(), aggregate_by_engine()
- **Normalizer**: normalize_scores(), normalize_value(), normalize_01(), normalize_evidence(), compute_explainability_scores(), aggregate_direction(), compute_signal_strength(), detect_conflicts()
- **9 Explanation Builders**:
  - Fundamental: PE/PB/PEG valuation, ROE/ROA/net margin profitability, earnings/revenue growth, D/E/cr/dividend health
  - Technical: SMA 50/200, ADX, RSI, MACD, Golden/Death Cross detection
  - Volume: Volume analysis, CMF, MFI, OBV trend
  - Pattern: Classical/candlestick scores, detected pattern types
  - Smart Money: OB/Breaker/FVG/Sweep/BOS/CHoC/Discount/Mitigation detection
  - Opportunity: Stage mapping, score/confidence/return/window explanation
  - Risk: Volatility/drawdown/beta/VaR/debt/liquidity risk with RiskSummary generation
  - Similarity: Historical similarity, success rate, lessons learned
  - Conflict: Cross-engine conflicts, trend conflicts, indicator divergences
- **Orchestrator Builder**: build() for single type, build_comprehensive() for all types, executive summary + final conclusion generation
- **Templates**: 88 template definitions across 4 levels × 11 types × 2 languages
- **Localization**: EN+TR dictionaries (35+ keys each) with extensibility
- **Validator**: validate_result(), validate_section(), validate_evidence(), has_evidence_backing(), coverage_ratio()
- **Cache**: MD5 TTL (3600s) + LRU (500 max), get/set/invalidate/clear/stats/cleanup_expired
- **Registry**: Singleton with register/get/unregister, key normalization
- **Benchmark**: run() with warmup, run_comparison(), get_results(), get_summary()
- **Schemas**: 19 Pydantic v2 request/response models
- **Service Layer**: generate(), generate_comprehensive(), get_summary(), get_history(), validate(), cache_stats(), clear_cache(), run_benchmark(), get_templates(), get_localization_keys()
- **API Endpoints**: 10 endpoints (POST generate, POST comprehensive, GET summary, GET history, POST validate, GET cache/stats, POST cache/clear, POST benchmark, GET templates, GET localization/keys)
- **Router**: Registered in app/main.py as explainability_router
- 231 tests across types (23), evidence_mapper (19), normalizer (19), builders (40), templates (7), localization (8), validator (19), cache (11), registry (12), schemas (19), service (16), API (11), benchmark (6)

## [1.0.0] - 2026-07-20

### Added

#### Early Opportunity Engine Module (`modules/early_opportunity_engine/`)
- **Core Types**: OpportunityStage (8 stages: STAGE_0_IGNORE through STAGE_7_LATE_OPPORTUNITY), OpportunityRating (6 levels), MarketRegimeType (5 regimes), SignalType, AlertType, RedFlagType, ExpectedWindow, AnalysisCategory, plus dataclasses (AnalysisSignal, StageResult, RiskAssessment, SimilarityAnalysis, EvidenceItem, EvidencePackage, EarlyWarning, RedFlag, OpportunityScore, ExpectedReturn, OpportunityResult, RankedOpportunity, OpportunityMetadata, BenchmarkResult)
- **7 Analysis Stages**:
  - Financial: PE (deep value/undervalued), PB, ROE, D/E, earnings growth, dividend yield, PEG, current ratio, net margin
  - Technical: RSI (oversold/overbought), MACD (bullish cross/positive), ADX, SMA 200/50/200 crossover, momentum, stochastic, Bollinger
  - Volume: volume spike, relative volume, OBV trend, CMF (accumulation/distribution), MFI (oversold/overbought), VWAP, NVI
  - Smart Money: order block, breaker block, FVG, liquidity sweep, BOS, CHoC, discount zone, mitigation block, equal lows
  - Pattern: classical/candlestick score, double bottom/top, cup & handle, bull flag, ascending triangle, hammer, engulfing, morning star
  - Risk: drawdown, volatility, Sharpe, Sortino, beta, VaR, debt, earnings, weak volume, sector risk with red flag detection
  - Similarity: historical pattern matching, success rate, value/growth-momentum profile matching
- **Scoring Engine**: Weighted combination of all stages with market regime multiplier, stage/rating/window determination, confidence calculation, expected return estimation
- **Ranking Engine**: Score-based ranking, filtering by min score/stage/confidence, aggregation with rating distribution
- **Pipeline**: 7-stage analysis pipeline orchestrating all stages with automatic regime detection, evidence collection, red flag detection, early warning generation, explanation building
- **Infrastructure**: Cache (MD5 TTL + LRU), Validator, Registry (singleton with key normalization), 16 Pydantic schemas, Service layer, 8 API endpoints (GET top, POST analyze, POST batch, GET history, POST validate, GET cache stats, POST cache clear, GET summary)
- 212 tests across types (15), stages (44), scorer (19), ranker (10), pipeline (14), validators (15), cache (11), registry (11), schemas (15), service (12), API (8), types dataclasses (8)

## [0.9.0] - 2026-07-19

### Added

#### Strategy Engine Module (`modules/strategy_engine/`)
- **Rule Engine**: Full rule evaluation framework with AND, OR, XOR operators and unlimited nested group nesting
- **9 Rule Types**: Financial, Technical, Volume, Pattern, Smart Money, Risk, Market, Time, Custom
- **12 Financial Rules**: PE, PB, ROE, ROA, Debt/Equity, Dividend Yield, Earnings Growth, Revenue Growth, Current Ratio, Net Margin, P/S, PEG, Free Cash Flow
- **15 Technical Rules**: RSI (overbought/oversold), MACD (bullish/above zero), SMA crossover, Bollinger bounce, ATR breakout, ADX trend, Stochastic, CCI, Williams %R, Momentum, Golden Cross
- **9 Volume Rules**: Volume Spike, OBV Trend, CMF (bullish/bearish), MFI, Relative Volume, VWAP Support, NVI Rising
- **10 Pattern Rules**: Classical, Candlestick Bullish/Bearish, Double Bottom/Top, Cup & Handle, Ascending Triangle, Bull Flag, Hammer, Engulfing, Morning Star
- **9 Smart Money Rules**: Order Block, Breaker Block, Fair Value Gap, Liquidity Sweep, BOS Bullish, CHoC Bullish, Discount Zone, Mitigation Block, Equal Lows Sweep
- **6 Risk Rules**: Max Drawdown, Volatility, Sharpe Ratio, Beta Range, VaR, Sortino Ratio
- **7 Market Rules**: Sector Outperformance, Market Cap Above/Below, SMA Position, Relative Strength, Average Volume
- **5 Time Rules**: Trading Hours, Min/Max Holding Days, Month-End Avoidance, Not Weekend
- **Custom Rules**: `metric_above`, `metric_below`, `metric_between`, `metric_cross_above`, `compound`, `from_dict`
- **Strategy Executor**: Executes rule groups, calculates strategy/opportunity/confidence/risk scores, generates signals
- **Signal Generator**: Signal aggregation, stock ranking, filtering by signal/confidence/risk
- **Strategy Builder**: Fluent API for programmatic strategy construction
- **11 Built-in Strategy Templates**: Early Opportunity, Value Investing, Growth Investing, Momentum Investing, Breakout, Swing Trading, Trend Following, Smart Money, Dividend Growth, Low Risk, High Conviction
- **Custom Strategy Support**: Create, update, delete unlimited custom strategies
- **Strategy Validation**: Definition validation (name, confidence range, rule structure, condition completeness)
- **Result Caching**: MD5-based TTL cache with strategy-name-aware invalidation and LRU eviction
- **Strategy Registry**: Singleton registry with normalized key lookup, built-in template auto-registration
- **Pydantic Schemas**: 20 request/response models (StrategyResultSchema, RunStrategyRequest, CreateStrategyRequest, etc.)
- **Service Layer**: `StrategyService` orchestrating registry + executor + cache + validation
- **9 API Endpoints**: list, templates, run, create, update, delete, validate, history, benchmark

### Changed
- Registered strategy router in `app/main.py` under `API_V1_PREFIX`
- Total project tests: 1734 (1524 existing + 210 strategy engine)

### Tests
- **210 Tests**: Types (17), Rules (40), Executor (18), Signals (10), Builders (13), Templates (18), Validators (16), Cache (11), Registry (11), Schemas (20), Service (22), API (14)

## [0.8.0] - 2026-07-19

### Added

#### Pattern Recognition Engine Module (`modules/pattern_engine/`)
- **18 Classical Pattern Plugins**: Cup & Handle, Double Bottom/Top, Triple Bottom/Top, Ascending/Descending/Symmetrical Triangle, Bull/Bear Flag, Pennant, Rectangle, Channel Up/Down, Falling/Rising Wedge, Diamond, Megaphone
- **18 Candlestick Pattern Plugins**: Hammer, Inverted Hammer, Doji, Dragonfly/Gravestone Doji, Morning/Evening Star, Bullish/Bearish Engulfing, Harami, Piercing Pattern, Dark Cloud Cover, Three White Soldiers/Black Crows, Shooting Star, Hanging Man, Tweezer Top/Bottom
- **13 Smart Money Concept Plugins**: Break of Structure (BOS), Change of Character (CHoC), Order Block, Breaker Block, Mitigation Block, Fair Value Gap (FVG), Liquidity Grab, Liquidity Sweep, Equal Highs, Equal Lows, Premium Zone, Discount Zone, Inducement
- **10 Wyckoff Pattern Plugins**: Accumulation, Distribution, Spring, Upthrust, Automatic Rally, Secondary Test, Sign of Strength, Sign of Weakness, Last Point of Support, Last Point of Supply
- **1 Elliott Wave Stub**: Feature-disabled by default (`enable_elliott=True`), basic range-based stub with warnings
- **Analysis Tools**: SwingDetector, SupportResistance, TrendLineCalculator, BodyCalculator (shared across all pattern categories)
- **Pattern Registry**: Central plugin registration with category filtering, detect-all, custom plugin support
- **Pattern Cache**: MD5-based TTL cache with pattern-name-aware invalidation, max-size LRU eviction
- **Pattern Validator**: Price data validation (OHLC consistency, negative volume), category/param validation
- **Similarity Engine**: Cosine similarity for pattern comparison, top-k matching, direction-aware feature extraction
- **Pydantic Schemas**: 14 request/response models (PatternDetectionRequest, PatternAnalysisResponse, ClassicalDetectionRequest, etc.)
- **Service Layer**: `PatternService` orchestrating registry + cache + similarity + validation
- **9 API Endpoints**: detect, classical, candlestick, smc, wyckoff, list, plugin/{name}, validate, history

### Changed
- Registered pattern router in `app/main.py` under `API_V1_PREFIX`
- Total project tests: 1524 (128 prices + 188 financial + 182 MA + 139 momentum + 180 trend + 233 volume + 336 patterns)
- Router registered in `app/main.py` as `pattern_router`

### Tests
- **336 Tests**: Classical (42), Candlestick (44), SMC (39), Wyckoff (30), Elliott (11), Registry (14), Cache (11), Validators (16), Similarity (8), Service (16), API (16)

## [0.7.0] - 2026-07-19

### Added

#### Volume & Smart Money Engine Module (`modules/volume_engine/`)
- **12 Volume Indicator Plugins**: OBV, CMF, MFI, VWAP, RVOL, ADL, Chaikin Oscillator, Volume Oscillator, Ease of Movement, Force Index, Negative Volume Index (NVI), Positive Volume Index (PVI)
- **Core Engine**: `VolumeEngine` with plugin registry, single/multi-indicator calculation, smart money detection, liquidity analysis, institutional scoring, cache integration
- **Plugin Registry**: Auto-discovers and registers all 12 plugins via `get_registry()`
- **Volume Calculator**: SMA, EMA, Wilder smoothing, true range, money flow, positive/negative flow, VWAP, relative volume, distribution, volume nodes, full volume analysis
- **Smart Money Detector**: 8 pattern types - institutional accumulation/distribution, hidden buying/selling, silent accumulation, volume spike, absorption
- **Liquidity Engine**: Liquidity, turnover, spread, trade activity, market participation scoring
- **Signal Engine**: OBV/CMF/MFI/VWAP/RVOL/generic volume signal generators, aggregate signal combination
- **Scoring Engine**: 6-component scoring - volume score, liquidity score, participation score, institutional score, confidence, composite, institutional composite
- **Caching**: MD5-based TTL cache with max-size LRU eviction and statistics tracking
- **Validators**: Price/period validation, NaN handling, missing data fill, division safety, clamping, benchmarking
- **Pydantic Schemas**: 13 request/response models (PriceBar, IndicatorResult, Signal, SmartMoney, Liquidity, InstitutionalScore, VolumeScore, etc.)
- **Service Layer**: `VolumeService` orchestrating engine + cache + signals + smart money + liquidity + scoring
- **11 API Endpoints**: indicators, calculate, obv, cmf, mfi, vwap, rvol, liquidity, smart-money, signals, cache-stats, benchmark

### Changed
- Registered volume router in `app/main.py` under `API_V1_PREFIX`
- Total project tests: 1188 (128 prices + 188 financial + 182 MA + 139 momentum + 180 trend + 233 volume)

### Tests
- **233 Tests**: Engine (25), Plugins (78), Calculators (14), Signals (21), Scoring (9), Smart Money (4), Liquidity (3), Cache (6), Validators (12), Schemas (13), Service (18), API (30)

## [0.6.0] - 2026-07-19

### Added

#### Trend Engine Module (`modules/trend_engine/`)
- **8 Trend Indicator Plugins**: SuperTrend, Ichimoku Cloud, Donchian Channel, Parabolic SAR, Bollinger Bands, Keltner Channel, Moving Average Envelope, Linear Regression Trend
- **Core Engine**: `TrendEngine` with plugin registry, single/multi-indicator calculation, trend analysis, cache integration
- **Plugin Registry**: Auto-discovers and registers all 8 plugins via `get_registry()`
- **Trend Calculator**: SMA, EMA, Wilder smoothing, ATR, true range, linear regression, slope/angle
- **Breakout Calculator**: Support/resistance detection, breakout/breakdown identification, retest detection
- **Pullback Calculator**: Healthy/weak/deep pullback classification, trend resumption analysis
- **Trend Signal Engine**: Indicator-specific signal generators (SuperTrend flip, Ichimoku cloud, Bollinger bands, Donchian, Keltner, MA Envelope, Linear Regression) + aggregate
- **Breakout Engine**: Resistance breakout, support breakdown, fake/false detection with confirmation
- **Pullback Engine**: Pullback classification with trend resumption detection
- **Trend Scoring Engine**: 5-component composite score (trend, breakout, continuation, reversal, confidence)
- **Trend Analysis**: Primary/secondary/micro trend, phase lifecycle (emerging→strengthening→mature→exhausting→reversing), strength, age, stability, exhaustion, continuation, reversal probability
- **Caching**: MD5-based TTL cache with max-size LRU eviction and statistics tracking
- **Validators**: Price/period validation, NaN handling, missing data fill, division safety, clamping, benchmarking
- **Pydantic Schemas**: 12 request/response models (PriceBar, IndicatorResult, Signal, TrendResult, BreakoutResult, PullbackResult, TrendScore, etc.)
- **Service Layer**: `TrendService` orchestrating engine + cache + signals + breakout/pullback/scoring
- **10 API Endpoints**: indicators, calculate, supertrend, ichimoku, bollinger, donchian, parabolic, signals, breakout, cache-stats, benchmark

### Changed
- Registered trend router in `app/main.py` under `API_V1_PREFIX`
- Total project tests: 955 (128 prices + 188 financial + 182 MA + 139 momentum + 180 trend)

### Tests
- **180 Tests**: Engine (20), Plugins (40), Calculators (24), Signals (33), Cache (8), Schemas (10), Service (8), API (17), Regression (20)

## [0.5.0] - 2026-07-19

### Added

#### Momentum Engine Module (`modules/momentum_engine/`)
- **10 Momentum Indicator Plugins**: RSI, Stochastic RSI, MACD, ADX, CCI, ROC, Momentum, Williams %R, TSI, Awesome Oscillator
- **Core Engine**: `MomentumEngine` with plugin registry, single/multi-indicator calculation, cache integration
- **Plugin Registry**: Auto-discovers and registers all 10 plugins via `get_registry()`
- **Smoothing Calculators**: EMA, SMA, WMA, Wilder smoothing
- **Slope Calculator**: First/second derivatives, angle in degrees
- **Divergence Calculator**: Swing high/low detection, 4 divergence types (regular bull/bear, hidden bull/bear)
- **Signal Engine**: RSI/StochRSI/MACD/ADX/generic signal generators, aggregate signal combination
- **Divergence Engine**: Real-time divergence detection with latest divergence retrieval
- **Scoring Engine**: 5-component composite score (momentum, trend, signal, strength, confidence)
- **Caching**: MD5-based TTL cache with max-size LRU eviction and statistics tracking
- **Validators**: Price/period validation, NaN handling, missing data fill, division safety, clamping, benchmarking
- **Pydantic Schemas**: 11 request/response models (PriceBar, IndicatorResult, Signal, Divergence, MomentumScore, etc.)
- **Service Layer**: `MomentumService` orchestrating engine + cache + signals
- **10 API Endpoints**: indicators, calculate, rsi, stoch-rsi, macd, adx, signals, divergence, cache-stats, benchmark

### Changed
- Registered momentum router in `app/main.py` under `API_V1_PREFIX`
- Total project tests: 775 (prices + financial + MA + momentum)

### Tests
- **139 Tests**: Engine (14), Plugins (28), Calculators (15), Signals (17), Cache (8), Schemas (5), Service (7), API (18), Regression (27)

## [0.4.0] - 2026-07-19

### Added

#### Moving Average Engine Module (`modules/moving_average/`)
- **6 MA Plugins**: SMA (Simple), EMA (Exponential), WMA (Weighted), HMA (Hull), SMMA (Smoothed), VWMA (Volume-Weighted)
- **Core Engine**: `MovingAverageEngine` with plugin registry, single/multi-period calculation, crossover detection
- **Slope Calculator**: First/second derivatives, angle in degrees, acceleration detection
- **Distance Calculator**: Price-to-MA distance (% and absolute), MA-to-MA distance
- **Cross Detector**: Golden/death cross detection with strength (strong/moderate/weak/false), confirmation, false-cross filtering
- **Proximity Engine**: Crossover estimation (bars to cross) and probability scoring
- **Smart Signals**: Early bullish/bearish, trend exhaustion, pullback opportunity, trend continuation
- **Trend Analyzer**: Direction (uptrend/downtrend/sideways), strength, age, stability scoring
- **Score Engine**: 5-component composite score — trend (30%), momentum (25%), cross (25%), acceleration (20%)
- **Timeframe Manager**: 7 timeframes (5m monthly), higher/lower hierarchy, multi-timeframe alignment score
- **Validators**: Period/price validation, missing data interpolation (forward/backward fill), VWMA zero-volume detection, calculation benchmarking
- **Pydantic Schemas**: 15 request/response models with field constraints
- **Service Layer**: `MAService` orchestrating engine + validators + timeframes
- **6 API Endpoints**: types, calculate, calculate-multiple, crossovers, timeframes, validate
- **182 Tests**: Plugins (34), Engine (18), Calculators (16), Signals (15), Trend (10), Scoring (7), Timeframes (8), Validators (16), Schemas (15), Service (16), API (19), Crossover (2)

### Changed
- Registered MA router in `app/main.py`
- Total project tests: 498 (128 prices + 188 financial + 182 moving_average)

## [0.3.0] - 2026-07-19

### Added

#### Financial Engine Module (`modules/financial/`)
- **SQLAlchemy Models**: FinancialStatement (47 fields), FinancialRatio (72 fields), FinancialDividend, FinancialCapitalEvent, FinancialQualityScore, FinancialCalculationLog
- **7 Calculators**: Ratio, Margin, Growth, Profitability, Debt, Efficiency, Quality
- **Quality Scoring**: Piotroski F Score (0-9), Altman Z Score, Beneish M Score, Financial Strength, Profitability, Growth, Dividend Quality composite scores (0-100)
- **Valuation Ratios**: P/E, P/B, EV/EBITDA, EV/Sales, PEG, Price/Sales, Enterprise Value
- **Margin Analysis**: Gross, Operating, EBITDA, Net, FCF margins
- **Growth Analysis**: Quarterly, Yearly, CAGR 3Y/5Y for Revenue, Profit, EPS, Book Value, EBITDA, FCF
- **TTM Calculations**: Trailing twelve months for Revenue, Net Profit, EPS, EBITDA, FCF
- **Debt Analysis**: D/E, D/A, Net Debt/EBITDA, Interest Coverage, Current/Quick/Cash Ratios
- **Efficiency Metrics**: Asset/Inventory/Receivable Turnover, Cash Conversion Cycle
- **Validators**: Period format, report type, financial consistency (accounting equation), duplicate detection, batch validation
- **Repositories**: Statement CRUD, Ratio CRUD, Dividend CRUD, Capital Event CRUD, Quality Score CRUD, Calculation Log
- **Services**: CalculationService (orchestrates 7 calculators), FinancialService (main orchestration + provider + caching)
- **Providers**: MockFinancialProvider (random realistic data), KapFinancialProvider (stub with mock fallback)
- **8 API Endpoints**: latest, history, ratios, growth, dividends, quality, update, update-all
- **188 Tests**: Validators (30), Calculators (60), Repositories (30), API (22), Service integration

#### Price Engine Fixes (Sprint 1 completion)
- Fixed `get_latest_price`, `get_weekly_prices`, `get_monthly_prices` returning ValueError instead of None for missing companies
- Fixed weekly/monthly aggregation missing `stock_code` field on synthetic bars
- Fixed API tests: shared DB isolation with `StaticPool`, separate `empty_company` fixture for empty-state tests
- All 128 price engine tests now passing

### Changed
- Registered 6 new financial tables in `app/models/__init__.py`
- Added financial router to `app/main.py`

### Database
- 6 new tables: `financial_statements`, `fin_engine_ratios`, `financial_dividends`, `financial_capital_events`, `financial_quality_scores`, `financial_calculation_logs`
- Total project tables: 28

## [0.2.0] - 2026-07-18

### Added
- Price Engine Module (`modules/prices/`)
- Plugin System Module (`modules/plugin_system/`)
- Data Engine Module (`modules/data_engine/`)

## [0.1.0] - 2026-07-17

### Added
- Initial project setup
- FastAPI application
- SQLAlchemy ORM with 20+ models
- Company, DailyPrice, FinancialReport, FinancialRatio models
