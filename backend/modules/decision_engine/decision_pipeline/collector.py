from __future__ import annotations

from typing import Any, Dict, List, Optional

from modules.decision_engine.core.types import EngineOutput, DataSource


class EngineOutputCollector:
    """Collects and organizes outputs from all input engines."""

    REQUIRED_SOURCES = {
        DataSource.UNIFIED_SCORING,
        DataSource.ELITE_SCORE,
        DataSource.CONFIDENCE,
    }

    OPTIONAL_SOURCES = {
        DataSource.EARLY_OPPORTUNITY,
        DataSource.EVIDENCE,
        DataSource.EXPLAINABILITY,
        DataSource.RISK,
        DataSource.FINANCIAL,
        DataSource.PATTERN,
        DataSource.STRATEGY,
        DataSource.SIMILARITY,
        DataSource.MARKET_REGIME,
    }

    def __init__(self) -> None:
        self._outputs: Dict[DataSource, EngineOutput] = {}
        self._raw_data: Dict[str, Any] = {}

    def collect(self, engine_data: Dict[str, Any]) -> Dict[DataSource, EngineOutput]:
        self._raw_data = dict(engine_data)
        self._outputs.clear()

        for source in DataSource:
            key = source.value
            if key in engine_data:
                data = engine_data[key]
                if isinstance(data, dict):
                    self._outputs[source] = EngineOutput(
                        source=source,
                        score=float(data.get("score", 0.0)),
                        confidence=float(data.get("confidence", 0.0)),
                        signals=data.get("signals", {}),
                        metadata=data.get("metadata", {}),
                        timestamp=data.get("timestamp"),
                    )
                elif isinstance(data, EngineOutput):
                    self._outputs[source] = data

        return dict(self._outputs)

    def get(self, source: DataSource) -> Optional[EngineOutput]:
        return self._outputs.get(source)

    def get_score(self, source: DataSource, default: float = 0.0) -> float:
        output = self._outputs.get(source)
        return output.score if output else default

    def get_confidence(self, source: DataSource, default: float = 0.0) -> float:
        output = self._outputs.get(source)
        return output.confidence if output else default

    def has_required(self) -> bool:
        return self.REQUIRED_SOURCES.issubset(self._outputs.keys())

    def missing_required(self) -> List[DataSource]:
        return list(self.REQUIRED_SOURCES - self._outputs.keys())

    def available_sources(self) -> List[DataSource]:
        return list(self._outputs.keys())

    def all_scores(self) -> Dict[str, float]:
        return {s.value: o.score for s, o in self._outputs.items()}

    def all_confidences(self) -> Dict[str, float]:
        return {s.value: o.confidence for s, o in self._outputs.items()}

    def average_score(self) -> float:
        if not self._outputs:
            return 0.0
        return sum(o.score for o in self._outputs.values()) / len(self._outputs)

    def average_confidence(self) -> float:
        if not self._outputs:
            return 0.0
        return sum(o.confidence for o in self._outputs.values()) / len(self._outputs)

    def clear(self) -> None:
        self._outputs.clear()
        self._raw_data.clear()

    def count(self) -> int:
        return len(self._outputs)
