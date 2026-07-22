from modules.explainability_engine.core.types import (
    ExplanationType, ExplanationLevel, Language, SourceEngine, SignalDirection, EvidenceObject,
)
from modules.explainability_engine.builders.fundamental_builder import FundamentalExplanationBuilder
from modules.explainability_engine.builders.technical_builder import TechnicalExplanationBuilder
from modules.explainability_engine.builders.volume_builder import VolumeExplanationBuilder
from modules.explainability_engine.builders.pattern_builder import PatternExplanationBuilder
from modules.explainability_engine.builders.smart_money_builder import SmartMoneyExplanationBuilder
from modules.explainability_engine.builders.opportunity_builder import OpportunityExplanationBuilder
from modules.explainability_engine.builders.risk_builder import RiskExplanationBuilder
from modules.explainability_engine.builders.similarity_builder import SimilarityExplanationBuilder
from modules.explainability_engine.builders.conflict_builder import ConflictExplanationBuilder
from modules.explainability_engine.builders.explanation_builder import ExplanationBuilder
from modules.explainability_engine.evidence_mapper.mapper import EvidenceMapper


def _make_ev(ref, value, source, direction=SignalDirection.NEUTRAL, confidence=0.5, metric=""):
    return EvidenceObject(
        reference=ref, description=f"{ref} desc", source_engine=source,
        value=value, confidence=confidence, metric_name=metric or ref, direction=direction,
    )


class TestFundamentalBuilder:
    def setup_method(self):
        self.builder = FundamentalExplanationBuilder()
        self.mapper = EvidenceMapper()

    def test_name(self):
        assert self.builder.name == "fundamental_explanation"

    def test_explanation_type(self):
        assert self.builder.explanation_type == ExplanationType.FUNDAMENTAL

    def test_build_basic(self):
        metrics = {"pe_ratio": 15.0, "roe": 12.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="TUPRS")
        result = self.builder.build("TUPRS", metrics, evidence)
        assert result.symbol == "TUPRS"
        assert result.explanation_type == ExplanationType.FUNDAMENTAL
        assert len(result.sections) > 0

    def test_build_with_level(self):
        metrics = {"pe_ratio": 15.0, "roe": 12.0, "roa": 8.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="TEST")
        result = self.builder.build("TEST", metrics, evidence, level=ExplanationLevel.EXPERT)
        assert result.level == ExplanationLevel.EXPERT

    def test_build_turkish(self):
        metrics = {"pe_ratio": 15.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="TEST")
        result = self.builder.build("TEST", metrics, evidence, language=Language.TURKISH)
        assert result.language == Language.TURKISH

    def test_validate_input_valid(self):
        metrics = {"pe_ratio": 15.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        errors = self.builder.validate_input("TEST", metrics, evidence)
        assert len(errors) == 0

    def test_validate_input_empty_symbol(self):
        errors = self.builder.validate_input("", {"pe_ratio": 15.0}, [])
        assert len(errors) > 0

    def test_build_with_high_pe(self):
        metrics = {"pe_ratio": 50.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        result = self.builder.build("TEST", metrics, evidence)
        assert len(result.sections) > 0

    def test_build_with_low_pe(self):
        metrics = {"pe_ratio": 5.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        result = self.builder.build("TEST", metrics, evidence)
        assert len(result.sections) > 0

    def test_build_with_earnings_growth(self):
        metrics = {"earnings_growth": 25.0, "pe_ratio": 15.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        result = self.builder.build("TEST", metrics, evidence)
        assert result.evidence_count >= 0


class TestTechnicalBuilder:
    def setup_method(self):
        self.builder = TechnicalExplanationBuilder()
        self.mapper = EvidenceMapper()

    def test_name(self):
        assert self.builder.name == "technical_explanation"

    def test_build_basic(self):
        metrics = {"sma_50": 50.0, "sma_200": 45.0, "rsi": 55.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="TEST")
        result = self.builder.build("TEST", metrics, evidence)
        assert result.explanation_type == ExplanationType.TECHNICAL
        assert len(result.sections) > 0

    def test_build_with_rsi(self):
        metrics = {"rsi": 25.0, "sma_50": 50.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        result = self.builder.build("TEST", metrics, evidence)
        assert len(result.sections) >= 1

    def test_build_golden_cross(self):
        metrics = {"sma_50": 55.0, "sma_200": 45.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        result = self.builder.build("TEST", metrics, evidence)
        assert len(result.sections) >= 1

    def test_build_death_cross(self):
        metrics = {"sma_50": 40.0, "sma_200": 50.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        result = self.builder.build("TEST", metrics, evidence)
        assert len(result.sections) >= 1

    def test_validate_input_valid(self):
        metrics = {"sma_50": 50.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        errors = self.builder.validate_input("TEST", metrics, evidence)
        assert len(errors) == 0


class TestVolumeBuilder:
    def setup_method(self):
        self.builder = VolumeExplanationBuilder()
        self.mapper = EvidenceMapper()

    def test_name(self):
        assert self.builder.name == "volume_explanation"

    def test_build_basic(self):
        metrics = {"volume_ratio": 1.5, "obv_trend": 1.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="TEST")
        result = self.builder.build("TEST", metrics, evidence)
        assert result.explanation_type == ExplanationType.VOLUME
        assert len(result.sections) > 0

    def test_build_with_cmf(self):
        metrics = {"cmf": 0.15, "volume_ratio": 1.2}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        result = self.builder.build("TEST", metrics, evidence)
        assert len(result.sections) >= 1

    def test_validate_input_valid(self):
        metrics = {"volume_ratio": 1.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        errors = self.builder.validate_input("TEST", metrics, evidence)
        assert len(errors) == 0


class TestPatternBuilder:
    def setup_method(self):
        self.builder = PatternExplanationBuilder()
        self.mapper = EvidenceMapper()

    def test_name(self):
        assert self.builder.name == "pattern_explanation"

    def test_build_basic(self):
        metrics = {"classical_pattern_score": 75.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="TEST")
        result = self.builder.build("TEST", metrics, evidence)
        assert result.explanation_type == ExplanationType.PATTERN
        assert len(result.sections) > 0

    def test_validate_input_valid(self):
        metrics = {"classical_pattern_score": 50.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        errors = self.builder.validate_input("TEST", metrics, evidence)
        assert len(errors) == 0


class TestSmartMoneyBuilder:
    def setup_method(self):
        self.builder = SmartMoneyExplanationBuilder()
        self.mapper = EvidenceMapper()

    def test_name(self):
        assert self.builder.name == "smart_money_explanation"

    def test_build_basic(self):
        metrics = {"order_block": 1.0, "fair_value_gap": 1.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="TEST")
        result = self.builder.build("TEST", metrics, evidence)
        assert result.explanation_type == ExplanationType.SMART_MONEY
        assert len(result.sections) > 0

    def test_validate_input_valid(self):
        metrics = {"order_block": 1.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        errors = self.builder.validate_input("TEST", metrics, evidence)
        assert len(errors) == 0


class TestOpportunityBuilder:
    def setup_method(self):
        self.builder = OpportunityExplanationBuilder()
        self.mapper = EvidenceMapper()

    def test_name(self):
        assert self.builder.name == "opportunity_explanation"

    def test_build_basic(self):
        metrics = {"opportunity_score": 75.0, "opportunity_stage": 5}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="TEST")
        result = self.builder.build("TEST", metrics, evidence)
        assert result.explanation_type == ExplanationType.OPPORTUNITY
        assert len(result.sections) > 0

    def test_validate_input_valid(self):
        metrics = {"opportunity_score": 50.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        errors = self.builder.validate_input("TEST", metrics, evidence)
        assert len(errors) == 0


class TestRiskBuilder:
    def setup_method(self):
        self.builder = RiskExplanationBuilder()
        self.mapper = EvidenceMapper()

    def test_name(self):
        assert self.builder.name == "risk_explanation"

    def test_build_basic(self):
        metrics = {"volatility": 25.0, "max_drawdown": -15.0, "beta": 1.2}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="TEST")
        result = self.builder.build("TEST", metrics, evidence)
        assert result.explanation_type == ExplanationType.RISK
        assert len(result.sections) > 0

    def test_validate_input_valid(self):
        metrics = {"volatility": 25.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        errors = self.builder.validate_input("TEST", metrics, evidence)
        assert len(errors) == 0

    def test_build_generates_risks(self):
        metrics = {"volatility": 40.0, "max_drawdown": -25.0, "beta": 1.8}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        result = self.builder.build("TEST", metrics, evidence)
        assert isinstance(result.risks, list)


class TestSimilarityBuilder:
    def setup_method(self):
        self.builder = SimilarityExplanationBuilder()
        self.mapper = EvidenceMapper()

    def test_name(self):
        assert self.builder.name == "similarity_explanation"

    def test_build_basic(self):
        metrics = {"similarity_score": 85.0, "historical_success_rate": 0.7}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="TEST")
        result = self.builder.build("TEST", metrics, evidence)
        assert result.explanation_type == ExplanationType.HISTORICAL_SIMILARITY
        assert len(result.sections) > 0

    def test_validate_input_valid(self):
        metrics = {"similarity_score": 50.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics)
        errors = self.builder.validate_input("TEST", metrics, evidence)
        assert len(errors) == 0


class TestConflictBuilder:
    def setup_method(self):
        self.builder = ConflictExplanationBuilder()
        self.mapper = EvidenceMapper()

    def test_name(self):
        assert self.builder.name == "conflict_explanation"

    def test_build_basic(self):
        metrics = {"rsi": 25.0, "sma_50": 55.0, "sma_200": 45.0}
        evidence = self.mapper.map_metrics_to_evidence(metrics, symbol="TEST")
        result = self.builder.build("TEST", metrics, evidence)
        assert isinstance(result.conflicts, list)

    def test_validate_input_valid(self):
        errors = self.builder.validate_input("TEST", {}, [])
        assert len(errors) == 0


class TestExplanationBuilder:
    def setup_method(self):
        self.builder = ExplanationBuilder()

    def test_build_fundamental(self):
        metrics = {"pe_ratio": 15.0, "roe": 12.0}
        result = self.builder.build("TUPRS", metrics, ExplanationType.FUNDAMENTAL)
        assert result.symbol == "TUPRS"
        assert result.explanation_type == ExplanationType.FUNDAMENTAL
        assert len(result.sections) > 0
        assert result.evidence_count > 0
        assert result.generation_time_ms > 0

    def test_build_technical(self):
        metrics = {"sma_50": 50.0, "sma_200": 45.0, "rsi": 55.0}
        result = self.builder.build("TEST", metrics, ExplanationType.TECHNICAL)
        assert result.explanation_type == ExplanationType.TECHNICAL

    def test_build_volume(self):
        metrics = {"volume_ratio": 1.5}
        result = self.builder.build("TEST", metrics, ExplanationType.VOLUME)
        assert result.explanation_type == ExplanationType.VOLUME

    def test_build_pattern(self):
        metrics = {"classical_pattern_score": 75.0}
        result = self.builder.build("TEST", metrics, ExplanationType.PATTERN)
        assert result.explanation_type == ExplanationType.PATTERN

    def test_build_smart_money(self):
        metrics = {"order_block": 1.0}
        result = self.builder.build("TEST", metrics, ExplanationType.SMART_MONEY)
        assert result.explanation_type == ExplanationType.SMART_MONEY

    def test_build_opportunity(self):
        metrics = {"opportunity_score": 75.0}
        result = self.builder.build("TEST", metrics, ExplanationType.OPPORTUNITY)
        assert result.explanation_type == ExplanationType.OPPORTUNITY

    def test_build_risk(self):
        metrics = {"volatility": 25.0, "max_drawdown": -15.0}
        result = self.builder.build("TEST", metrics, ExplanationType.RISK)
        assert result.explanation_type == ExplanationType.RISK

    def test_build_similarity(self):
        metrics = {"similarity_score": 85.0}
        result = self.builder.build("TEST", metrics, ExplanationType.HISTORICAL_SIMILARITY)
        assert result.explanation_type == ExplanationType.HISTORICAL_SIMILARITY

    def test_build_elite_score(self):
        metrics = {"pe_ratio": 15.0, "rsi": 45.0, "volume_ratio": 1.0}
        result = self.builder.build("TEST", metrics, ExplanationType.ELITE_SCORE)
        assert result.explanation_type == ExplanationType.ELITE_SCORE

    def test_build_comprehensive(self):
        metrics = {"pe_ratio": 15.0, "rsi": 45.0, "volume_ratio": 1.0, "volatility": 25.0}
        result = self.builder.build_comprehensive("TEST", metrics)
        assert result.symbol == "TEST"
        assert len(result.sections) > 0

    def test_build_with_turkish(self):
        metrics = {"pe_ratio": 15.0}
        result = self.builder.build("TEST", metrics, ExplanationType.FUNDAMENTAL, language=Language.TURKISH)
        assert result.language == Language.TURKISH

    def test_build_with_expert_level(self):
        metrics = {"pe_ratio": 15.0, "roe": 12.0}
        result = self.builder.build("TEST", metrics, ExplanationType.FUNDAMENTAL, level=ExplanationLevel.EXPERT)
        assert result.level == ExplanationLevel.EXPERT

    def test_build_with_stage_results(self):
        class FakeCat:
            def __init__(self, v):
                self.value = v
        class FakeStage:
            def __init__(self, cat, score):
                self.category = FakeCat(cat)
                self.score = score
        metrics = {"pe_ratio": 15.0}
        stage_results = [FakeStage("financial", 0.75)]
        result = self.builder.build("TEST", metrics, ExplanationType.FUNDAMENTAL, stage_results=stage_results)
        assert result.evidence_count >= 0

    def test_build_market_regime(self):
        metrics = {"pe_ratio": 15.0}
        result = self.builder.build("TEST", metrics, ExplanationType.MARKET_REGIME)
        assert result.explanation_type == ExplanationType.MARKET_REGIME

    def test_build_confidence(self):
        metrics = {"pe_ratio": 15.0}
        result = self.builder.build("TEST", metrics, ExplanationType.CONFIDENCE)
        assert result.explanation_type == ExplanationType.CONFIDENCE

    def test_build_comprehensive_with_types(self):
        metrics = {"pe_ratio": 15.0, "rsi": 45.0}
        result = self.builder.build_comprehensive("TEST", metrics, explanation_types=[ExplanationType.FUNDAMENTAL])
        assert result.symbol == "TEST"

    def test_available_types(self):
        assert len(self.builder.available_types) >= 8
