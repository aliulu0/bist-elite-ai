from __future__ import annotations

import time

from modules.early_opportunity_engine.core.types import (
    AnalysisCategory,
    AlertType,
    EarlyWarning,
    EvidenceItem,
    EvidencePackage,
    MarketRegimeType,
    OpportunityResult,
    OpportunityStage,
    OpportunityRating,
    RedFlag,
    RiskAssessment,
    SimilarityAnalysis,
    ExpectedReturn,
    ExpectedWindow,
    StageResult,
)
from modules.early_opportunity_engine.core.base import BaseAnalysisStage
from modules.early_opportunity_engine.scoring.opportunity_scorer import OpportunityScorer
from modules.early_opportunity_engine.stages.financial_stage import FinancialAnalysisStage
from modules.early_opportunity_engine.stages.technical_stage import TechnicalAnalysisStage
from modules.early_opportunity_engine.stages.volume_stage import VolumeAnalysisStage
from modules.early_opportunity_engine.stages.smart_money_stage import SmartMoneyAnalysisStage
from modules.early_opportunity_engine.stages.pattern_stage import PatternAnalysisStage
from modules.early_opportunity_engine.stages.risk_stage import RiskAnalysisStage
from modules.early_opportunity_engine.stages.similarity_stage import SimilarityAnalysisStage


class OpportunityPipeline:

    def __init__(self) -> None:
        self._stages: list[BaseAnalysisStage] = [
            FinancialAnalysisStage(),
            TechnicalAnalysisStage(),
            VolumeAnalysisStage(),
            SmartMoneyAnalysisStage(),
            PatternAnalysisStage(),
            RiskAnalysisStage(),
            SimilarityAnalysisStage(),
        ]
        self._scorer = OpportunityScorer()

    @property
    def stages(self) -> list[BaseAnalysisStage]:
        return list(self._stages)

    def analyze(
        self,
        symbol: str,
        metrics: dict,
        market_regime: MarketRegimeType | None = None,
        **kwargs,
    ) -> OpportunityResult:
        start = time.perf_counter()

        all_stage_results: list[StageResult] = []
        total_signals = 0

        for stage in self._stages:
            stage_result = stage.analyze(symbol, metrics, **kwargs)
            all_stage_results.append(stage_result)
            total_signals += len(stage_result.signals)

        if market_regime is None:
            market_regime = self._scorer.determine_market_regime(metrics)

        opp_score = self._scorer.compute_opportunity_score(
            all_stage_results, market_regime,
        )

        stage = self._scorer.determine_stage(opp_score.overall, all_stage_results)
        rating = self._scorer.determine_rating(opp_score.overall)
        window = self._scorer.determine_window(stage, opp_score.overall)

        risk_stage = self._get_risk_stage(all_stage_results)
        risk_assessment = self._extract_risk(risk_stage, metrics)

        confidence = self._scorer.compute_confidence(all_stage_results, risk_assessment)
        expected_return = self._scorer.compute_expected_return(stage, opp_score.overall)

        sim_analysis = self._compute_similarity(metrics)
        evidence = self._build_evidence(all_stage_results, symbol)
        red_flags = self._collect_red_flags(metrics)
        warnings = self._collect_warnings(all_stage_results)
        early_warnings = self._generate_early_warnings(all_stage_results, metrics)
        explanations = self._build_explanations(
            symbol, opp_score, stage, rating, all_stage_results,
        )

        elapsed = (time.perf_counter() - start) * 1000

        return OpportunityResult(
            symbol=symbol,
            opportunity_score=opp_score.overall,
            rating=rating,
            stage=stage,
            confidence=confidence,
            risk=risk_assessment,
            expected_window=window,
            expected_return=expected_return,
            evidence=evidence,
            similarity=sim_analysis,
            market_regime=market_regime,
            stage_results=all_stage_results,
            warnings=warnings,
            red_flags=red_flags,
            early_warnings=early_warnings,
            explanations=explanations,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
        )

    def _get_risk_stage(
        self,
        stage_results: list[StageResult],
    ) -> StageResult | None:
        for sr in stage_results:
            if sr.category == AnalysisCategory.RISK:
                return sr
        return None

    def _extract_risk(
        self,
        risk_stage: StageResult | None,
        metrics: dict,
    ) -> RiskAssessment:
        if risk_stage is None:
            return RiskAssessment(
                score=0.5,
                drawdown_probability=0.5,
                liquidity_risk=0.5,
                volatility_risk=0.5,
                sector_risk=0.5,
            )

        dd_prob = 0.3
        liq = 0.3
        vol = 0.3
        sec = 0.3

        dd = metrics.get("max_drawdown")
        if dd is not None:
            dd_prob = min(0.9, dd / 50)
        vr = metrics.get("volatility")
        if vr is not None:
            vol = min(0.9, vr / 60)
        rs = metrics.get("sector_relative_strength")
        if rs is not None:
            sec = max(0.1, 0.5 - rs / 20)

        return RiskAssessment(
            score=risk_stage.score,
            drawdown_probability=dd_prob,
            liquidity_risk=liq,
            volatility_risk=vol,
            sector_risk=sec,
            details=[w for sr in [risk_stage] for w in sr.warnings],
        )

    def _compute_similarity(self, metrics: dict) -> SimilarityAnalysis:
        return SimilarityAnalysis(
            score=metrics.get("similarity_score", 0.0),
            similar_symbols=metrics.get("similar_symbols", []),
            historical_success_rate=metrics.get("historical_success_rate", 0.0),
            timeline_match=metrics.get("similarity_timeline", ""),
            details="Similarity analysis completed",
        )

    def _build_evidence(
        self,
        stage_results: list[StageResult],
        symbol: str,
    ) -> EvidencePackage:
        items: list[EvidenceItem] = []
        for sr in stage_results:
            for signal in sr.signals:
                items.append(EvidenceItem(
                    category=sr.category.value,
                    finding=signal.description,
                    strength=signal.strength,
                    confidence=signal.confidence,
                    source=signal.name,
                ))

        score = 0.0
        if items:
            score = min(100.0, len(items) * 10)

        return EvidencePackage(
            items=items,
            score=score,
            summary=f"Evidence package for {symbol}: {len(items)} evidence items",
        )

    def _collect_red_flags(self, metrics: dict) -> list[RedFlag]:
        from modules.early_opportunity_engine.core.types import RedFlagType
        flags: list[RedFlag] = []

        vr = metrics.get("volume_ratio")
        if vr is not None and vr < 0.5:
            flags.append(RedFlag(
                flag_type=RedFlagType.WEAK_VOLUME,
                severity=min(1.0, (0.5 - vr) / 0.5),
                description=f"Weak volume: {vr:.1f}x average",
                metric="volume_ratio",
                value=vr,
            ))

        eg = metrics.get("earnings_growth")
        if eg is not None and eg < 0:
            flags.append(RedFlag(
                flag_type=RedFlagType.WEAK_EARNINGS,
                severity=min(1.0, abs(eg) / 20),
                description=f"Negative earnings growth: {eg:.1f}%",
                metric="earnings_growth",
                value=eg,
            ))

        debt = metrics.get("debt_to_equity")
        if debt is not None and debt > 2.0:
            flags.append(RedFlag(
                flag_type=RedFlagType.HIGH_DEBT,
                severity=min(1.0, (debt - 2) / 3),
                description=f"High D/E: {debt:.2f}",
                metric="debt_to_equity",
                value=debt,
            ))

        rsi = metrics.get("rsi")
        if rsi is not None and rsi > 75:
            flags.append(RedFlag(
                flag_type=RedFlagType.OVERBOUGHT,
                severity=min(1.0, (rsi - 75) / 25),
                description=f"Overbought: RSI {rsi:.1f}",
                metric="rsi",
                value=rsi,
            ))

        var_val = metrics.get("var_95")
        if var_val is not None and var_val > 8:
            flags.append(RedFlag(
                flag_type=RedFlagType.LIQUIDITY_RISK,
                severity=min(1.0, (var_val - 8) / 5),
                description=f"High VaR: {var_val:.1f}%",
                metric="var_95",
                value=var_val,
            ))

        obv = metrics.get("obv_trend")
        if obv is not None and obv < -1:
            flags.append(RedFlag(
                flag_type=RedFlagType.DISTRIBUTION,
                severity=min(1.0, abs(obv) / 3),
                description="Distribution detected (OBV declining)",
                metric="obv_trend",
                value=obv,
            ))

        momentum = metrics.get("momentum")
        close = metrics.get("close", 0)
        sma200 = metrics.get("sma_200")
        if momentum is not None and close and sma200:
            if close > sma200 * 1.3 and momentum < 0:
                flags.append(RedFlag(
                    flag_type=RedFlagType.LATE_TREND,
                    severity=0.6,
                    description="Price extended above 200-SMA with negative momentum",
                    metric="momentum",
                    value=momentum,
                ))

        return flags

    def _collect_warnings(self, stage_results: list[StageResult]) -> list[str]:
        warnings = []
        for sr in stage_results:
            warnings.extend(sr.warnings)
        return warnings

    def _generate_early_warnings(
        self,
        stage_results: list[StageResult],
        metrics: dict,
    ) -> list[EarlyWarning]:
        warnings: list[EarlyWarning] = []

        vol_result = None
        for sr in stage_results:
            if sr.category == AnalysisCategory.VOLUME:
                vol_result = sr
                break

        if vol_result and vol_result.score > 0.6:
            warnings.append(EarlyWarning(
                alert_type=AlertType.VOLUME,
                message="Significant volume activity detected",
                severity=vol_result.score,
            ))

        sm_result = None
        for sr in stage_results:
            if sr.category == AnalysisCategory.SMART_MONEY:
                sm_result = sr
                break

        if sm_result and sm_result.score > 0.6:
            warnings.append(EarlyWarning(
                alert_type=AlertType.SMART_MONEY,
                message="Smart money accumulation signals detected",
                severity=sm_result.score,
            ))

        tech_result = None
        for sr in stage_results:
            if sr.category == AnalysisCategory.TECHNICAL:
                tech_result = sr
                break

        if tech_result and tech_result.score > 0.7:
            warnings.append(EarlyWarning(
                alert_type=AlertType.MOMENTUM,
                message="Strong technical momentum detected",
                severity=tech_result.score,
            ))

        risk_result = None
        for sr in stage_results:
            if sr.category == AnalysisCategory.RISK:
                risk_result = sr
                break

        if risk_result and risk_result.score > 0.7:
            warnings.append(EarlyWarning(
                alert_type=AlertType.OPPORTUNITY,
                message="High opportunity score with favorable risk profile",
                severity=risk_result.score,
            ))

        if risk_result and risk_result.score > 0.6:
            warnings.append(EarlyWarning(
                alert_type=AlertType.RISK,
                message="Elevated risk detected - monitor closely",
                severity=risk_result.score,
            ))

        return warnings

    def _build_explanations(
        self,
        symbol: str,
        opp_score,
        stage: OpportunityStage,
        rating: OpportunityRating,
        stage_results: list[StageResult],
    ) -> list[str]:
        explanations = []

        explanations.append(
            f"{symbol} opportunity score: {opp_score.overall:.1f}/100 "
            f"(Rating: {rating.value}, Stage: {stage.value})"
        )

        explanations.append(
            f"Regime adjustment: {opp_score.regime_adjustment:.2f}x "
            f"(Financial: {opp_score.financial:.0f}, "
            f"Technical: {opp_score.technical:.0f}, "
            f"Volume: {opp_score.volume:.0f}, "
            f"SMC: {opp_score.smart_money:.0f})"
        )

        for sr in stage_results:
            if sr.score > 0.3:
                explanations.append(
                    f"{sr.category.value.title()} stage: "
                    f"score {sr.score:.2f} with {len(sr.signals)} signals"
                )

        if stage.value.startswith("stage_5") or stage.value.startswith("stage_6"):
            explanations.append(
                f"Stock is in breakout/trend expansion phase - "
                f"action window may be limited"
            )

        if stage.value.startswith("stage_1") or stage.value.startswith("stage_2"):
            explanations.append(
                f"Early stage detected - potential for significant upside "
                f"if thesis plays out"
            )

        return explanations
