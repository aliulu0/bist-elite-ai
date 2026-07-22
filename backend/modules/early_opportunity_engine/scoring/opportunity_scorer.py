from __future__ import annotations

from modules.early_opportunity_engine.core.types import (
    AnalysisCategory,
    ExpectedReturn,
    ExpectedWindow,
    MarketRegimeType,
    OpportunityRating,
    OpportunityScore,
    OpportunityStage,
    RiskAssessment,
    SimilarityAnalysis,
    StageResult,
)


class OpportunityScorer:

    STAGE_WEIGHTS = {
        AnalysisCategory.FINANCIAL: 0.20,
        AnalysisCategory.TECHNICAL: 0.20,
        AnalysisCategory.VOLUME: 0.15,
        AnalysisCategory.SMART_MONEY: 0.15,
        AnalysisCategory.PATTERN: 0.10,
        AnalysisCategory.RISK: 0.10,
        AnalysisCategory.SIMILARITY: 0.10,
    }

    REGIME_MULTIPLIERS = {
        MarketRegimeType.BULL: 1.15,
        MarketRegimeType.BEAR: 0.75,
        MarketRegimeType.SIDEWAYS: 0.90,
        MarketRegimeType.HIGH_VOLATILITY: 0.80,
        MarketRegimeType.LOW_VOLATILITY: 1.10,
    }

    def compute_opportunity_score(
        self,
        stage_results: list[StageResult],
        market_regime: MarketRegimeType = MarketRegimeType.SIDEWAYS,
    ) -> OpportunityScore:
        scores = {}
        for sr in stage_results:
            scores[sr.category] = sr.score

        financial = scores.get(AnalysisCategory.FINANCIAL, 0.0)
        technical = scores.get(AnalysisCategory.TECHNICAL, 0.0)
        volume = scores.get(AnalysisCategory.VOLUME, 0.0)
        sm = scores.get(AnalysisCategory.SMART_MONEY, 0.0)
        pattern = scores.get(AnalysisCategory.PATTERN, 0.0)
        risk = scores.get(AnalysisCategory.RISK, 0.0)
        similarity = scores.get(AnalysisCategory.SIMILARITY, 0.0)

        regime_mult = self.REGIME_MULTIPLIERS.get(market_regime, 1.0)

        raw = (
            financial * self.STAGE_WEIGHTS[AnalysisCategory.FINANCIAL] +
            technical * self.STAGE_WEIGHTS[AnalysisCategory.TECHNICAL] +
            volume * self.STAGE_WEIGHTS[AnalysisCategory.VOLUME] +
            sm * self.STAGE_WEIGHTS[AnalysisCategory.SMART_MONEY] +
            pattern * self.STAGE_WEIGHTS[AnalysisCategory.PATTERN] +
            risk * self.STAGE_WEIGHTS[AnalysisCategory.RISK] +
            similarity * self.STAGE_WEIGHTS[AnalysisCategory.SIMILARITY]
        )

        overall = min(100.0, max(0.0, raw * 100.0 * regime_mult))

        return OpportunityScore(
            overall=overall,
            financial=financial * 100,
            technical=technical * 100,
            volume=volume * 100,
            smart_money=sm * 100,
            pattern=pattern * 100,
            risk=risk * 100,
            similarity=similarity * 100,
            regime_adjustment=regime_mult,
        )

    def determine_stage(
        self,
        score: float,
        stage_results: list[StageResult],
    ) -> OpportunityStage:
        sm_score = 0.0
        for sr in stage_results:
            if sr.category == AnalysisCategory.SMART_MONEY:
                sm_score = sr.score
                break

        if score < 15:
            return OpportunityStage.STAGE_0_IGNORE
        elif score < 30:
            if sm_score > 0.4:
                return OpportunityStage.STAGE_1_SILENT_ACCUMULATION
            return OpportunityStage.STAGE_0_IGNORE
        elif score < 45:
            if sm_score > 0.5:
                return OpportunityStage.STAGE_2_EARLY_SMART_MONEY
            return OpportunityStage.STAGE_1_SILENT_ACCUMULATION
        elif score < 55:
            return OpportunityStage.STAGE_3_INSTITUTIONAL_ACCUMULATION
        elif score < 70:
            return OpportunityStage.STAGE_4_BREAKOUT_PREPARATION
        elif score < 82:
            return OpportunityStage.STAGE_5_BREAKOUT
        elif score < 92:
            return OpportunityStage.STAGE_6_TREND_EXPANSION
        else:
            return OpportunityStage.STAGE_7_LATE_OPPORTUNITY

    def determine_rating(self, score: float) -> OpportunityRating:
        if score >= 85:
            return OpportunityRating.EXCEPTIONAL
        elif score >= 70:
            return OpportunityRating.VERY_HIGH
        elif score >= 55:
            return OpportunityRating.HIGH
        elif score >= 40:
            return OpportunityRating.MEDIUM
        elif score >= 25:
            return OpportunityRating.LOW
        else:
            return OpportunityRating.VERY_LOW

    def determine_window(
        self,
        stage: OpportunityStage,
        score: float,
    ) -> ExpectedWindow:
        window_map = {
            OpportunityStage.STAGE_0_IGNORE: ExpectedWindow.TWELVE_MONTHS,
            OpportunityStage.STAGE_1_SILENT_ACCUMULATION: ExpectedWindow.THREE_MONTHS,
            OpportunityStage.STAGE_2_EARLY_SMART_MONEY: ExpectedWindow.THREE_MONTHS,
            OpportunityStage.STAGE_3_INSTITUTIONAL_ACCUMULATION: ExpectedWindow.ONE_MONTH,
            OpportunityStage.STAGE_4_BREAKOUT_PREPARATION: ExpectedWindow.TWO_WEEKS,
            OpportunityStage.STAGE_5_BREAKOUT: ExpectedWindow.ONE_WEEK,
            OpportunityStage.STAGE_6_TREND_EXPANSION: ExpectedWindow.TWO_WEEKS,
            OpportunityStage.STAGE_7_LATE_OPPORTUNITY: ExpectedWindow.ONE_MONTH,
        }
        return window_map.get(stage, ExpectedWindow.ONE_MONTH)

    def compute_confidence(
        self,
        stage_results: list[StageResult],
        risk: RiskAssessment,
    ) -> float:
        signal_counts = [len(sr.signals) for sr in stage_results]
        total_signals = sum(signal_counts)
        stages_with_data = sum(1 for sr in stage_results if sr.score > 0)

        if total_signals == 0:
            return 0.0

        data_factor = min(1.0, stages_with_data / 5)
        signal_factor = min(1.0, total_signals / 10)
        risk_factor = 1.0 - risk.score * 0.3

        confidence = (data_factor * 0.4 + signal_factor * 0.3 + risk_factor * 0.3) * 100
        return min(100.0, max(0.0, confidence))

    def compute_expected_return(
        self,
        stage: OpportunityStage,
        score: float,
    ) -> ExpectedReturn:
        base_returns = {
            OpportunityStage.STAGE_0_IGNORE: (0.0, 0.0, 0.0),
            OpportunityStage.STAGE_1_SILENT_ACCUMULATION: (5.0, 15.0, 30.0),
            OpportunityStage.STAGE_2_EARLY_SMART_MONEY: (8.0, 20.0, 40.0),
            OpportunityStage.STAGE_3_INSTITUTIONAL_ACCUMULATION: (10.0, 25.0, 50.0),
            OpportunityStage.STAGE_4_BREAKOUT_PREPARATION: (12.0, 30.0, 60.0),
            OpportunityStage.STAGE_5_BREAKOUT: (15.0, 35.0, 70.0),
            OpportunityStage.STAGE_6_TREND_EXPANSION: (8.0, 20.0, 40.0),
            OpportunityStage.STAGE_7_LATE_OPPORTUNITY: (3.0, 10.0, 20.0),
        }
        conservative, expected, optimistic = base_returns.get(stage, (0.0, 0.0, 0.0))
        factor = score / 100.0

        return ExpectedReturn(
            conservative=round(conservative * factor, 1),
            expected=round(expected * factor, 1),
            optimistic=round(optimistic * factor, 1),
        )

    def determine_market_regime(self, metrics: dict) -> MarketRegimeType:
        volatility = metrics.get("market_volatility", 20.0)
        trend = metrics.get("market_trend", 0.0)
        vix = metrics.get("vix", 20.0)

        if volatility > 30 or vix > 25:
            return MarketRegimeType.HIGH_VOLATILITY
        elif volatility < 12:
            return MarketRegimeType.LOW_VOLATILITY
        elif trend > 0.5:
            return MarketRegimeType.BULL
        elif trend < -0.5:
            return MarketRegimeType.BEAR
        else:
            return MarketRegimeType.SIDEWAYS
