from modules.explainability_engine.core.types import (
    ExplanationType, ExplanationLevel, Language, ExplanationCategory,
    SignalDirection, ConflictType, SeverityLevel, ReportFormat, SourceEngine,
    EvidenceObject, ExplanationSection, ConflictInfo, HistoricalContext,
    RiskSummary, ExplainabilityScore, ExplanationResult, ExplanationTemplate,
    ExplanationReport, LocalizedContent, BenchmarkResult,
)


class TestExplanationType:
    def test_all_values(self):
        assert len(ExplanationType) == 11

    def test_value(self):
        assert ExplanationType.OPPORTUNITY.value == "opportunity"
        assert ExplanationType.ELITE_SCORE.value == "elite_score"
        assert ExplanationType.RISK.value == "risk"
        assert ExplanationType.FUNDAMENTAL.value == "fundamental"
        assert ExplanationType.TECHNICAL.value == "technical"

    def test_from_string(self):
        assert ExplanationType("opportunity") == ExplanationType.OPPORTUNITY
        assert ExplanationType("risk") == ExplanationType.RISK


class TestExplanationLevel:
    def test_all_values(self):
        assert len(ExplanationLevel) == 4
        assert ExplanationLevel.SUMMARY.value == "summary"
        assert ExplanationLevel.DETAILED.value == "detailed"
        assert ExplanationLevel.EXPERT.value == "expert"
        assert ExplanationLevel.DEVELOPER.value == "developer"


class TestLanguage:
    def test_all_values(self):
        assert Language.ENGLISH.value == "en"
        assert Language.TURKISH.value == "tr"


class TestExplanationCategory:
    def test_all_values(self):
        assert ExplanationCategory.EXECUTIVE_SUMMARY.value == "executive_summary"
        assert ExplanationCategory.KEY_REASONS.value == "key_reasons"
        assert ExplanationCategory.SUPPORTING_EVIDENCE.value == "supporting_evidence"
        assert ExplanationCategory.POSITIVE_SIGNALS.value == "positive_signals"
        assert ExplanationCategory.NEGATIVE_SIGNALS.value == "negative_signals"
        assert ExplanationCategory.RED_FLAGS.value == "red_flags"
        assert ExplanationCategory.FINAL_CONCLUSION.value == "final_conclusion"
        assert ExplanationCategory.CONFLICT_EXPLANATION.value == "conflict_explanation"


class TestSignalDirection:
    def test_all_values(self):
        assert SignalDirection.POSITIVE.value == "positive"
        assert SignalDirection.NEGATIVE.value == "negative"
        assert SignalDirection.NEUTRAL.value == "neutral"


class TestConflictType:
    def test_all_values(self):
        assert ConflictType.INDICATOR_CONFLICT.value == "indicator_conflict"
        assert ConflictType.TREND_CONFLICT.value == "trend_conflict"
        assert ConflictType.SIGNAL_CONFLICT.value == "signal_conflict"
        assert ConflictType.WEAK_CONFIRMATION.value == "weak_confirmation"


class TestSeverityLevel:
    def test_all_values(self):
        assert SeverityLevel.CRITICAL.value == "critical"
        assert SeverityLevel.HIGH.value == "high"
        assert SeverityLevel.MEDIUM.value == "medium"
        assert SeverityLevel.LOW.value == "low"
        assert SeverityLevel.INFO.value == "info"


class TestReportFormat:
    def test_all_values(self):
        assert ReportFormat.JSON.value == "json"
        assert ReportFormat.HTML.value == "html"
        assert ReportFormat.MARKDOWN.value == "markdown"
        assert ReportFormat.TEXT.value == "text"
        assert ReportFormat.TELEGRAM.value == "telegram"


class TestSourceEngine:
    def test_all_values(self):
        assert len(SourceEngine) >= 10
        assert SourceEngine.FINANCIAL.value == "financial"
        assert SourceEngine.INDICATOR.value == "indicator"
        assert SourceEngine.MANUAL.value == "manual"


class TestEvidenceObject:
    def test_default(self):
        e = EvidenceObject(reference="pe_ratio", description="P/E ratio", source_engine=SourceEngine.FINANCIAL)
        assert e.reference == "pe_ratio"
        assert e.confidence == 0.0
        assert e.direction == SignalDirection.NEUTRAL

    def test_is_valid(self):
        e = EvidenceObject(reference="pe", description="P/E", source_engine=SourceEngine.FINANCIAL, confidence=0.8)
        assert e.is_valid() is True

    def test_is_invalid(self):
        e = EvidenceObject(reference="", description="", source_engine=SourceEngine.FINANCIAL)
        assert e.is_valid() is False


class TestExplanationSection:
    def test_default(self):
        s = ExplanationSection(title="PE Analysis", content="PE is fair", category=ExplanationCategory.SUPPORTING_EVIDENCE)
        assert s.title == "PE Analysis"
        assert s.strength == 0.0

    def test_has_evidence(self):
        s = ExplanationSection(title="T", content="C", category=ExplanationCategory.KEY_REASONS, evidence_refs=["ref1"])
        assert s.has_evidence is True

    def test_no_evidence(self):
        s = ExplanationSection(title="T", content="C", category=ExplanationCategory.KEY_REASONS)
        assert s.has_evidence is False


class TestConflictInfo:
    def test_default(self):
        c = ConflictInfo(conflict_type=ConflictType.TREND_CONFLICT, description="SMA up but ADX weak")
        assert c.severity == SeverityLevel.MEDIUM

    def test_is_critical(self):
        c = ConflictInfo(conflict_type=ConflictType.TREND_CONFLICT, description="d", severity=SeverityLevel.CRITICAL)
        assert c.is_critical is True


class TestRiskSummary:
    def test_default(self):
        r = RiskSummary(description="High volatility", risk_type="volatility")
        assert r.severity == SeverityLevel.MEDIUM

    def test_risk_score(self):
        r = RiskSummary(description="d", risk_type="vol", severity=SeverityLevel.CRITICAL, probability=0.8, impact=0.9)
        assert r.risk_score > 0


class TestExplainabilityScore:
    def test_default(self):
        s = ExplainabilityScore()
        assert s.overall == 0.0

    def test_overall(self):
        s = ExplainabilityScore(explainability=80.0, coverage=60.0, transparency=40.0, evidence_quality=20.0)
        assert s.overall == 50.0


class TestExplanationResult:
    def test_default(self):
        r = ExplanationResult(symbol="TUPRS", explanation_type=ExplanationType.ELITE_SCORE,
                             level=ExplanationLevel.DETAILED, language=Language.ENGLISH)
        assert r.symbol == "TUPRS"
        assert r.total_sections == 0
        assert r.has_conflicts is False
        assert r.critical_risks == []


class TestLocalizedContent:
    def test_format_content(self):
        lc = LocalizedContent(language=Language.ENGLISH, key="pe_analysis", content="P/E is {value}")
        assert lc.format_content(value="15.0") == "P/E is 15.0"

    def test_format_content_missing_key(self):
        lc = LocalizedContent(language=Language.ENGLISH, key="pe", content="P/E is {missing}")
        assert lc.format_content() == "P/E is {missing}"


class TestBenchmarkResult:
    def test_default(self):
        b = BenchmarkResult()
        assert b.iterations == 0
        assert b.avg_ms == 0.0
