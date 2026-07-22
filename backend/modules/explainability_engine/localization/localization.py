from __future__ import annotations

from modules.explainability_engine.core.types import Language


class LocalizationService:

    def __init__(self) -> None:
        self._translations = self._build_translations()

    def translate(self, key: str, language: Language = Language.ENGLISH, **kwargs) -> str:
        lang_dict = self._translations.get(language, {})
        template = lang_dict.get(key, key)
        try:
            return template.format(**kwargs)
        except (KeyError, IndexError):
            return template

    def get_supported_languages(self) -> list[str]:
        return [lang.value for lang in self._translations.keys()]

    def add_language(self, language: Language, translations: dict[str, str]) -> None:
        self._translations[language] = translations

    def get_all_keys(self, language: Language = Language.ENGLISH) -> list[str]:
        return list(self._translations.get(language, {}).keys())

    def _build_translations(self) -> dict[Language, dict[str, str]]:
        return {
            Language.ENGLISH: {
                "executive_summary": "Executive Summary",
                "key_reasons": "Key Reasons",
                "supporting_evidence": "Supporting Evidence",
                "positive_signals": "Positive Signals",
                "negative_signals": "Negative Signals",
                "red_flags": "Red Flags",
                "missing_confirmations": "Missing Confirmations",
                "historical_context": "Historical Context",
                "expected_scenario": "Expected Scenario",
                "risk_summary": "Risk Summary",
                "final_conclusion": "Final Conclusion",
                "conflict_explanation": "Conflict Explanation",
                "valuation_analysis": "Valuation Analysis",
                "profitability_analysis": "Profitability Analysis",
                "growth_analysis": "Growth Analysis",
                "financial_health": "Financial Health",
                "trend_analysis": "Trend Analysis",
                "momentum_analysis": "Momentum Analysis",
                "crossover_signals": "Crossover Signals",
                "volume_analysis": "Volume Analysis",
                "money_flow_analysis": "Money Flow Analysis",
                "accumulation_distribution": "Accumulation/Distribution",
                "detected_patterns": "Detected Patterns",
                "pattern_direction": "Pattern Direction",
                "smart_money_indicators": "Smart Money Indicators",
                "detection_details": "Detection Details",
                "opportunity_overview": "Opportunity Overview",
                "reasons_for_selection": "Reasons For Selection",
                "reasons_against_selection": "Reasons Against Selection",
                "volatility_risk": "Volatility Risk",
                "drawdown_risk": "Drawdown Risk",
                "market_risk": "Market Risk",
                "historical_similarity": "Historical Similarity",
                "similar_historical_situations": "Most Similar Historical Situations",
                "historical_outcomes": "Historical Outcomes",
                "lessons_learned": "Lessons Learned",
                "indicator_consensus": "Indicator Consensus",
                "conflicting_indicators": "Conflicting Indicators",
                "weak_confirmations": "Weak Confirmations",
                "no_data": "No data available",
                "analysis_of": "Analysis of {symbol}",
                "positive_signals_count": "{count} positive signals detected",
                "negative_signals_count": "{count} negative signals detected",
                "opportunity_score": "Opportunity score: {score}/100",
                "high_risk_identified": "{count} high-priority risk(s) identified",
                "conflicts_detected": "{count} indicator conflict(s) detected",
            },
            Language.TURKISH: {
                "executive_summary": "Yönetici Özeti",
                "key_reasons": "Temel Nedenler",
                "supporting_evidence": "Destekleyici Kanıtlar",
                "positive_signals": "Olumlu Sinyaller",
                "negative_signals": "Olumsuz Sinyaller",
                "red_flags": "Kırmızı Bayraklar",
                "missing_confirmations": "Eksik Doğrulamalar",
                "historical_context": "Tarihsel Bağlam",
                "expected_scenario": "Beklenen Senaryo",
                "risk_summary": "Risk Özeti",
                "final_conclusion": "Sonuç",
                "conflict_explanation": "Çelişki Açıklaması",
                "valuation_analysis": "Değerleme Analizi",
                "profitability_analysis": "Karlılık Analizi",
                "growth_analysis": "Büyüme Analizi",
                "financial_health": "Finansal Sağlık",
                "trend_analysis": "Trend Analizi",
                "momentum_analysis": "Momentum Analizi",
                "crossover_signals": "Kesişim Sinyalleri",
                "volume_analysis": "Hacim Analizi",
                "money_flow_analysis": "Para Akışı Analizi",
                "accumulation_distribution": "Birikim/Dağılım",
                "detected_patterns": "Tespit Edilen Formasyonlar",
                "pattern_direction": "Formasyon Yönü",
                "smart_money_indicators": "Akıllı Para Göstergeleri",
                "detection_details": "Tespit Detayları",
                "opportunity_overview": "Fırsat Genel Bakışı",
                "reasons_for_selection": "Seçim Nedenleri",
                "reasons_against_selection": "Seçim Karşıtı Nedenler",
                "volatility_risk": "Volatilite Riski",
                "drawdown_risk": "Drawdown Riski",
                "market_risk": "Piyasa Riski",
                "historical_similarity": "Tarihsel Benzerlik",
                "similar_historical_situations": "En Benzer Tarihsel Durumlar",
                "historical_outcomes": "Tarihsel Sonuçlar",
                "lessons_learned": "Çıkarılan Dersler",
                "indicator_consensus": "Gösterge Uzlaşması",
                "conflicting_indicators": "Çelişkili Göstergeler",
                "weak_confirmations": "Zayıf Doğrulamalar",
                "no_data": "Veri mevcut değil",
                "analysis_of": "{symbol} Analizi",
                "positive_signals_count": "{count} olumlu sinyal tespit edildi",
                "negative_signals_count": "{count} olumsuz sinyal tespit edildi",
                "opportunity_score": "Fırsat puanı: {score}/100",
                "high_risk_identified": "{count} yüksek öncelikli risk belirlendi",
                "conflicts_detected": "{count} gösterge çelişkisi tespit edildi",
            },
        }
