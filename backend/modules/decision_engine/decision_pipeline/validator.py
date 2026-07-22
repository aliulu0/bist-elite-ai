from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List

from modules.decision_engine.core.types import EngineOutput, DataSource


@dataclass
class ValidationResult:
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    missing_sources: List[str] = field(default_factory=list)
    score_anomalies: List[str] = field(default_factory=list)


class OutputValidator:
    """Validates consistency and quality of collected engine outputs."""

    SCORE_RANGE = (0.0, 100.0)
    CONFIDENCE_RANGE = (0.0, 100.0)
    MIN_REQUIRED_SOURCES = 3

    def validate(
        self, outputs: Dict[DataSource, EngineOutput]
    ) -> ValidationResult:
        errors: List[str] = []
        warnings: List[str] = []
        missing: List[str] = []
        anomalies: List[str] = []

        self._check_required_sources(outputs, missing, errors)
        self._check_score_ranges(outputs, anomalies, warnings)
        self._check_confidence_ranges(outputs, anomalies, warnings)
        self._check_score_consistency(outputs, warnings)
        self._check_source_count(outputs, warnings)

        is_valid = len(errors) == 0
        return ValidationResult(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            missing_sources=missing,
            score_anomalies=anomalies,
        )

    def _check_required_sources(
        self,
        outputs: Dict[DataSource, EngineOutput],
        missing: List[str],
        errors: List[str],
    ) -> None:
        required = {DataSource.UNIFIED_SCORING, DataSource.ELITE_SCORE, DataSource.CONFIDENCE}
        for source in required:
            if source not in outputs:
                missing.append(source.value)
                errors.append(f"Required source missing: {source.value}")

    def _check_score_ranges(
        self,
        outputs: Dict[DataSource, EngineOutput],
        anomalies: List[str],
        warnings: List[str],
    ) -> None:
        for source, output in outputs.items():
            if output.score < self.SCORE_RANGE[0] or output.score > self.SCORE_RANGE[1]:
                anomalies.append(
                    f"{source.value}: score {output.score} outside range {self.SCORE_RANGE}"
                )
                warnings.append(f"Score anomaly in {source.value}")

    def _check_confidence_ranges(
        self,
        outputs: Dict[DataSource, EngineOutput],
        anomalies: List[str],
        warnings: List[str],
    ) -> None:
        for source, output in outputs.items():
            if output.confidence < self.CONFIDENCE_RANGE[0] or output.confidence > self.CONFIDENCE_RANGE[1]:
                anomalies.append(
                    f"{source.value}: confidence {output.confidence} outside range {self.CONFIDENCE_RANGE}"
                )
                warnings.append(f"Confidence anomaly in {source.value}")

    def _check_score_consistency(
        self,
        outputs: Dict[DataSource, EngineOutput],
        warnings: List[str],
    ) -> None:
        scores = [o.score for o in outputs.values()]
        if len(scores) >= 3:
            mean = sum(scores) / len(scores)
            for source, output in outputs.items():
                if abs(output.score - mean) > 40:
                    warnings.append(
                        f"{source.value} score ({output.score:.1f}) deviates significantly from mean ({mean:.1f})"
                    )

    def _check_source_count(
        self,
        outputs: Dict[DataSource, EngineOutput],
        warnings: List[str],
    ) -> None:
        if len(outputs) < self.MIN_REQUIRED_SOURCES:
            warnings.append(
                f"Only {len(outputs)} sources available; recommended minimum is {self.MIN_REQUIRED_SOURCES}"
            )
