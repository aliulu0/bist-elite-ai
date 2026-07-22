import pytest
from modules.early_opportunity_engine.core.types import AnalysisCategory, OpportunityStage
from modules.early_opportunity_engine.stages.financial_stage import FinancialAnalysisStage
from modules.early_opportunity_engine.stages.technical_stage import TechnicalAnalysisStage
from modules.early_opportunity_engine.stages.volume_stage import VolumeAnalysisStage
from modules.early_opportunity_engine.stages.smart_money_stage import SmartMoneyAnalysisStage
from modules.early_opportunity_engine.stages.pattern_stage import PatternAnalysisStage
from modules.early_opportunity_engine.stages.risk_stage import RiskAnalysisStage
from modules.early_opportunity_engine.stages.similarity_stage import SimilarityAnalysisStage


class TestFinancialStage:
    def setup_method(self):
        self.stage = FinancialAnalysisStage()

    def test_name(self):
        assert self.stage.name == "financial_analysis"

    def test_category(self):
        assert self.stage.category == AnalysisCategory.FINANCIAL

    def test_strong_metrics(self, strong_metrics):
        result = self.stage.analyze("TEST", strong_metrics)
        assert result.category == AnalysisCategory.FINANCIAL
        assert result.score > 0.0
        assert len(result.signals) > 0

    def test_weak_metrics(self, weak_metrics):
        result = self.stage.analyze("TEST", weak_metrics)
        assert result.score < 0.5

    def test_empty_metrics(self, empty_metrics):
        result = self.stage.analyze("TEST", empty_metrics)
        assert result.score == 0.0
        assert len(result.signals) == 0

    def test_minimal_metrics(self, minimal_metrics):
        result = self.stage.analyze("TEST", minimal_metrics)
        assert result.score >= 0.0

    def test_deep_value_pe(self):
        metrics = {"pe_ratio": 8.0, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert len(result.signals) >= 1
        assert result.score > 0.0

    def test_high_pe_penalty(self):
        metrics = {"pe_ratio": 50.0, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.warnings or result.score < 0.5

    def test_strong_roe(self):
        metrics = {"roe": 25.0, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_low_debt(self):
        metrics = {"debt_to_equity": 0.2, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_high_dividend(self):
        metrics = {"dividend_yield": 4.0, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_validate(self):
        errors = self.stage.validate({})
        assert len(errors) > 0

    def test_validate_with_data(self):
        errors = self.stage.validate({"pe_ratio": 10.0})
        assert len(errors) == 0


class TestTechnicalStage:
    def setup_method(self):
        self.stage = TechnicalAnalysisStage()

    def test_name(self):
        assert self.stage.name == "technical_analysis"

    def test_category(self):
        assert self.stage.category == AnalysisCategory.TECHNICAL

    def test_strong_metrics(self, strong_metrics):
        result = self.stage.analyze("TEST", strong_metrics)
        assert result.score > 0.3
        assert len(result.signals) > 0

    def test_weak_metrics(self, weak_metrics):
        result = self.stage.analyze("TEST", weak_metrics)
        assert result.score < 0.6

    def test_empty_metrics(self, empty_metrics):
        result = self.stage.analyze("TEST", empty_metrics)
        assert result.score == 0.0

    def test_oversold_rsi(self):
        metrics = {"rsi": 25.0, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_overbought_rsi(self):
        metrics = {"rsi": 80.0, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert any("overbought" in w.lower() for w in result.warnings)

    def test_golden_cross_zone(self):
        metrics = {"sma_50": 49.0, "sma_200": 48.0, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_validate(self):
        errors = self.stage.validate({})
        assert len(errors) > 0

    def test_validate_with_data(self):
        errors = self.stage.validate({"rsi": 50.0})
        assert len(errors) == 0


class TestVolumeStage:
    def setup_method(self):
        self.stage = VolumeAnalysisStage()

    def test_name(self):
        assert self.stage.name == "volume_analysis"

    def test_category(self):
        assert self.stage.category == AnalysisCategory.VOLUME

    def test_strong_metrics(self, strong_metrics):
        result = self.stage.analyze("TEST", strong_metrics)
        assert result.score > 0.3

    def test_weak_metrics(self, weak_metrics):
        result = self.stage.analyze("TEST", weak_metrics)
        assert result.score < 0.5

    def test_empty_metrics(self, empty_metrics):
        result = self.stage.analyze("TEST", empty_metrics)
        assert result.score == 0.0

    def test_volume_spike(self):
        metrics = {"volume_ratio": 3.0, "close": 50.0, "volume": 1000000}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_low_volume(self):
        metrics = {"volume_ratio": 0.3, "close": 50.0, "volume": 100000}
        result = self.stage.analyze("TEST", metrics)
        assert any("volume" in w.lower() for w in result.warnings)

    def test_validate(self):
        errors = self.stage.validate({})
        assert len(errors) > 0

    def test_validate_with_data(self):
        errors = self.stage.validate({"volume_ratio": 1.5})
        assert len(errors) == 0


class TestSmartMoneyStage:
    def setup_method(self):
        self.stage = SmartMoneyAnalysisStage()

    def test_name(self):
        assert self.stage.name == "smart_money_analysis"

    def test_category(self):
        assert self.stage.category == AnalysisCategory.SMART_MONEY

    def test_strong_signals(self, strong_metrics):
        result = self.stage.analyze("TEST", strong_metrics)
        assert result.score > 0.4

    def test_weak_signals(self, weak_metrics):
        result = self.stage.analyze("TEST", weak_metrics)
        assert result.score < 0.3

    def test_empty_metrics(self, empty_metrics):
        result = self.stage.analyze("TEST", empty_metrics)
        assert result.score == 0.0

    def test_order_block(self):
        metrics = {"order_block": True, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_fvg(self):
        metrics = {"fair_value_gap": True, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_bos(self):
        metrics = {"bos_bullish": True, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_discount_zone(self):
        metrics = {"in_discount_zone": True, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_validate(self):
        errors = self.stage.validate({})
        assert len(errors) > 0

    def test_validate_with_data(self):
        errors = self.stage.validate({"order_block": True})
        assert len(errors) == 0


class TestPatternStage:
    def setup_method(self):
        self.stage = PatternAnalysisStage()

    def test_name(self):
        assert self.stage.name == "pattern_analysis"

    def test_category(self):
        assert self.stage.category == AnalysisCategory.PATTERN

    def test_strong_patterns(self, strong_metrics):
        result = self.stage.analyze("TEST", strong_metrics)
        assert result.score > 0.2

    def test_weak_patterns(self, weak_metrics):
        result = self.stage.analyze("TEST", weak_metrics)
        assert result.score < 0.5

    def test_empty_metrics(self, empty_metrics):
        result = self.stage.analyze("TEST", empty_metrics)
        assert result.score == 0.0

    def test_double_bottom(self):
        metrics = {"double_bottom": True, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_bull_flag(self):
        metrics = {"bull_flag": True, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_bearish_warning(self):
        metrics = {"candlestick_bearish_score": 0.9, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert any("bear" in w.lower() for w in result.warnings)

    def test_validate(self):
        errors = self.stage.validate({})
        assert len(errors) > 0

    def test_validate_with_data(self):
        errors = self.stage.validate({"double_bottom": True})
        assert len(errors) == 0


class TestRiskStage:
    def setup_method(self):
        self.stage = RiskAnalysisStage()

    def test_name(self):
        assert self.stage.name == "risk_analysis"

    def test_category(self):
        assert self.stage.category == AnalysisCategory.RISK

    def test_low_risk(self, strong_metrics):
        result = self.stage.analyze("TEST", strong_metrics)
        assert result.score > 0.0

    def test_empty_metrics(self, empty_metrics):
        result = self.stage.analyze("TEST", empty_metrics)
        assert result.score >= 0.0

    def test_low_drawdown(self):
        metrics = {"max_drawdown": 5.0, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_high_drawdown_no_positive_signal(self):
        metrics = {"max_drawdown": 40.0, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score == 0.0
        assert "red flags" in result.details

    def test_good_sharpe(self):
        metrics = {"sharpe_ratio": 2.5, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_bad_sharpe_no_positive_signal(self):
        metrics = {"sharpe_ratio": -0.5, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score == 0.0

    def test_high_beta_warning(self):
        metrics = {"beta": 3.0, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert any("beta" in w.lower() for w in result.warnings)

    def test_reasonable_beta(self):
        metrics = {"beta": 0.9, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_validate(self):
        errors = self.stage.validate({})
        assert len(errors) > 0

    def test_validate_with_data(self):
        errors = self.stage.validate({"sharpe_ratio": 1.0})
        assert len(errors) == 0


class TestSimilarityStage:
    def setup_method(self):
        self.stage = SimilarityAnalysisStage()

    def test_name(self):
        assert self.stage.name == "similarity_analysis"

    def test_category(self):
        assert self.stage.category == AnalysisCategory.SIMILARITY

    def test_strong_match(self, strong_metrics):
        result = self.stage.analyze("TEST", strong_metrics)
        assert result.score >= 0.0

    def test_empty_metrics(self, empty_metrics):
        result = self.stage.analyze("TEST", empty_metrics)
        assert result.score == 0.0

    def test_high_similarity(self):
        metrics = {"similarity_score": 0.8, "close": 50.0}
        result = self.stage.analyze("TEST", metrics)
        assert result.score > 0.0

    def test_validate(self):
        errors = self.stage.validate({})
        assert isinstance(errors, list)
