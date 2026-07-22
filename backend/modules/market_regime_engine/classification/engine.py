from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.market_regime_engine.core.types import (
    DetectionSignal,
    MarketRegime,
    RegimeClassification,
    RegimeHistoryEntry,
    RegimeSignal,
    StrategyProfile,
    TransitionType,
    classify_regime,
    compute_stability,
    compute_transition_probability,
    get_strategy_profile,
    _mean,
)


class RegimeClassifier:
    """Classifies market regime from detection signals."""

    def __init__(self) -> None:
        self._default_weights: Dict[DetectionSignal, float] = {
            DetectionSignal.MOVING_AVERAGE_STRUCTURE: 1.5,
            DetectionSignal.BREADTH_INDICATORS: 1.3,
            DetectionSignal.VOLATILITY: 1.2,
            DetectionSignal.MOMENTUM: 1.4,
            DetectionSignal.TREND_STRENGTH: 1.3,
            DetectionSignal.VOLUME_EXPANSION: 1.0,
            DetectionSignal.SECTOR_ROTATION: 1.1,
            DetectionSignal.LIQUIDITY: 0.8,
            DetectionSignal.MARKET_PARTICIPATION: 1.2,
        }

    def classify(
        self,
        signals: List[RegimeSignal],
        history: Optional[List[RegimeHistoryEntry]] = None,
    ) -> RegimeClassification:
        if not signals:
            return RegimeClassification()

        weighted_sum = 0.0
        total_weight = 0.0
        confidences = []
        contributing: Dict[str, float] = {}

        for s in signals:
            w = s.weight * self._default_weights.get(s.signal_type, 1.0)
            weighted_sum += s.normalized_value * w
            total_weight += w
            confidences.append(s.confidence)
            contributing[s.signal_type.value] = round(s.normalized_value, 4)

        score = weighted_sum / total_weight if total_weight > 0 else 0.5
        regime = classify_regime(score)
        avg_confidence = _mean(confidences)

        recent_regimes = [e.regime for e in (history or [])]
        stability = compute_stability(recent_regimes)

        transition_probs = self._compute_transitions(regime, history)

        return RegimeClassification(
            regime=regime,
            confidence=round(avg_confidence, 4),
            score=round(score, 4),
            stability=round(stability, 4),
            transition_probabilities=transition_probs,
            signals=signals,
            contributing_signals=contributing,
        )

    def classify_from_market_data(
        self,
        market_data: Dict[str, float],
        signals: Optional[List[DetectionSignal]] = None,
        history: Optional[List[RegimeHistoryEntry]] = None,
    ) -> RegimeClassification:
        from modules.market_regime_engine.detectors.detectors import DETECTOR_MAP

        signals_to_use = signals or list(DetectionSignal)
        detected_signals: List[RegimeSignal] = []

        for sig_type in signals_to_use:
            detector_cls = DETECTOR_MAP.get(sig_type)
            if detector_cls:
                detector = detector_cls()
                signal = detector.detect(market_data)
                detected_signals.append(signal)

        return self.classify(detected_signals, history)

    def compute_next_regime_prediction(
        self,
        current: RegimeClassification,
        history: Optional[List[RegimeHistoryEntry]] = None,
    ) -> Optional[RegimeClassification]:
        if not current.transition_probabilities:
            return None
        best_transition = max(
            current.transition_probabilities.items(),
            key=lambda x: x[1],
        )
        next_regime_str = best_transition[0]
        try:
            next_regime = MarketRegime(next_regime_str)
        except ValueError:
            return None
        return RegimeClassification(
            regime=next_regime,
            confidence=best_transition[1],
            score=0.5,
            stability=0.0,
        )

    def determine_strategy_profile(
        self,
        classification: RegimeClassification,
    ) -> StrategyProfile:
        return get_strategy_profile(classification.regime)

    def _compute_transitions(
        self,
        current: MarketRegime,
        history: Optional[List[RegimeHistoryEntry]],
    ) -> Dict[str, float]:
        transitions: Dict[str, float] = {}
        if not history:
            for regime in MarketRegime:
                if regime != current:
                    transitions[regime.value] = 0.1
            total = sum(transitions.values())
            if total > 0:
                for k in transitions:
                    transitions[k] = round(transitions[k] / total, 4)
            return transitions

        for regime in MarketRegime:
            if regime != current:
                prob = compute_transition_probability(current, regime, history)
                if prob > 0:
                    transitions[regime.value] = round(prob, 4)

        if not transitions:
            for regime in MarketRegime:
                if regime != current:
                    transitions[regime.value] = 0.05
            total = sum(transitions.values())
            if total > 0:
                for k in transitions:
                    transitions[k] = round(transitions[k] / total, 4)

        return transitions
