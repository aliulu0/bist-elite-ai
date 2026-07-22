from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class EvidenceObjectSchema(BaseModel):
    reference: str
    description: str
    source_engine: str
    value: float = 0.0
    confidence: float = Field(ge=0, le=1, default=0.0)
    timestamp: str = ""
    metric_name: str = ""
    direction: str = "neutral"


class ExplanationSectionSchema(BaseModel):
    title: str
    content: str
    category: str
    evidence_refs: list[str] = Field(default_factory=list)
    strength: float = 0.0
    confidence: float = 0.0


class ConflictInfoSchema(BaseModel):
    conflict_type: str
    description: str
    involved_indicators: list[str] = Field(default_factory=list)
    severity: str = "medium"
    recommendation: str = ""


class RiskSummarySchema(BaseModel):
    description: str
    risk_type: str
    severity: str = "medium"
    probability: float = 0.0
    impact: float = 0.0
    mitigation: str = ""


class ExplainabilityScoreSchema(BaseModel):
    explainability: float = 0.0
    coverage: float = 0.0
    transparency: float = 0.0
    evidence_quality: float = 0.0
    overall: float = 0.0


class ExplanationResultSchema(BaseModel):
    symbol: str
    explanation_type: str
    level: str
    language: str
    sections: list[ExplanationSectionSchema] = Field(default_factory=list)
    conflicts: list[ConflictInfoSchema] = Field(default_factory=list)
    risks: list[RiskSummarySchema] = Field(default_factory=list)
    scores: ExplainabilityScoreSchema = Field(default_factory=ExplainabilityScoreSchema)
    evidence_count: int = 0
    evidence_quality_avg: float = 0.0
    timestamp: str = ""
    generation_time_ms: float = 0.0


class GenerateExplanationRequest(BaseModel):
    symbol: str
    metrics: dict
    explanation_type: str = "elite_score"
    level: str = "detailed"
    language: str = "en"
    stage_results: list[dict] = Field(default_factory=list)


class GenerateComprehensiveRequest(BaseModel):
    symbol: str
    metrics: dict
    level: str = "detailed"
    language: str = "en"
    stage_results: list[dict] = Field(default_factory=list)
    explanation_types: list[str] = Field(default_factory=list)


class ExplanationSummaryResponse(BaseModel):
    symbol: str
    explanation_type: str
    level: str
    language: str
    section_count: int
    evidence_count: int
    conflict_count: int
    risk_count: int
    scores: ExplainabilityScoreSchema
    generation_time_ms: float = 0.0


class ExplanationDetailResponse(BaseModel):
    result: ExplanationResultSchema


class ExplanationReportResponse(BaseModel):
    symbol: str
    format: str = "json"
    executive_summary: str = ""
    sections: list[ExplanationSectionSchema] = Field(default_factory=list)
    investment_thesis: str = ""
    scores: ExplainabilityScoreSchema
    conflicts: list[ConflictInfoSchema] = Field(default_factory=list)
    timestamp: str = ""


class ExplanationHistoryEntry(BaseModel):
    symbol: str
    explanation_type: str
    level: str
    evidence_count: int
    generation_time_ms: float
    timestamp: str


class ExplanationHistoryResponse(BaseModel):
    history: list[ExplanationHistoryEntry]
    total: int = 0


class ExplanationListResponse(BaseModel):
    results: list[ExplanationResultSchema]
    total: int = 0


class ValidateExplanationRequest(BaseModel):
    symbol: str
    metrics: dict
    explanation_type: str = "elite_score"


class ValidateExplanationResponse(BaseModel):
    valid: bool
    errors: list[str] = Field(default_factory=list)
    evidence_count: int = 0
    message: str = ""


class CacheStatsResponse(BaseModel):
    size: int
    hits: int
    misses: int
    hit_rate: float
    ttl: int
    max_size: int


class BenchmarkResponse(BaseModel):
    iterations: int
    avg_ms: float
    ops_per_second: float
    total_seconds: float
    summary: dict = Field(default_factory=dict)
