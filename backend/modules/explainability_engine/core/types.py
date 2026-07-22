from __future__ import annotations

from enum import Enum
from dataclasses import dataclass, field


class ExplanationType(str, Enum):
    OPPORTUNITY = "opportunity"
    ELITE_SCORE = "elite_score"
    RISK = "risk"
    CONFIDENCE = "confidence"
    FUNDAMENTAL = "fundamental"
    TECHNICAL = "technical"
    VOLUME = "volume"
    PATTERN = "pattern"
    SMART_MONEY = "smart_money"
    MARKET_REGIME = "market_regime"
    HISTORICAL_SIMILARITY = "historical_similarity"


class ExplanationLevel(str, Enum):
    SUMMARY = "summary"
    DETAILED = "detailed"
    EXPERT = "expert"
    DEVELOPER = "developer"


class Language(str, Enum):
    ENGLISH = "en"
    TURKISH = "tr"


class ExplanationCategory(str, Enum):
    EXECUTIVE_SUMMARY = "executive_summary"
    KEY_REASONS = "key_reasons"
    SUPPORTING_EVIDENCE = "supporting_evidence"
    POSITIVE_SIGNALS = "positive_signals"
    NEGATIVE_SIGNALS = "negative_signals"
    RED_FLAGS = "red_flags"
    MISSING_CONFIRMATIONS = "missing_confirmations"
    HISTORICAL_CONTEXT = "historical_context"
    EXPECTED_SCENARIO = "expected_scenario"
    RISK_SUMMARY = "risk_summary"
    FINAL_CONCLUSION = "final_conclusion"
    CONFLICT_EXPLANATION = "conflict_explanation"


class SignalDirection(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class ConflictType(str, Enum):
    INDICATOR_CONFLICT = "indicator_conflict"
    TREND_CONFLICT = "trend_conflict"
    SIGNAL_CONFLICT = "signal_conflict"
    WEAK_CONFIRMATION = "weak_confirmation"


class SeverityLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class ReportFormat(str, Enum):
    JSON = "json"
    MARKDOWN = "markdown"
    HTML = "html"
    TEXT = "text"
    TELEGRAM = "telegram"


class SourceEngine(str, Enum):
    FINANCIAL = "financial"
    INDICATOR = "indicator"
    MOMENTUM = "momentum"
    TREND = "trend"
    VOLUME = "volume"
    PATTERN = "pattern"
    STRATEGY = "strategy"
    EARLY_OPPORTUNITY = "early_opportunity"
    EVIDENCE = "evidence"
    RISK = "risk"
    SIMILARITY = "similarity"
    MANUAL = "manual"


@dataclass
class EvidenceObject:
    reference: str
    description: str
    source_engine: SourceEngine
    value: float = 0.0
    confidence: float = 0.0
    timestamp: str = ""
    metric_name: str = ""
    direction: SignalDirection = SignalDirection.NEUTRAL
    metadata: dict = field(default_factory=dict)

    def is_valid(self) -> bool:
        return bool(self.reference) and bool(self.description) and self.confidence > 0


@dataclass
class ExplanationSection:
    title: str
    content: str
    category: ExplanationCategory
    evidence_refs: list[str] = field(default_factory=list)
    subsections: list[ExplanationSection] = field(default_factory=list)
    signals: list[SignalDirection] = field(default_factory=list)
    strength: float = 0.0
    confidence: float = 0.0

    @property
    def has_evidence(self) -> bool:
        return len(self.evidence_refs) > 0


@dataclass
class ConflictInfo:
    conflict_type: ConflictType
    description: str
    involved_indicators: list[str] = field(default_factory=list)
    severity: SeverityLevel = SeverityLevel.MEDIUM
    recommendation: str = ""

    @property
    def is_critical(self) -> bool:
        return self.severity in (SeverityLevel.CRITICAL, SeverityLevel.HIGH)


@dataclass
class HistoricalContext:
    similar_situations: list[str] = field(default_factory=list)
    historical_outcomes: list[str] = field(default_factory=list)
    lessons_learned: list[str] = field(default_factory=list)
    similarity_score: float = 0.0
    success_rate: float = 0.0


@dataclass
class RiskSummary:
    description: str
    risk_type: str
    severity: SeverityLevel = SeverityLevel.MEDIUM
    probability: float = 0.0
    impact: float = 0.0
    mitigation: str = ""

    @property
    def risk_score(self) -> float:
        sev_mult = {
            SeverityLevel.CRITICAL: 1.0,
            SeverityLevel.HIGH: 0.8,
            SeverityLevel.MEDIUM: 0.5,
            SeverityLevel.LOW: 0.3,
            SeverityLevel.INFO: 0.1,
        }
        return sev_mult.get(self.severity, 0.5) * self.probability * self.impact


@dataclass
class ExplainabilityScore:
    explainability: float = 0.0
    coverage: float = 0.0
    transparency: float = 0.0
    evidence_quality: float = 0.0

    @property
    def overall(self) -> float:
        return (self.explainability + self.coverage + self.transparency + self.evidence_quality) / 4.0


@dataclass
class ExplanationResult:
    symbol: str
    explanation_type: ExplanationType
    level: ExplanationLevel
    language: Language
    sections: list[ExplanationSection] = field(default_factory=list)
    conflicts: list[ConflictInfo] = field(default_factory=list)
    historical_context: HistoricalContext = field(default_factory=HistoricalContext)
    risks: list[RiskSummary] = field(default_factory=list)
    scores: ExplainabilityScore = field(default_factory=ExplainabilityScore)
    evidence_count: int = 0
    evidence_quality_avg: float = 0.0
    timestamp: str = ""
    generation_time_ms: float = 0.0
    metadata: dict = field(default_factory=dict)

    @property
    def total_sections(self) -> int:
        count = len(self.sections)
        for s in self.sections:
            count += len(s.subsections)
        return count

    @property
    def has_conflicts(self) -> bool:
        return len(self.conflicts) > 0

    @property
    def critical_risks(self) -> list[RiskSummary]:
        return [r for r in self.risks if r.severity in (SeverityLevel.CRITICAL, SeverityLevel.HIGH)]


@dataclass
class ExplanationTemplate:
    name: str
    explanation_type: ExplanationType
    level: ExplanationLevel
    language: Language
    sections: list[str] = field(default_factory=list)
    required_evidence: list[str] = field(default_factory=list)
    optional_evidence: list[str] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)


@dataclass
class ExplanationReport:
    symbol: str
    format: ReportFormat
    executive_summary: str = ""
    detailed_sections: list[ExplanationSection] = field(default_factory=list)
    investment_thesis: str = ""
    evidence_table: list[list[str]] = field(default_factory=list)
    risk_table: list[list[str]] = field(default_factory=list)
    opportunity_table: list[list[str]] = field(default_factory=list)
    scores: ExplainabilityScore = field(default_factory=ExplainabilityScore)
    conflicts: list[ConflictInfo] = field(default_factory=list)
    timestamp: str = ""


@dataclass
class LocalizedContent:
    key: str
    language: Language
    content: str
    parameters: dict = field(default_factory=dict)

    def format_content(self, **kwargs) -> str:
        try:
            return self.content.format(**kwargs)
        except (KeyError, IndexError):
            return self.content


@dataclass
class BenchmarkResult:
    iterations: int = 0
    total_seconds: float = 0.0
    avg_ms: float = 0.0
    ops_per_second: float = 0.0
    memory_bytes: int = 0
    strategy_name: str = ""
