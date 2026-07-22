from __future__ import annotations

from typing import Any

from modules.plugin_system.interfaces import (
    PluginConfigField,
    PluginConfigSchema,
    PluginMeta,
    AIPlugin,
)

POSITIVE_WORDS = {
    "yükseldi", "artış", "kâr", "büyüme", "başarı", "rekor", "güçlü",
    "pozitif", "yükseliş", "karlı", "ihracat", "yatırım", "fırsat",
    "gained", "profit", "growth", "strong", "record", "positive", "surge",
}

NEGATIVE_WORDS = {
    "düştü", "kayıp", "zarar", "düşüş", "kriz", "risk", "zayıf",
    "negatif", "küçülme", "borç", "iflas", "çöküş", "kayıplı",
    "fell", "loss", "crisis", "risk", "weak", "negative", "crash", "debt",
}


class SentimentAnalyzerPlugin(AIPlugin):
    def __init__(self) -> None:
        meta = PluginMeta(
            name="sentiment_analyzer",
            version="1.0.0",
            author="BIST Elite AI",
            description="Basic text sentiment analyzer for financial news",
            category="ai",
        )
        config_schema = PluginConfigSchema(
            fields={
                "language": PluginConfigField(
                    field_type="str",
                    default="tr",
                    choices=("tr", "en"),
                    description="Text language",
                ),
            }
        )
        super().__init__(meta, config_schema)

    async def initialize(self, config: dict[str, Any]) -> bool:
        self.set_config(config)
        return True

    async def validate(self) -> bool:
        return True

    async def analyze(
        self,
        data: dict[str, Any],
        analysis_type: str = "default",
    ) -> dict[str, Any]:
        text = data.get("text", "").lower()
        if not text:
            return {"sentiment": "neutral", "score": 0.0, "details": {}}

        pos_count = sum(1 for w in POSITIVE_WORDS if w in text)
        neg_count = sum(1 for w in NEGATIVE_WORDS if w in text)
        total = pos_count + neg_count

        if total == 0:
            score = 0.0
        else:
            score = (pos_count - neg_count) / total

        if score > 0.2:
            sentiment = "positive"
        elif score < -0.2:
            sentiment = "negative"
        else:
            sentiment = "neutral"

        return {
            "sentiment": sentiment,
            "score": round(score, 4),
            "details": {
                "positive_words_found": pos_count,
                "negative_words_found": neg_count,
                "total_words_analyzed": total,
            },
        }

    async def shutdown(self) -> None:
        pass
