from __future__ import annotations

from modules.early_opportunity_engine.core.types import (
    OpportunityStage,
    OpportunityRating,
    AnalysisCategory,
    StageResult,
    RiskAssessment,
    MarketRegimeType,
)


class OpportunityValidator:

    def validate_metrics(self, metrics: dict) -> list[str]:
        errors = []

        if not isinstance(metrics, dict):
            errors.append("Metrics must be a dictionary")
            return errors

        if len(metrics) == 0:
            errors.append("Metrics dictionary is empty")

        close = metrics.get("close")
        if close is not None and (not isinstance(close, (int, float)) or close <= 0):
            errors.append(f"Invalid close price: {close}")

        volume = metrics.get("volume")
        if volume is not None and (not isinstance(volume, (int, float)) or volume < 0):
            errors.append(f"Invalid volume: {volume}")

        rsi = metrics.get("rsi")
        if rsi is not None and (not isinstance(rsi, (int, float)) or rsi < 0 or rsi > 100):
            errors.append(f"Invalid RSI: {rsi}")

        pe = metrics.get("pe_ratio")
        if pe is not None and (not isinstance(pe, (int, float)) or pe < -1000):
            errors.append(f"Invalid P/E ratio: {pe}")

        return errors

    def validate_result(self, result) -> list[str]:
        errors = []

        if result.opportunity_score < 0 or result.opportunity_score > 100:
            errors.append(f"Opportunity score out of range: {result.opportunity_score}")

        if not isinstance(result.stage, OpportunityStage):
            errors.append(f"Invalid stage: {result.stage}")

        if not isinstance(result.rating, OpportunityRating):
            errors.append(f"Invalid rating: {result.rating}")

        if result.confidence < 0 or result.confidence > 100:
            errors.append(f"Confidence out of range: {result.confidence}")

        if not isinstance(result.risk, RiskAssessment):
            errors.append(f"Invalid risk assessment type")

        if result.risk.score < 0 or result.risk.score > 1:
            errors.append(f"Risk score out of range: {result.risk.score}")

        if not result.symbol:
            errors.append("Symbol is missing")

        return errors

    def validate_pipeline_input(
        self,
        symbol: str,
        metrics: dict,
        market_regime: MarketRegimeType | None = None,
    ) -> list[str]:
        errors = []

        if not symbol or not isinstance(symbol, str):
            errors.append("Symbol must be a non-empty string")

        if market_regime is not None and not isinstance(market_regime, MarketRegimeType):
            errors.append(f"Invalid market regime: {market_regime}")

        errors.extend(self.validate_metrics(metrics))
        return errors

    def validate_stage_result(self, stage_result: StageResult) -> list[str]:
        errors = []

        if not isinstance(stage_result.category, AnalysisCategory):
            errors.append(f"Invalid category: {stage_result.category}")

        if stage_result.score < 0 or stage_result.score > 1:
            errors.append(f"Stage score out of range: {stage_result.score}")

        if not isinstance(stage_result.signals, list):
            errors.append("Signals must be a list")

        if not isinstance(stage_result.warnings, list):
            errors.append("Warnings must be a list")

        return errors

    def validate_symbol(self, symbol: str) -> bool:
        if not symbol or not isinstance(symbol, str):
            return False
        return len(symbol.strip()) > 0

    def is_analyzable(self, metrics: dict) -> tuple[bool, str]:
        errors = self.validate_metrics(metrics)
        if errors:
            return False, "; ".join(errors)

        has_price = metrics.get("close") is not None
        has_volume = metrics.get("volume") is not None
        has_rsi = metrics.get("rsi") is not None
        has_macd = metrics.get("macd") is not None

        score = sum([has_price, has_volume, has_rsi, has_macd])
        if score < 2:
            return False, "Insufficient data: need at least 2 of close, volume, RSI, MACD"

        return True, "Metrics are analyzable"
