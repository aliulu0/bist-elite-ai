from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

from modules.confidence_engine.core.types import (
    ConfidenceDimension,
    DimensionContribution,
    normalize_score,
)


class BaseDimensionCalculator(ABC):
    @property
    @abstractmethod
    def dimension(self) -> ConfidenceDimension:
        ...

    @abstractmethod
    def calculate(self, data: Dict[str, Any]) -> DimensionContribution:
        ...

    def _build_contribution(
        self,
        raw_score: float,
        weight: float = 1.0,
        evidence_count: int = 0,
        confidence: float = 1.0,
        details: Optional[Dict[str, Any]] = None,
    ) -> DimensionContribution:
        normalized = normalize_score(raw_score)
        weighted = normalized * weight
        return DimensionContribution(
            dimension=self.dimension,
            raw_score=raw_score,
            normalized_score=normalized,
            weighted_score=weighted,
            contribution=weighted,
            weight=weight,
            confidence=confidence,
            evidence_count=evidence_count,
            details=details or {},
        )


class DataConfidenceCalculator(BaseDimensionCalculator):
    @property
    def dimension(self) -> ConfidenceDimension:
        return ConfidenceDimension.DATA

    def calculate(self, data: Dict[str, Any]) -> DimensionContribution:
        missing = data.get("missing_fields", [])
        freshness_hours = data.get("freshness_hours", 24)
        completeness = data.get("completeness", 100.0)
        provider_reliability = data.get("provider_reliability", 90.0)
        consistency = data.get("consistency", 90.0)

        completeness_penalty = max(0, len(missing)) * 5.0
        freshness_penalty = min(30.0, max(0, (freshness_hours - 1) * 2.0))

        raw = (
            completeness * 0.30
            + provider_reliability * 0.25
            + consistency * 0.25
            + max(0, 100 - completeness_penalty) * 0.10
            + max(0, 100 - freshness_penalty) * 0.10
        )

        details = {
            "completeness": completeness,
            "freshness_hours": freshness_hours,
            "provider_reliability": provider_reliability,
            "consistency": consistency,
            "missing_fields": missing,
        }
        evidence = sum(1 for v in [completeness, provider_reliability, consistency] if v > 0)
        return self._build_contribution(raw, evidence_count=evidence, details=details)


class SignalConfidenceCalculator(BaseDimensionCalculator):
    @property
    def dimension(self) -> ConfidenceDimension:
        return ConfidenceDimension.SIGNAL

    def calculate(self, data: Dict[str, Any]) -> DimensionContribution:
        financial = data.get("financial_confirmation", 50.0)
        technical = data.get("technical_confirmation", 50.0)
        volume = data.get("volume_confirmation", 50.0)
        pattern = data.get("pattern_confirmation", 50.0)
        smart_money = data.get("smart_money_confirmation", 50.0)

        confirmations = [financial, technical, volume, pattern, smart_money]
        positive = sum(1 for c in confirmations if c >= 60)
        total = len(confirmations)

        raw = (
            financial * 0.25
            + technical * 0.25
            + volume * 0.20
            + pattern * 0.15
            + smart_money * 0.15
        )

        agreement_bonus = (positive / total) * 10 if total > 0 else 0
        raw = min(100.0, raw + agreement_bonus)

        details = {
            "financial_confirmation": financial,
            "technical_confirmation": technical,
            "volume_confirmation": volume,
            "pattern_confirmation": pattern,
            "smart_money_confirmation": smart_money,
            "positive_confirmations": positive,
            "total_confirmations": total,
        }
        return self._build_contribution(raw, evidence_count=positive, details=details)


class EvidenceConfidenceCalculator(BaseDimensionCalculator):
    @property
    def dimension(self) -> ConfidenceDimension:
        return ConfidenceDimension.EVIDENCE

    def calculate(self, data: Dict[str, Any]) -> DimensionContribution:
        coverage = data.get("evidence_coverage", 50.0)
        quality = data.get("evidence_quality", 50.0)
        consistency = data.get("evidence_consistency", 50.0)
        reliability = data.get("evidence_reliability", 50.0)

        raw = (
            coverage * 0.30
            + quality * 0.30
            + consistency * 0.20
            + reliability * 0.20
        )

        details = {
            "evidence_coverage": coverage,
            "evidence_quality": quality,
            "evidence_consistency": consistency,
            "evidence_reliability": reliability,
        }
        return self._build_contribution(raw, evidence_count=4, details=details)


class ModelConfidenceCalculator(BaseDimensionCalculator):
    @property
    def dimension(self) -> ConfidenceDimension:
        return ConfidenceDimension.MODEL

    def calculate(self, data: Dict[str, Any]) -> DimensionContribution:
        accuracy = data.get("historical_accuracy", 50.0)
        success = data.get("previous_success", 50.0)
        backtest = data.get("backtest_performance", 50.0)
        walk_forward = data.get("walk_forward_performance", 50.0)

        raw = (
            accuracy * 0.30
            + success * 0.25
            + backtest * 0.25
            + walk_forward * 0.20
        )

        details = {
            "historical_accuracy": accuracy,
            "previous_success": success,
            "backtest_performance": backtest,
            "walk_forward_performance": walk_forward,
        }
        return self._build_contribution(raw, evidence_count=4, details=details)


class HistoricalConfidenceCalculator(BaseDimensionCalculator):
    @property
    def dimension(self) -> ConfidenceDimension:
        return ConfidenceDimension.HISTORICAL

    def calculate(self, data: Dict[str, Any]) -> DimensionContribution:
        win_rate = data.get("historical_win_rate", 50.0)
        consistency = data.get("historical_consistency", 50.0)
        sample_size = data.get("historical_sample_size", 10)
        avg_return = data.get("historical_avg_return", 5.0)

        sample_bonus = min(15.0, sample_size * 1.5)
        return_bonus = min(20.0, max(0, avg_return * 2.0))

        raw = (
            win_rate * 0.35
            + consistency * 0.30
            + sample_bonus * 0.20
            + return_bonus * 0.15
        )
        raw = min(100.0, raw)

        details = {
            "historical_win_rate": win_rate,
            "historical_consistency": consistency,
            "historical_sample_size": sample_size,
            "historical_avg_return": avg_return,
        }
        return self._build_contribution(raw, evidence_count=max(1, sample_size), details=details)


class PatternConfidenceCalculator(BaseDimensionCalculator):
    @property
    def dimension(self) -> ConfidenceDimension:
        return ConfidenceDimension.PATTERN

    def calculate(self, data: Dict[str, Any]) -> DimensionContribution:
        win_rate = data.get("pattern_win_rate", 50.0)
        confirmation = data.get("pattern_confirmation", 50.0)
        quality = data.get("pattern_quality", 50.0)
        age_days = data.get("pattern_age_days", 5)
        pattern_count = data.get("pattern_count", 1)

        age_penalty = min(20.0, max(0, (age_days - 1) * 3.0))
        count_bonus = min(10.0, pattern_count * 3.0)

        raw = (
            win_rate * 0.30
            + confirmation * 0.30
            + quality * 0.25
            + max(0, 100 - age_penalty) * 0.15
        )
        raw = min(100.0, raw + count_bonus)

        details = {
            "pattern_win_rate": win_rate,
            "pattern_confirmation": confirmation,
            "pattern_quality": quality,
            "pattern_age_days": age_days,
            "pattern_count": pattern_count,
        }
        return self._build_contribution(raw, evidence_count=pattern_count, details=details)


class RiskConfidenceCalculator(BaseDimensionCalculator):
    @property
    def dimension(self) -> ConfidenceDimension:
        return ConfidenceDimension.RISK

    def calculate(self, data: Dict[str, Any]) -> DimensionContribution:
        risk_score = data.get("risk_score", 50.0)
        risk_reward = data.get("risk_reward_ratio", 2.0)
        max_drawdown = data.get("max_drawdown", 10.0)
        stop_loss_distance = data.get("stop_loss_distance", 5.0)

        rr_bonus = min(20.0, risk_reward * 5.0)
        drawdown_penalty = min(30.0, max_drawdown * 2.0)

        raw = (
            risk_score * 0.40
            + rr_bonus * 0.30
            + max(0, 100 - drawdown_penalty) * 0.20
            + max(0, 100 - stop_loss_distance * 5) * 0.10
        )
        raw = min(100.0, max(0.0, raw))

        details = {
            "risk_score": risk_score,
            "risk_reward_ratio": risk_reward,
            "max_drawdown": max_drawdown,
            "stop_loss_distance": stop_loss_distance,
        }
        return self._build_contribution(raw, evidence_count=4, details=details)


class MarketConfidenceCalculator(BaseDimensionCalculator):
    @property
    def dimension(self) -> ConfidenceDimension:
        return ConfidenceDimension.MARKET

    def calculate(self, data: Dict[str, Any]) -> DimensionContribution:
        regime_score = data.get("market_regime_score", 50.0)
        sector_trend = data.get("sector_trend", 50.0)
        macro_environment = data.get("macro_environment", 50.0)
        volatility = data.get("market_volatility", 30.0)

        vol_penalty = min(25.0, volatility * 0.5)

        raw = (
            regime_score * 0.30
            + sector_trend * 0.25
            + macro_environment * 0.25
            + max(0, 100 - vol_penalty) * 0.20
        )

        details = {
            "market_regime_score": regime_score,
            "sector_trend": sector_trend,
            "macro_environment": macro_environment,
            "market_volatility": volatility,
        }
        return self._build_contribution(raw, evidence_count=4, details=details)


class SectorConfidenceCalculator(BaseDimensionCalculator):
    @property
    def dimension(self) -> ConfidenceDimension:
        return ConfidenceDimension.SECTOR

    def calculate(self, data: Dict[str, Any]) -> DimensionContribution:
        sector_momentum = data.get("sector_momentum", 50.0)
        sector_relative = data.get("sector_relative_strength", 50.0)
        sector_rotation = data.get("sector_rotation_score", 50.0)
        peer_comparison = data.get("peer_comparison", 50.0)

        raw = (
            sector_momentum * 0.30
            + sector_relative * 0.30
            + sector_rotation * 0.20
            + peer_comparison * 0.20
        )

        details = {
            "sector_momentum": sector_momentum,
            "sector_relative_strength": sector_relative,
            "sector_rotation_score": sector_rotation,
            "peer_comparison": peer_comparison,
        }
        return self._build_contribution(raw, evidence_count=4, details=details)


class ExecutionConfidenceCalculator(BaseDimensionCalculator):
    @property
    def dimension(self) -> ConfidenceDimension:
        return ConfidenceDimension.EXECUTION

    def calculate(self, data: Dict[str, Any]) -> DimensionContribution:
        liquidity = data.get("liquidity_score", 50.0)
        spread = data.get("spread_bps", 10.0)
        avg_volume = data.get("avg_daily_volume", 100000)
        trade_size = data.get("trade_size_capacity", 50000)

        spread_penalty = min(30.0, spread * 1.5)
        volume_score = min(100.0, (avg_volume / 10000) * 10)
        capacity_score = min(100.0, (trade_size / 1000) * 10)

        raw = (
            liquidity * 0.30
            + max(0, 100 - spread_penalty) * 0.25
            + volume_score * 0.25
            + capacity_score * 0.20
        )

        details = {
            "liquidity_score": liquidity,
            "spread_bps": spread,
            "avg_daily_volume": avg_volume,
            "trade_size_capacity": trade_size,
        }
        return self._build_contribution(raw, evidence_count=4, details=details)


class LiquidityConfidenceCalculator(BaseDimensionCalculator):
    @property
    def dimension(self) -> ConfidenceDimension:
        return ConfidenceDimension.LIQUIDITY

    def calculate(self, data: Dict[str, Any]) -> DimensionContribution:
        bid_ask_spread = data.get("bid_ask_spread", 10.0)
        daily_volume = data.get("daily_volume", 100000)
        market_cap = data.get("market_cap", 1e9)
        volatility = data.get("stock_volatility", 30.0)

        spread_score = max(0, 100 - bid_ask_spread * 5)
        volume_score = min(100.0, (daily_volume / 50000) * 10)
        cap_score = min(100.0, (market_cap / 1e8) * 10)
        vol_penalty = min(20.0, volatility * 0.4)

        raw = (
            spread_score * 0.30
            + volume_score * 0.30
            + cap_score * 0.20
            + max(0, 100 - vol_penalty) * 0.20
        )

        details = {
            "bid_ask_spread": bid_ask_spread,
            "daily_volume": daily_volume,
            "market_cap": market_cap,
            "stock_volatility": volatility,
        }
        return self._build_contribution(raw, evidence_count=4, details=details)


ALL_CALCULATORS = {
    ConfidenceDimension.DATA: DataConfidenceCalculator,
    ConfidenceDimension.SIGNAL: SignalConfidenceCalculator,
    ConfidenceDimension.EVIDENCE: EvidenceConfidenceCalculator,
    ConfidenceDimension.MODEL: ModelConfidenceCalculator,
    ConfidenceDimension.HISTORICAL: HistoricalConfidenceCalculator,
    ConfidenceDimension.PATTERN: PatternConfidenceCalculator,
    ConfidenceDimension.RISK: RiskConfidenceCalculator,
    ConfidenceDimension.MARKET: MarketConfidenceCalculator,
    ConfidenceDimension.SECTOR: SectorConfidenceCalculator,
    ConfidenceDimension.EXECUTION: ExecutionConfidenceCalculator,
    ConfidenceDimension.LIQUIDITY: LiquidityConfidenceCalculator,
}


def get_calculator(dimension: ConfidenceDimension) -> Optional[BaseDimensionCalculator]:
    calc_cls = ALL_CALCULATORS.get(dimension)
    if calc_cls:
        return calc_cls()
    return None
