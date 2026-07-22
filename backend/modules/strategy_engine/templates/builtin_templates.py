from __future__ import annotations

from modules.strategy_engine.core.types import (
    StrategyDefinition,
    StrategyType,
    StrategyStatus,
    Timeframe,
    RuleGroup,
    RuleOperator,
)
from modules.strategy_engine.rules.financial_rules import FinancialRules
from modules.strategy_engine.rules.technical_rules import TechnicalRules
from modules.strategy_engine.rules.volume_rules import VolumeRules
from modules.strategy_engine.rules.pattern_rules import PatternRules
from modules.strategy_engine.rules.smc_rules import SmartMoneyRules
from modules.strategy_engine.rules.risk_rules import RiskRules
from modules.strategy_engine.rules.market_rules import MarketRules
from modules.strategy_engine.rules.time_rules import TimeRules


class BuiltinTemplates:

    @staticmethod
    def early_opportunity() -> StrategyDefinition:
        return StrategyDefinition(
            name="Early Opportunity",
            strategy_type=StrategyType.EARLY_OPPORTUNITY,
            description="Detects undervalued stocks with momentum signals and volume confirmation before market pricing adjusts",
            version="1.0.0",
            author="BIST Elite AI",
            min_confidence=0.4,
            max_results=30,
            timeframes=[Timeframe.DAILY, Timeframe.WEEKLY],
            tags=["early", "opportunity", "value", "momentum"],
            rule_groups=[
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        FinancialRules.pe_ratio(max_value=20.0, weight=1.5),
                        FinancialRules.earnings_growth(min_value=10.0, weight=1.5),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.OR,
                    rules=[
                        TechnicalRules.rsi_oversold(threshold=35.0, weight=1.0),
                        TechnicalRules.macd_above_zero(weight=1.0),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        VolumeRules.volume_spike(multiplier=1.5, weight=1.2),
                        RiskRules.max_drawdown(max_pct=25.0, weight=1.0),
                    ],
                ),
            ],
        )

    @staticmethod
    def value_investing() -> StrategyDefinition:
        return StrategyDefinition(
            name="Value Investing",
            strategy_type=StrategyType.VALUE,
            description="Classic value investing strategy targeting fundamentally undervalued companies with strong balance sheets",
            version="1.0.0",
            author="BIST Elite AI",
            min_confidence=0.5,
            max_results=25,
            timeframes=[Timeframe.WEEKLY, Timeframe.MONTHLY],
            tags=["value", "fundamental", "long-term"],
            rule_groups=[
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        FinancialRules.pe_ratio(max_value=15.0, weight=2.0),
                        FinancialRules.pb_ratio(max_value=1.5, weight=1.5),
                        FinancialRules.roe(min_value=12.0, weight=1.5),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        FinancialRules.debt_to_equity(max_value=1.0, weight=1.0),
                        FinancialRules.current_ratio(min_value=1.5, weight=1.0),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        FinancialRules.dividend_yield(min_value=2.0, weight=1.0),
                        RiskRules.max_drawdown(max_pct=30.0, weight=1.0),
                    ],
                ),
            ],
        )

    @staticmethod
    def growth_investing() -> StrategyDefinition:
        return StrategyDefinition(
            name="Growth Investing",
            strategy_type=StrategyType.GROWTH,
            description="Targets high-growth companies with strong revenue and earnings momentum",
            version="1.0.0",
            author="BIST Elite AI",
            min_confidence=0.5,
            max_results=25,
            timeframes=[Timeframe.DAILY, Timeframe.WEEKLY],
            tags=["growth", "momentum", "earnings"],
            rule_groups=[
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        FinancialRules.earnings_growth(min_value=20.0, weight=2.0),
                        FinancialRules.revenue_growth(min_value=15.0, weight=1.5),
                        FinancialRules.peg_ratio(max_value=1.5, weight=1.0),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        TechnicalRules.momentum_positive(weight=1.0),
                        TechnicalRules.adx_strong_trend(threshold=20.0, weight=1.0),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        MarketRules.relative_strength(min_rs=1.0, weight=1.5),
                        VolumeRules.relative_volume(min_ratio=1.2, weight=1.0),
                    ],
                ),
            ],
        )

    @staticmethod
    def momentum_investing() -> StrategyDefinition:
        return StrategyDefinition(
            name="Momentum Investing",
            strategy_type=StrategyType.MOMENTUM,
            description="Rides strong price momentum with trend confirmation and volume backing",
            version="1.0.0",
            author="BIST Elite AI",
            min_confidence=0.5,
            max_results=30,
            timeframes=[Timeframe.DAILY, Timeframe.WEEKLY],
            tags=["momentum", "trend", "technical"],
            rule_groups=[
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        TechnicalRules.momentum_positive(weight=2.0),
                        TechnicalRules.adx_strong_trend(threshold=25.0, weight=1.5),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        TechnicalRules.macd_above_zero(weight=1.5),
                        TechnicalRules.rsi_oversold(threshold=70.0, weight=1.0),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        MarketRules.above_200_sma(weight=1.5),
                        VolumeRules.volume_spike(multiplier=1.5, weight=1.0),
                    ],
                ),
            ],
        )

    @staticmethod
    def breakout() -> StrategyDefinition:
        return StrategyDefinition(
            name="Breakout",
            strategy_type=StrategyType.BREAKOUT,
            description="Identifies breakout opportunities from consolidation patterns with volume confirmation",
            version="1.0.0",
            author="BIST Elite AI",
            min_confidence=0.5,
            max_results=20,
            timeframes=[Timeframe.DAILY],
            tags=["breakout", "technical", "volume"],
            rule_groups=[
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        PatternRules.classical_pattern_detected(min_score=0.5, weight=1.5),
                        VolumeRules.volume_spike(multiplier=2.0, weight=2.0),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        TechnicalRules.adx_strong_trend(threshold=20.0, weight=1.0),
                        TechnicalRules.bollinger_lower_bounce(weight=1.0),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        RiskRules.max_drawdown(max_pct=15.0, weight=1.0),
                        RiskRules.volatility(max_vol=35.0, weight=1.0),
                    ],
                ),
            ],
        )

    @staticmethod
    def swing_trading() -> StrategyDefinition:
        return StrategyDefinition(
            name="Swing Trading",
            strategy_type=StrategyType.SWING,
            description="Short-term swing trades based on technical reversals and support/resistance levels",
            version="1.0.0",
            author="BIST Elite AI",
            min_confidence=0.5,
            max_results=25,
            timeframes=[Timeframe.DAILY],
            tags=["swing", "technical", "short-term"],
            rule_groups=[
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        TechnicalRules.rsi_oversold(threshold=30.0, weight=2.0),
                        PatternRules.candlestick_bullish(min_score=0.5, weight=1.5),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        TechnicalRules.bollinger_lower_bounce(weight=1.5),
                        VolumeRules.volume_spike(multiplier=1.3, weight=1.0),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        RiskRules.max_drawdown(max_pct=10.0, weight=1.0),
                        TimeRules.minimum_holding_days(min_days=3, weight=1.0),
                    ],
                ),
            ],
        )

    @staticmethod
    def trend_following() -> StrategyDefinition:
        return StrategyDefinition(
            name="Trend Following",
            strategy_type=StrategyType.TREND_FOLLOWING,
            description="Follows established trends with moving average confirmations and trend strength filters",
            version="1.0.0",
            author="BIST Elite AI",
            min_confidence=0.5,
            max_results=25,
            timeframes=[Timeframe.DAILY, Timeframe.WEEKLY],
            tags=["trend", "technical", "following"],
            rule_groups=[
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        TechnicalRules.golden_cross(weight=2.0),
                        MarketRules.above_200_sma(weight=1.5),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        TechnicalRules.adx_strong_trend(threshold=25.0, weight=1.5),
                        TechnicalRules.momentum_positive(weight=1.0),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        RiskRules.volatility(max_vol=30.0, weight=1.0),
                        MarketRules.above_50_sma(weight=1.0),
                    ],
                ),
            ],
        )

    @staticmethod
    def smart_money() -> StrategyDefinition:
        return StrategyDefinition(
            name="Smart Money",
            strategy_type=StrategyType.SMART_MONEY,
            description="Follows institutional order flow using Smart Money Concepts including order blocks and liquidity zones",
            version="1.0.0",
            author="BIST Elite AI",
            min_confidence=0.5,
            max_results=20,
            timeframes=[Timeframe.H4, Timeframe.DAILY],
            tags=["smc", "smart-money", "institutional"],
            rule_groups=[
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        SmartMoneyRules.order_block_detected(weight=2.0),
                        SmartMoneyRules.break_of_structure_bullish(weight=1.5),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.OR,
                    rules=[
                        SmartMoneyRules.fair_value_gap(weight=1.0),
                        SmartMoneyRules.change_of_character_bullish(weight=1.5),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        SmartMoneyRules.in_discount_zone(weight=1.0),
                        VolumeRules.volume_spike(multiplier=1.5, weight=1.0),
                    ],
                ),
            ],
        )

    @staticmethod
    def dividend_growth() -> StrategyDefinition:
        return StrategyDefinition(
            name="Dividend Growth",
            strategy_type=StrategyType.DIVIDEND_GROWTH,
            description="Targets companies with consistent and growing dividend payments backed by strong fundamentals",
            version="1.0.0",
            author="BIST Elite AI",
            min_confidence=0.6,
            max_results=20,
            timeframes=[Timeframe.MONTHLY],
            tags=["dividend", "income", "value", "long-term"],
            rule_groups=[
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        FinancialRules.dividend_yield(min_value=3.0, weight=2.0),
                        FinancialRules.earnings_growth(min_value=5.0, weight=1.0),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        FinancialRules.debt_to_equity(max_value=0.8, weight=1.5),
                        FinancialRules.current_ratio(min_value=1.5, weight=1.0),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        RiskRules.max_drawdown(max_pct=25.0, weight=1.0),
                        RiskRules.volatility(max_vol=25.0, weight=1.0),
                        RiskRules.sharpe_ratio(min_sharpe=0.8, weight=1.0),
                    ],
                ),
            ],
        )

    @staticmethod
    def low_risk() -> StrategyDefinition:
        return StrategyDefinition(
            name="Low Risk",
            strategy_type=StrategyType.LOW_RISK,
            description="Conservative strategy prioritizing capital preservation with strict risk controls",
            version="1.0.0",
            author="BIST Elite AI",
            min_confidence=0.6,
            max_results=15,
            timeframes=[Timeframe.WEEKLY, Timeframe.MONTHLY],
            tags=["low-risk", "conservative", "capital-preservation"],
            rule_groups=[
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        RiskRules.max_drawdown(max_pct=15.0, weight=2.0),
                        RiskRules.volatility(max_vol=20.0, weight=2.0),
                        RiskRules.sharpe_ratio(min_sharpe=1.0, weight=1.5),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        FinancialRules.debt_to_equity(max_value=0.5, weight=1.5),
                        FinancialRules.current_ratio(min_value=2.0, weight=1.0),
                        FinancialRules.net_margin(min_value=10.0, weight=1.0),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        MarketRules.above_200_sma(weight=1.0),
                        MarketRules.average_volume(min_volume=500000, weight=1.0),
                    ],
                ),
            ],
        )

    @staticmethod
    def high_conviction() -> StrategyDefinition:
        return StrategyDefinition(
            name="High Conviction",
            strategy_type=StrategyType.HIGH_CONVICTION,
            description="Requires strong alignment across fundamentals, technicals, volume, and patterns for highest-conviction signals",
            version="1.0.0",
            author="BIST Elite AI",
            min_confidence=0.7,
            max_results=10,
            timeframes=[Timeframe.DAILY, Timeframe.WEEKLY],
            tags=["high-conviction", "multi-factor", "selective"],
            rule_groups=[
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        FinancialRules.pe_ratio(max_value=15.0, weight=1.5),
                        FinancialRules.roe(min_value=15.0, weight=1.5),
                        FinancialRules.earnings_growth(min_value=15.0, weight=1.5),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        TechnicalRules.momentum_positive(weight=1.5),
                        TechnicalRules.adx_strong_trend(threshold=25.0, weight=1.5),
                        TechnicalRules.macd_above_zero(weight=1.0),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        VolumeRules.volume_spike(multiplier=1.5, weight=1.5),
                        PatternRules.classical_pattern_detected(min_score=0.6, weight=1.5),
                    ],
                ),
                RuleGroup(
                    operator=RuleOperator.AND,
                    rules=[
                        RiskRules.sharpe_ratio(min_sharpe=1.0, weight=1.5),
                        RiskRules.max_drawdown(max_pct=20.0, weight=1.0),
                    ],
                ),
            ],
        )

    @classmethod
    def get_all(cls) -> dict[str, StrategyDefinition]:
        return {
            "early_opportunity": cls.early_opportunity(),
            "value_investing": cls.value_investing(),
            "growth_investing": cls.growth_investing(),
            "momentum_investing": cls.momentum_investing(),
            "breakout": cls.breakout(),
            "swing_trading": cls.swing_trading(),
            "trend_following": cls.trend_following(),
            "smart_money": cls.smart_money(),
            "dividend_growth": cls.dividend_growth(),
            "low_risk": cls.low_risk(),
            "high_conviction": cls.high_conviction(),
        }

    @classmethod
    def get_template(cls, name: str) -> StrategyDefinition | None:
        templates = cls.get_all()
        return templates.get(name.lower().replace(" ", "_").replace("-", "_"))
