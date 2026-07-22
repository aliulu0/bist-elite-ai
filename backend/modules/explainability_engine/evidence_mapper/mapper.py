from __future__ import annotations

import time

from modules.explainability_engine.core.types import (
    EvidenceObject,
    SignalDirection,
    SourceEngine,
)


class EvidenceMapper:

    ENGINE_KEY_MAP = {
        "pe_ratio": SourceEngine.FINANCIAL,
        "pb_ratio": SourceEngine.FINANCIAL,
        "roe": SourceEngine.FINANCIAL,
        "roa": SourceEngine.FINANCIAL,
        "debt_to_equity": SourceEngine.FINANCIAL,
        "dividend_yield": SourceEngine.FINANCIAL,
        "earnings_growth": SourceEngine.FINANCIAL,
        "revenue_growth": SourceEngine.FINANCIAL,
        "peg_ratio": SourceEngine.FINANCIAL,
        "current_ratio": SourceEngine.FINANCIAL,
        "net_margin": SourceEngine.FINANCIAL,
        "rsi": SourceEngine.INDICATOR,
        "macd": SourceEngine.INDICATOR,
        "macd_signal": SourceEngine.INDICATOR,
        "adx": SourceEngine.INDICATOR,
        "sma_20": SourceEngine.INDICATOR,
        "sma_50": SourceEngine.INDICATOR,
        "sma_200": SourceEngine.INDICATOR,
        "ema_12": SourceEngine.INDICATOR,
        "ema_26": SourceEngine.INDICATOR,
        "stoch_k": SourceEngine.INDICATOR,
        "stoch_d": SourceEngine.INDICATOR,
        "ichimoku": SourceEngine.INDICATOR,
        "supertrend": SourceEngine.INDICATOR,
        "vwap": SourceEngine.INDICATOR,
        "momentum": SourceEngine.MOMENTUM,
        "roc": SourceEngine.MOMENTUM,
        "cci": SourceEngine.MOMENTUM,
        "williams_r": SourceEngine.MOMENTUM,
        "trend_direction": SourceEngine.TREND,
        "trend_strength": SourceEngine.TREND,
        "trend_age": SourceEngine.TREND,
        "volume_ratio": SourceEngine.VOLUME,
        "obv_trend": SourceEngine.VOLUME,
        "cmf": SourceEngine.VOLUME,
        "mfi": SourceEngine.VOLUME,
        "relative_volume": SourceEngine.VOLUME,
        "nvi_trend": SourceEngine.VOLUME,
        "classical_pattern_score": SourceEngine.PATTERN,
        "candlestick_bullish_score": SourceEngine.PATTERN,
        "candlestick_bearish_score": SourceEngine.PATTERN,
        "double_bottom": SourceEngine.PATTERN,
        "bull_flag": SourceEngine.PATTERN,
        "order_block": SourceEngine.PATTERN,
        "breaker_block": SourceEngine.PATTERN,
        "fair_value_gap": SourceEngine.PATTERN,
        "bos_bullish": SourceEngine.PATTERN,
        "choc_bullish": SourceEngine.PATTERN,
        "in_discount_zone": SourceEngine.PATTERN,
        "opportunity_score": SourceEngine.EARLY_OPPORTUNITY,
        "opportunity_stage": SourceEngine.EARLY_OPPORTUNITY,
        "opportunity_confidence": SourceEngine.EARLY_OPPORTUNITY,
        "expected_return": SourceEngine.EARLY_OPPORTUNITY,
        "max_drawdown": SourceEngine.RISK,
        "volatility": SourceEngine.RISK,
        "sharpe_ratio": SourceEngine.RISK,
        "sortino_ratio": SourceEngine.RISK,
        "beta": SourceEngine.RISK,
        "var_95": SourceEngine.RISK,
        "similarity_score": SourceEngine.SIMILARITY,
        "historical_success_rate": SourceEngine.SIMILARITY,
    }

    METRIC_DESCRIPTIONS = {
        "pe_ratio": "Price-to-Earnings ratio",
        "pb_ratio": "Price-to-Book ratio",
        "roe": "Return on Equity",
        "roa": "Return on Assets",
        "debt_to_equity": "Debt-to-Equity ratio",
        "dividend_yield": "Dividend Yield",
        "earnings_growth": "Earnings Growth Rate",
        "revenue_growth": "Revenue Growth Rate",
        "peg_ratio": "Price/Earnings-to-Growth ratio",
        "current_ratio": "Current Ratio",
        "net_margin": "Net Profit Margin",
        "rsi": "Relative Strength Index",
        "macd": "Moving Average Convergence Divergence",
        "adx": "Average Directional Index",
        "sma_20": "20-day Simple Moving Average",
        "sma_50": "50-day Simple Moving Average",
        "sma_200": "200-day Simple Moving Average",
        "momentum": "Price Momentum",
        "volume_ratio": "Volume Ratio vs Average",
        "obv_trend": "On-Balance Volume Trend",
        "cmf": "Chaikin Money Flow",
        "mfi": "Money Flow Index",
        "relative_volume": "Relative Volume",
        "max_drawdown": "Maximum Drawdown",
        "volatility": "Price Volatility",
        "sharpe_ratio": "Sharpe Ratio",
        "beta": "Market Beta",
        "var_95": "Value at Risk (95%)",
        "order_block": "Smart Money Order Block",
        "fair_value_gap": "Fair Value Gap",
        "bos_bullish": "Break of Structure (Bullish)",
        "similarity_score": "Historical Similarity Score",
        "opportunity_score": "Early Opportunity Score",
    }

    def map_metrics_to_evidence(
        self,
        metrics: dict,
        symbol: str = "",
        min_confidence: float = 0.0,
    ) -> list[EvidenceObject]:
        evidence = []
        for key, value in metrics.items():
            if value is None:
                continue
            if not isinstance(value, (int, float)):
                if isinstance(value, bool):
                    value = 1.0 if value else 0.0
                else:
                    continue

            source = self.ENGINE_KEY_MAP.get(key, SourceEngine.MANUAL)
            direction = self._determine_direction(key, float(value))
            confidence = self._compute_metric_confidence(key, float(value))
            description = self.METRIC_DESCRIPTIONS.get(key, key)

            if confidence < min_confidence:
                continue

            evidence.append(EvidenceObject(
                reference=f"{symbol}:{key}" if symbol else key,
                description=f"{description}: {self._format_value(key, float(value))}",
                source_engine=source,
                value=float(value),
                confidence=confidence,
                metric_name=key,
                direction=direction,
                timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
                metadata={"raw_key": key, "raw_value": value},
            ))

        return evidence

    def map_stage_results(
        self,
        stage_results: list,
        symbol: str = "",
    ) -> list[EvidenceObject]:
        evidence = []
        for sr in stage_results:
            category = getattr(sr, "category", None)
            score = getattr(sr, "score", 0.0)
            source = self._category_to_source(str(category.value if category else ""))
            confidence = min(1.0, score + 0.2)
            description = f"{category.value.title() if category else 'Unknown'} analysis score: {score:.2f}"
            evidence.append(EvidenceObject(
                reference=f"{symbol}:{category.value}" if symbol and category else str(category),
                description=description,
                source_engine=source,
                value=score,
                confidence=confidence,
                metric_name=f"{category.value}_score" if category else "",
                direction=SignalDirection.POSITIVE if score > 0.5 else SignalDirection.NEGATIVE if score < 0.3 else SignalDirection.NEUTRAL,
                timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            ))
        return evidence

    def map_signals(
        self,
        signals: list,
        source_engine: SourceEngine = SourceEngine.MANUAL,
        symbol: str = "",
    ) -> list[EvidenceObject]:
        evidence = []
        for sig in signals:
            name = getattr(sig, "name", "unknown")
            strength = getattr(sig, "strength", 0.0)
            conf = getattr(sig, "confidence", 0.0)
            desc = getattr(sig, "description", name)
            evidence.append(EvidenceObject(
                reference=f"{symbol}:{name}" if symbol else name,
                description=desc,
                source_engine=source_engine,
                value=strength,
                confidence=conf,
                metric_name=name,
                direction=SignalDirection.POSITIVE if strength > 0.5 else SignalDirection.NEGATIVE if strength < 0.3 else SignalDirection.NEUTRAL,
                timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
            ))
        return evidence

    def merge_evidence(
        self,
        *evidence_lists: list[EvidenceObject],
    ) -> list[EvidenceObject]:
        seen: dict[str, EvidenceObject] = {}
        for elist in evidence_lists:
            for e in elist:
                key = e.reference
                if key in seen:
                    existing = seen[key]
                    if e.confidence > existing.confidence:
                        seen[key] = e
                else:
                    seen[key] = e
        return list(seen.values())

    def filter_by_engine(
        self,
        evidence: list[EvidenceObject],
        engine: SourceEngine,
    ) -> list[EvidenceObject]:
        return [e for e in evidence if e.source_engine == engine]

    def filter_by_confidence(
        self,
        evidence: list[EvidenceObject],
        min_confidence: float = 0.5,
    ) -> list[EvidenceObject]:
        return [e for e in evidence if e.confidence >= min_confidence]

    def filter_by_direction(
        self,
        evidence: list[EvidenceObject],
        direction: SignalDirection,
    ) -> list[EvidenceObject]:
        return [e for e in evidence if e.direction == direction]

    def aggregate_by_engine(
        self,
        evidence: list[EvidenceObject],
    ) -> dict[str, float]:
        result: dict[str, float] = {}
        for e in evidence:
            engine = e.source_engine.value
            if engine not in result:
                result[engine] = 0.0
            result[engine] += e.value
        return result

    def _determine_direction(self, key: str, value: float) -> SignalDirection:
        positive_indicators = {
            "roe", "roa", "earnings_growth", "revenue_growth",
            "dividend_yield", "current_ratio", "net_margin",
            "macd", "adx", "obv_trend", "cmf", "mfi",
            "relative_volume", "volume_ratio", "sharpe_ratio",
            "sortino_ratio", "momentum", "similarity_score",
            "opportunity_score",
        }
        negative_indicators = {
            "debt_to_equity", "max_drawdown", "volatility", "beta", "var_95",
        }
        inverted_indicators = {"rsi", "pe_ratio", "pb_ratio"}

        if key in positive_indicators:
            if value > 0:
                return SignalDirection.POSITIVE
            elif value < 0:
                return SignalDirection.NEGATIVE
        elif key in negative_indicators:
            if value > 0:
                return SignalDirection.NEGATIVE
            elif value < 0:
                return SignalDirection.POSITIVE
        elif key in inverted_indicators:
            if key == "rsi":
                if value < 30:
                    return SignalDirection.POSITIVE
                elif value > 70:
                    return SignalDirection.NEGATIVE
            elif key in ("pe_ratio", "pb_ratio"):
                if 0 < value < 15:
                    return SignalDirection.POSITIVE
                elif value > 30:
                    return SignalDirection.NEGATIVE
        return SignalDirection.NEUTRAL

    def _compute_metric_confidence(self, key: str, value: float) -> float:
        if key in ("order_block", "breaker_block", "fair_value_gap",
                    "bos_bullish", "choc_bullish", "in_discount_zone"):
            return 0.8 if value > 0 else 0.3

        if key in ("double_bottom", "bull_flag", "ascending_triangle",
                    "cup_handle"):
            return 0.7 if value > 0 else 0.3

        if key == "rsi":
            if value < 25 or value > 75:
                return 0.9
            elif value < 35 or value > 65:
                return 0.7
            return 0.5

        if abs(value) > 2:
            return 0.8
        elif abs(value) > 1:
            return 0.7
        elif abs(value) > 0:
            return 0.6
        return 0.3

    def _format_value(self, key: str, value: float) -> str:
        if key in ("earnings_growth", "revenue_growth", "dividend_yield",
                    "roe", "roa", "net_margin", "volatility", "max_drawdown",
                    "var_95", "rsi", "mfi"):
            return f"{value:.1f}%"
        elif key in ("pe_ratio", "pb_ratio", "peg_ratio", "debt_to_equity",
                      "current_ratio", "sharpe_ratio", "sortino_ratio", "beta",
                      "adx", "volume_ratio", "relative_volume"):
            return f"{value:.2f}"
        elif key in ("order_block", "breaker_block", "fair_value_gap",
                      "bos_bullish", "choc_bullish", "in_discount_zone",
                      "double_bottom", "bull_flag"):
            return "Detected" if value > 0 else "Not detected"
        return f"{value:.4f}"

    def _category_to_source(self, category: str) -> SourceEngine:
        mapping = {
            "financial": SourceEngine.FINANCIAL,
            "technical": SourceEngine.INDICATOR,
            "volume": SourceEngine.VOLUME,
            "smart_money": SourceEngine.PATTERN,
            "pattern": SourceEngine.PATTERN,
            "risk": SourceEngine.RISK,
            "similarity": SourceEngine.SIMILARITY,
            "market_regime": SourceEngine.STRATEGY,
        }
        return mapping.get(category.lower(), SourceEngine.MANUAL)
