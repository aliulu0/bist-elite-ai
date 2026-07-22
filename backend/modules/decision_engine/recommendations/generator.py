from __future__ import annotations

from typing import Dict, List, Optional

from modules.decision_engine.core.types import (
    DecisionDimension,
    DecisionType,
    DimensionScore,
    EntryGuidance,
    EntryTiming,
    ExitAction,
    ExitGuidance,
    InvestmentHorizon,
    HorizonRecommendation,
    classify_decision,
)


class RecommendationGenerator:
    """Generates entry/exit guidance and horizon-specific recommendations."""

    TARGET_PROFIT_PCTS = {
        InvestmentHorizon.WEEKLY: 3.0,
        InvestmentHorizon.MONTH_1: 8.0,
        InvestmentHorizon.MONTH_3: 15.0,
        InvestmentHorizon.MONTH_6: 25.0,
        InvestmentHorizon.MONTH_12: 40.0,
    }

    STOP_LOSS_PCTS = {
        InvestmentHorizon.WEEKLY: 2.0,
        InvestmentHorizon.MONTH_1: 5.0,
        InvestmentHorizon.MONTH_3: 8.0,
        InvestmentHorizon.MONTH_6: 12.0,
        InvestmentHorizon.MONTH_12: 15.0,
    }

    REVIEW_DAYS = {
        InvestmentHorizon.WEEKLY: 5,
        InvestmentHorizon.MONTH_1: 20,
        InvestmentHorizon.MONTH_3: 60,
        InvestmentHorizon.MONTH_6: 120,
        InvestmentHorizon.MONTH_12: 240,
    }

    def generate_entry(
        self,
        decision: DecisionType,
        score: float,
        risk_score: float,
        momentum_score: float,
    ) -> EntryGuidance:
        if decision in (DecisionType.STRONG_BUY, DecisionType.BUY):
            if momentum_score >= 80:
                return EntryGuidance(
                    timing=EntryTiming.IMMEDIATE,
                    max_position_pct=20.0,
                    rationale="Strong signals with high momentum; enter immediately",
                )
            elif momentum_score >= 60:
                return EntryGuidance(
                    timing=EntryTiming.SCALE_IN,
                    scale_in_levels=[0.3, 0.5, 0.2],
                    max_position_pct=15.0,
                    rationale="Strong signals but moderate momentum; scale in gradually",
                )
            else:
                return EntryGuidance(
                    timing=EntryTiming.WAIT_PULLBACK,
                    max_position_pct=10.0,
                    rationale="Strong fundamentals but low momentum; wait for pullback",
                )

        elif decision in (DecisionType.EARLY_ACCUMULATION, DecisionType.ACCUMULATE):
            if risk_score >= 60:
                return EntryGuidance(
                    timing=EntryTiming.SCALE_IN,
                    scale_in_levels=[0.2, 0.3, 0.3, 0.2],
                    max_position_pct=10.0,
                    rationale="Moderate opportunity; scale in carefully due to risk",
                )
            else:
                return EntryGuidance(
                    timing=EntryTiming.SCALE_IN,
                    scale_in_levels=[0.4, 0.6],
                    max_position_pct=12.0,
                    rationale="Accumulation opportunity; enter in two tranches",
                )

        elif decision == DecisionType.WATCH:
            return EntryGuidance(
                timing=EntryTiming.WAIT_BREAKOUT,
                max_position_pct=5.0,
                rationale="Setup forming but not confirmed; wait for breakout",
            )

        elif decision == DecisionType.WAIT_CONFIRMATION:
            return EntryGuidance(
                timing=EntryTiming.WAIT_BREAKOUT,
                max_position_pct=3.0,
                rationale="Need more confirmation before entry",
            )

        else:
            return EntryGuidance(
                timing=EntryTiming.NO_ENTRY,
                max_position_pct=0.0,
                rationale=f"Decision is {decision.value}; no entry recommended",
            )

    def generate_exit(
        self,
        decision: DecisionType,
        score: float,
        risk_score: float,
        horizon: InvestmentHorizon = InvestmentHorizon.MONTH_3,
    ) -> ExitGuidance:
        target_pct = self.TARGET_PROFIT_PCTS[horizon]
        stop_pct = self.STOP_LOSS_PCTS[horizon]
        review = self.REVIEW_DAYS[horizon]

        if decision in (DecisionType.STRONG_BUY, DecisionType.BUY):
            return ExitGuidance(
                action=ExitAction.TRAILING_STOP,
                secondary_target=target_pct * 1.5,
                risk_stop=-stop_pct,
                trailing_stop_pct=stop_pct * 0.7,
                review_days=review,
                rationale="Strong setup; use trailing stop to capture upside",
            )

        elif decision in (DecisionType.EARLY_ACCUMULATION, DecisionType.ACCUMULATE):
            return ExitGuidance(
                action=ExitAction.HOLD,
                initial_target=target_pct,
                secondary_target=target_pct * 1.3,
                risk_stop=-stop_pct,
                review_days=review,
                rationale="Accumulation phase; hold with defined targets",
            )

        elif decision == DecisionType.WATCH:
            return ExitGuidance(
                action=ExitAction.HOLD,
                initial_target=target_pct * 0.5,
                risk_stop=-stop_pct * 0.5,
                review_days=review // 2,
                rationale="Watching; set tight stop for early exit if triggered",
            )

        elif decision in (DecisionType.REDUCE, DecisionType.TAKE_PROFIT):
            return ExitGuidance(
                action=ExitAction.TAKE_PARTIAL,
                initial_target=0.0,
                risk_stop=-stop_pct * 0.5,
                review_days=7,
                rationale="Consider reducing position or taking profit",
            )

        elif decision in (DecisionType.AVOID, DecisionType.DISTRIBUTION_RISK):
            return ExitGuidance(
                action=ExitAction.EXIT,
                risk_stop=-stop_pct * 0.3,
                review_days=3,
                rationale="Exit or avoid; distribution risk detected",
            )

        else:
            return ExitGuidance(
                action=ExitAction.HOLD,
                initial_target=target_pct,
                risk_stop=-stop_pct,
                review_days=review,
                rationale="Hold current position with standard targets",
            )

    def generate_horizon_recommendations(
        self,
        symbol: str,
        overall_score: float,
        dimension_scores: Dict[DecisionDimension, DimensionScore],
        risk_score: float,
        momentum_score: float,
    ) -> List[HorizonRecommendation]:
        results: List[HorizonRecommendation] = []
        for horizon in InvestmentHorizon:
            horizon_score = self._horizon_adjusted_score(overall_score, horizon)
            decision = classify_decision(horizon_score)
            entry = self.generate_entry(decision, horizon_score, risk_score, momentum_score)
            exit_g = self.generate_exit(decision, horizon_score, risk_score, horizon)
            summary = f"{horizon.value}: {decision.value.replace('_', ' ').title()} (score={horizon_score:.1f})"
            results.append(HorizonRecommendation(
                horizon=horizon,
                decision=decision,
                score=horizon_score,
                confidence=0.0,
                entry=entry,
                exit=exit_g,
                summary=summary,
            ))
        return results

    def _horizon_adjusted_score(self, base_score: float, horizon: InvestmentHorizon) -> float:
        adjustments = {
            InvestmentHorizon.WEEKLY: -5.0,
            InvestmentHorizon.MONTH_1: 0.0,
            InvestmentHorizon.MONTH_3: 3.0,
            InvestmentHorizon.MONTH_6: 5.0,
            InvestmentHorizon.MONTH_12: 2.0,
        }
        return max(0.0, min(100.0, base_score + adjustments.get(horizon, 0.0)))
