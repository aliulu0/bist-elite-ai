from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from modules.market_regime_engine.cache.cache import RegimeCache
from modules.market_regime_engine.classification.engine import RegimeClassifier
from modules.market_regime_engine.core.types import (
    DetectionSignal,
    InvestmentHorizon,
    MarketRegime,
    RegimeAnalysisRequest,
    RegimeAnalysisResult,
    RegimeClassification,
    RegimeHistoryEntry,
    RegimeSignal,
    ReportType,
    SectorAnalysis,
    SectorStrength,
    get_risk_level,
    get_strategy_profile,
    _mean,
)
from modules.market_regime_engine.detectors.detectors import DETECTOR_MAP
from modules.market_regime_engine.history.tracker import RegimeHistoryTracker
from modules.market_regime_engine.reports.generator import ReportGenerator
from modules.market_regime_engine.validators.validator import RequestValidator, ResultValidator


class MarketRegimeService:
    """Orchestration layer for market regime analysis."""

    def __init__(
        self,
        classifier: Optional[RegimeClassifier] = None,
        history_tracker: Optional[RegimeHistoryTracker] = None,
        report_generator: Optional[ReportGenerator] = None,
        request_validator: Optional[RequestValidator] = None,
        result_validator: Optional[ResultValidator] = None,
        cache: Optional[RegimeCache] = None,
    ) -> None:
        self._classifier = classifier or RegimeClassifier()
        self._history_tracker = history_tracker or RegimeHistoryTracker()
        self._report_generator = report_generator or ReportGenerator()
        self._request_validator = request_validator or RequestValidator()
        self._result_validator = result_validator or ResultValidator()
        self._cache = cache or RegimeCache()
        self._analyses: List[RegimeAnalysisResult] = []

    def analyze(self, request: RegimeAnalysisRequest) -> RegimeAnalysisResult:
        start = time.time()
        errors = self._request_validator.validate(request)
        if errors:
            raise ValueError(f"Invalid request: {'; '.join(errors)}")

        cache_key = self._make_cache_key(request)
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        signals_to_use = request.signals or list(DetectionSignal)
        detected_signals: List[RegimeSignal] = []
        for sig_type in signals_to_use:
            detector_cls = DETECTOR_MAP.get(sig_type)
            if detector_cls:
                detector = detector_cls()
                signal = detector.detect(request.market_data)
                detected_signals.append(signal)

        history = self._history_tracker.get_history()
        classification = self._classifier.classify(detected_signals, history)

        sectors = self._analyze_sectors(request.sector_data) if request.include_sectors else []
        transitions = self._compute_transitions(classification, history) if request.include_transitions else []
        next_pred = self._classifier.compute_next_regime_prediction(classification, history)
        strategy = self._classifier.determine_strategy_profile(classification)
        risk_impl = self._compute_risk_implications(classification, strategy)

        entry = RegimeHistoryEntry(
            date=request.reference_date,
            regime=classification.regime,
            confidence=classification.confidence,
            score=classification.score,
            stability=classification.stability,
        )
        self._history_tracker.record(entry)

        result = RegimeAnalysisResult(
            request=request,
            classification=classification,
            sectors=sectors,
            transitions=transitions,
            history=self._history_tracker.get_history(),
            strategy_profile=strategy,
            risk_implications=risk_impl,
            next_regime_prediction=next_pred,
            execution_time_ms=(time.time() - start) * 1000,
        )

        self._analyses.append(result)
        self._cache.put(cache_key, result)
        return result

    def get_current(self) -> Optional[RegimeAnalysisResult]:
        if self._analyses:
            return self._analyses[-1]
        return None

    def get_history(self) -> List[Dict[str, Any]]:
        return [
            {
                "date": e.date,
                "regime": e.regime.value,
                "confidence": e.confidence,
                "score": e.score,
                "duration_days": e.duration_days,
            }
            for e in self._history_tracker.get_history()
        ]

    def get_sectors(self) -> List[Dict[str, Any]]:
        current = self.get_current()
        if not current:
            return []
        return [
            {
                "sector": s.sector_name,
                "strength": s.strength.value,
                "score": s.score,
                "relative_performance": s.relative_performance,
                "momentum": s.momentum,
            }
            for s in current.sectors
        ]

    def get_transitions(self) -> Dict[str, Any]:
        current = self.get_current()
        if not current:
            return {"transitions": [], "current_regime": None}
        transitions = []
        for t in current.transitions:
            transitions.append({
                "from": t.from_regime.value,
                "to": t.to_regime.value,
                "probability": t.probability,
                "type": t.transition_type.value,
            })
        return {
            "transitions": transitions,
            "current_regime": current.classification.regime.value,
            "predicted_next": current.next_regime_prediction.regime.value if current.next_regime_prediction else None,
        }

    def generate_report(
        self,
        report_type: ReportType = ReportType.CURRENT_REGIME,
    ) -> Dict[str, Any]:
        current = self.get_current()
        if current is None:
            return {"error": "No analysis available"}
        return self._report_generator.generate(current, report_type)

    def clear_cache(self) -> None:
        self._cache.clear()

    def get_cache_stats(self) -> Dict[str, Any]:
        return {
            "size": self._cache.size,
            "hits": self._cache.hits,
            "misses": self._cache.misses,
            "hit_rate": self._cache.hit_rate,
            "max_size": 256,
            "ttl_seconds": 3600.0,
        }

    def _analyze_sectors(
        self,
        sector_data: Dict[str, Dict[str, float]],
    ) -> List[SectorAnalysis]:
        sectors: List[SectorAnalysis] = []
        for name, data in sector_data.items():
            perf = data.get("performance", 0.0)
            momentum = data.get("momentum", 0.0)
            vol = data.get("volume_trend", 1.0)
            score = (perf + 1.0) / 2.0 * 0.5 + (momentum + 1.0) / 2.0 * 0.3 + min(vol / 2.0, 1.0) * 0.2
            if perf > 0.05 and momentum > 0.1:
                strength = SectorStrength.LEADING
            elif perf < -0.05 and momentum < -0.1:
                strength = SectorStrength.WEAK
            elif abs(perf) < 0.02:
                strength = SectorStrength.NEUTRAL
            else:
                strength = SectorStrength.ROTATING
            sectors.append(SectorAnalysis(
                sector_name=name,
                strength=strength,
                score=round(score, 4),
                relative_performance=perf,
                momentum=momentum,
                volume_trend=vol,
            ))
        return sectors

    def _compute_transitions(
        self,
        classification: RegimeClassification,
        history: List[RegimeHistoryEntry],
    ) -> list:
        from modules.market_regime_engine.core.types import RegimeTransition, TransitionType
        transitions = []
        for regime in MarketRegime:
            if regime != classification.regime:
                prob = classification.transition_probabilities.get(regime.value, 0.0)
                if prob > 0:
                    transitions.append(RegimeTransition(
                        from_regime=classification.regime,
                        to_regime=regime,
                        probability=prob,
                    ))
        transitions.sort(key=lambda t: t.probability, reverse=True)
        return transitions[:5]

    def _compute_risk_implications(
        self,
        classification: RegimeClassification,
        strategy: Any,
    ) -> Dict[str, Any]:
        risk = get_risk_level(classification.regime)
        return {
            "risk_level": risk,
            "regime": classification.regime.value,
            "strategy_profile": strategy.value if hasattr(strategy, "value") else str(strategy),
            "volatility_regime": "high" if risk > 0.7 else "normal" if risk > 0.4 else "low",
            "position_sizing": "reduce" if risk > 0.7 else "standard" if risk > 0.4 else "increase",
        }

    def _make_cache_key(self, request: RegimeAnalysisRequest) -> str:
        params = {
            "date": request.reference_date,
            "horizon": request.horizon.value,
            "lookback": request.lookback_days,
            "signals": [s.value for s in request.signals] if request.signals else [],
        }
        return self._cache.make_key(params)
