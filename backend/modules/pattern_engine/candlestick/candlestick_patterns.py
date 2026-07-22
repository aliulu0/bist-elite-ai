from __future__ import annotations

from modules.pattern_engine.core.base import BasePatternPlugin
from modules.pattern_engine.core.types import (
    PriceBar, PatternResult, PatternCategory, PatternDirection, PatternStatus,
)
from modules.pattern_engine.analysis.analysis_tools import BodyCalculator


class HammerPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "hammer"
    @property
    def display_name(self) -> str: return "Hammer"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 5
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 5:
            return results
        bar = prices[-1]
        rng = BodyCalculator.total_range(bar)
        if rng == 0:
            return results
        body = BodyCalculator.body(bar)
        lower = BodyCalculator.lower_shadow(bar)
        upper = BodyCalculator.upper_shadow(bar)
        if lower >= body * 2 and upper <= body * 0.5 and body > 0:
            confidence = min(0.85, 0.5 + lower / rng * 0.35)
            prev_trend = "down" if prices[-2].close < prices[-5].close else "up"
            if prev_trend == "down":
                confidence = min(0.90, confidence + 0.1)
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                confidence=round(confidence, 4), probability=round(confidence * 0.75, 4),
                risk=round(body / (bar.close + 1e-10), 4),
                entry_price=round(bar.close, 2), stop_loss=round(bar.low, 2),
                take_profit=round(bar.close + rng * 2, 2),
                start_index=len(prices) - 1, end_index=len(prices) - 1,
                description=f"Hammer at {bar.date}: lower_shadow={lower:.2f}",
            ))
        return results
    def shutdown(self) -> None: pass


class InvertedHammerPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "inverted_hammer"
    @property
    def display_name(self) -> str: return "Inverted Hammer"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 5
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 5:
            return results
        bar = prices[-1]
        rng = BodyCalculator.total_range(bar)
        if rng == 0:
            return results
        body = BodyCalculator.body(bar)
        lower = BodyCalculator.lower_shadow(bar)
        upper = BodyCalculator.upper_shadow(bar)
        if upper >= body * 2 and lower <= body * 0.5 and body > 0:
            confidence = min(0.80, 0.5 + upper / rng * 0.3)
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                direction=PatternDirection.BULLISH, status=PatternStatus.FORMING,
                confidence=round(confidence, 4), probability=round(confidence * 0.70, 4),
                entry_price=round(bar.close, 2), stop_loss=round(bar.low, 2),
                take_profit=round(bar.close + rng * 2, 2),
                start_index=len(prices) - 1, end_index=len(prices) - 1,
                description=f"Inverted Hammer at {bar.date}",
            ))
        return results
    def shutdown(self) -> None: pass


class DojiPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "doji"
    @property
    def display_name(self) -> str: return "Doji"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 3
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 3:
            return results
        bar = prices[-1]
        rng = BodyCalculator.total_range(bar)
        if rng == 0:
            return results
        ratio = BodyCalculator.body_ratio(bar)
        if ratio < 0.10:
            confidence = min(0.80, 0.5 + (0.10 - ratio) * 3)
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                direction=PatternDirection.NEUTRAL, status=PatternStatus.CONFIRMED,
                confidence=round(confidence, 4), probability=round(confidence * 0.65, 4),
                entry_price=round(bar.close, 2),
                start_index=len(prices) - 1, end_index=len(prices) - 1,
                description=f"Doji at {bar.date}: body_ratio={ratio:.3f}",
            ))
        return results
    def shutdown(self) -> None: pass


class DragonflyDojiPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "dragonfly_doji"
    @property
    def display_name(self) -> str: return "Dragonfly Doji"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 3
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 3:
            return results
        bar = prices[-1]
        rng = BodyCalculator.total_range(bar)
        if rng == 0:
            return results
        ratio = BodyCalculator.body_ratio(bar)
        lower_r = BodyCalculator.lower_shadow_ratio(bar)
        upper_r = BodyCalculator.upper_shadow_ratio(bar)
        if ratio < 0.10 and lower_r > 0.6 and upper_r < 0.05:
            confidence = min(0.82, 0.55 + lower_r * 0.25)
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                confidence=round(confidence, 4), probability=round(confidence * 0.72, 4),
                entry_price=round(bar.close, 2), stop_loss=round(bar.low, 2),
                take_profit=round(bar.close + rng * 2, 2),
                start_index=len(prices) - 1, end_index=len(prices) - 1,
                description=f"Dragonfly Doji at {bar.date}",
            ))
        return results
    def shutdown(self) -> None: pass


class GravestoneDojiPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "gravestone_doji"
    @property
    def display_name(self) -> str: return "Gravestone Doji"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 3
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 3:
            return results
        bar = prices[-1]
        rng = BodyCalculator.total_range(bar)
        if rng == 0:
            return results
        ratio = BodyCalculator.body_ratio(bar)
        upper_r = BodyCalculator.upper_shadow_ratio(bar)
        lower_r = BodyCalculator.lower_shadow_ratio(bar)
        if ratio < 0.10 and upper_r > 0.6 and lower_r < 0.05:
            confidence = min(0.82, 0.55 + upper_r * 0.25)
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                confidence=round(confidence, 4), probability=round(confidence * 0.72, 4),
                entry_price=round(bar.close, 2), stop_loss=round(bar.high, 2),
                take_profit=round(bar.close - rng * 2, 2),
                start_index=len(prices) - 1, end_index=len(prices) - 1,
                description=f"Gravestone Doji at {bar.date}",
            ))
        return results
    def shutdown(self) -> None: pass


class MorningStarPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "morning_star"
    @property
    def display_name(self) -> str: return "Morning Star"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 3
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 3:
            return results
        b1, b2, b3 = prices[-3], prices[-2], prices[-1]
        if not BodyCalculator.is_bearish(b1):
            return results
        if BodyCalculator.body_ratio(b2) > 0.30:
            return results
        if not BodyCalculator.is_bullish(b3):
            return results
        mid_body = (b2.open + b2.close) / 2
        if b3.close > (b1.open + b1.close) / 2:
            confidence = 0.75
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                confidence=confidence, probability=0.68,
                entry_price=round(b3.close, 2), stop_loss=round(b2.low, 2),
                take_profit=round(b3.close + abs(b1.open - b1.close) * 1.5, 2),
                start_index=len(prices) - 3, end_index=len(prices) - 1,
                description=f"Morning Star at {b3.date}",
            ))
        return results
    def shutdown(self) -> None: pass


class EveningStarPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "evening_star"
    @property
    def display_name(self) -> str: return "Evening Star"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 3
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 3:
            return results
        b1, b2, b3 = prices[-3], prices[-2], prices[-1]
        if not BodyCalculator.is_bullish(b1):
            return results
        if BodyCalculator.body_ratio(b2) > 0.30:
            return results
        if not BodyCalculator.is_bearish(b3):
            return results
        if b3.close < (b1.open + b1.close) / 2:
            confidence = 0.75
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                confidence=confidence, probability=0.68,
                entry_price=round(b3.close, 2), stop_loss=round(b2.high, 2),
                take_profit=round(b3.close - abs(b1.open - b1.close) * 1.5, 2),
                start_index=len(prices) - 3, end_index=len(prices) - 1,
                description=f"Evening Star at {b3.date}",
            ))
        return results
    def shutdown(self) -> None: pass


class BullishEngulfingPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "bullish_engulfing"
    @property
    def display_name(self) -> str: return "Bullish Engulfing"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 2
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 2:
            return results
        prev, curr = prices[-2], prices[-1]
        engulf = BodyCalculator.is_engulfing(prev, curr)
        if engulf == "bullish":
            confidence = min(0.85, 0.6 + BodyCalculator.body_ratio(curr) * 0.25)
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                confidence=round(confidence, 4), probability=round(confidence * 0.78, 4),
                entry_price=round(curr.close, 2), stop_loss=round(curr.low, 2),
                take_profit=round(curr.close + BodyCalculator.body(curr) * 2, 2),
                start_index=len(prices) - 2, end_index=len(prices) - 1,
                description=f"Bullish Engulfing at {curr.date}",
            ))
        return results
    def shutdown(self) -> None: pass


class BearishEngulfingPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "bearish_engulfing"
    @property
    def display_name(self) -> str: return "Bearish Engulfing"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 2
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 2:
            return results
        prev, curr = prices[-2], prices[-1]
        engulf = BodyCalculator.is_engulfing(prev, curr)
        if engulf == "bearish":
            confidence = min(0.85, 0.6 + BodyCalculator.body_ratio(curr) * 0.25)
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                confidence=round(confidence, 4), probability=round(confidence * 0.78, 4),
                entry_price=round(curr.close, 2), stop_loss=round(curr.high, 2),
                take_profit=round(curr.close - BodyCalculator.body(curr) * 2, 2),
                start_index=len(prices) - 2, end_index=len(prices) - 1,
                description=f"Bearish Engulfing at {curr.date}",
            ))
        return results
    def shutdown(self) -> None: pass


class HaramiPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "harami"
    @property
    def display_name(self) -> str: return "Harami"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 2
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 2:
            return results
        prev, curr = prices[-2], prices[-1]
        harami = BodyCalculator.is_harami(prev, curr)
        if harami != "none":
            direction = PatternDirection.BULLISH if harami == "bullish" else PatternDirection.BEARISH
            confidence = 0.65
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                direction=direction, status=PatternStatus.FORMING,
                confidence=confidence, probability=0.58,
                entry_price=round(curr.close, 2),
                start_index=len(prices) - 2, end_index=len(prices) - 1,
                description=f"{harami.title()} Harami at {curr.date}",
            ))
        return results
    def shutdown(self) -> None: pass


class PiercingPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "piercing_pattern"
    @property
    def display_name(self) -> str: return "Piercing Pattern"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 2
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 2:
            return results
        prev, curr = prices[-2], prices[-1]
        if not BodyCalculator.is_bearish(prev) or not BodyCalculator.is_bullish(curr):
            return results
        mid = (prev.open + prev.close) / 2
        if curr.open < prev.close and curr.close > mid and curr.close < prev.open:
            confidence = 0.70
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                confidence=confidence, probability=0.63,
                entry_price=round(curr.close, 2), stop_loss=round(curr.low, 2),
                take_profit=round(curr.close + abs(prev.open - prev.close), 2),
                start_index=len(prices) - 2, end_index=len(prices) - 1,
                description=f"Piercing Pattern at {curr.date}",
            ))
        return results
    def shutdown(self) -> None: pass


class DarkCloudPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "dark_cloud_cover"
    @property
    def display_name(self) -> str: return "Dark Cloud Cover"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 2
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 2:
            return results
        prev, curr = prices[-2], prices[-1]
        if not BodyCalculator.is_bullish(prev) or not BodyCalculator.is_bearish(curr):
            return results
        mid = (prev.open + prev.close) / 2
        if curr.open > prev.close and curr.close < mid and curr.close > prev.open:
            confidence = 0.70
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                confidence=confidence, probability=0.63,
                entry_price=round(curr.close, 2), stop_loss=round(curr.high, 2),
                take_profit=round(curr.close - abs(prev.open - prev.close), 2),
                start_index=len(prices) - 2, end_index=len(prices) - 1,
                description=f"Dark Cloud Cover at {curr.date}",
            ))
        return results
    def shutdown(self) -> None: pass


class ThreeWhiteSoldiersPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "three_white_soldiers"
    @property
    def display_name(self) -> str: return "Three White Soldiers"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 3
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 3:
            return results
        b1, b2, b3 = prices[-3], prices[-2], prices[-1]
        if all(BodyCalculator.is_bullish(b) for b in [b1, b2, b3]):
            if b2.close > b1.close and b3.close > b2.close:
                if b2.open > b1.open and b3.open > b2.open:
                    confidence = 0.78
                    results.append(PatternResult(
                        pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                        direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                        confidence=confidence, probability=0.72,
                        entry_price=round(b3.close, 2), stop_loss=round(b1.low, 2),
                        take_profit=round(b3.close + BodyCalculator.body(b1) + BodyCalculator.body(b2) + BodyCalculator.body(b3), 2),
                        start_index=len(prices) - 3, end_index=len(prices) - 1,
                        description=f"Three White Soldiers at {b3.date}",
                    ))
        return results
    def shutdown(self) -> None: pass


class ThreeBlackCrowsPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "three_black_crows"
    @property
    def display_name(self) -> str: return "Three Black Crows"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 3
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 3:
            return results
        b1, b2, b3 = prices[-3], prices[-2], prices[-1]
        if all(not BodyCalculator.is_bullish(b) for b in [b1, b2, b3]):
            if b2.close < b1.close and b3.close < b2.close:
                if b2.open < b1.open and b3.open < b2.open:
                    confidence = 0.78
                    results.append(PatternResult(
                        pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                        direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                        confidence=confidence, probability=0.72,
                        entry_price=round(b3.close, 2), stop_loss=round(b1.high, 2),
                        take_profit=round(b3.close - BodyCalculator.body(b1) - BodyCalculator.body(b2) - BodyCalculator.body(b3), 2),
                        start_index=len(prices) - 3, end_index=len(prices) - 1,
                        description=f"Three Black Crows at {b3.date}",
                    ))
        return results
    def shutdown(self) -> None: pass


class ShootingStarPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "shooting_star"
    @property
    def display_name(self) -> str: return "Shooting Star"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 3
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 3:
            return results
        bar = prices[-1]
        rng = BodyCalculator.total_range(bar)
        if rng == 0:
            return results
        body = BodyCalculator.body(bar)
        upper = BodyCalculator.upper_shadow(bar)
        lower = BodyCalculator.lower_shadow(bar)
        if upper >= body * 2 and lower <= body * 0.5 and body > 0:
            prev_uptrend = prices[-1].close > prices[-3].close
            if prev_uptrend:
                confidence = 0.78
                results.append(PatternResult(
                    pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                    direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                    confidence=confidence, probability=0.70,
                    entry_price=round(bar.close, 2), stop_loss=round(bar.high, 2),
                    take_profit=round(bar.close - rng * 2, 2),
                    start_index=len(prices) - 1, end_index=len(prices) - 1,
                    description=f"Shooting Star at {bar.date}",
                ))
        return results
    def shutdown(self) -> None: pass


class HangingManPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "hanging_man"
    @property
    def display_name(self) -> str: return "Hanging Man"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 3
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 3:
            return results
        bar = prices[-1]
        rng = BodyCalculator.total_range(bar)
        if rng == 0:
            return results
        body = BodyCalculator.body(bar)
        lower = BodyCalculator.lower_shadow(bar)
        upper = BodyCalculator.upper_shadow(bar)
        if lower >= body * 2 and upper <= body * 0.5 and body > 0:
            prev_uptrend = prices[-1].close > prices[-3].close
            if prev_uptrend:
                confidence = 0.75
                results.append(PatternResult(
                    pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                    direction=PatternDirection.BEARISH, status=PatternStatus.FORMING,
                    confidence=confidence, probability=0.68,
                    entry_price=round(bar.close, 2), stop_loss=round(bar.high, 2),
                    take_profit=round(bar.close - rng * 2, 2),
                    start_index=len(prices) - 1, end_index=len(prices) - 1,
                    description=f"Hanging Man at {bar.date}",
                ))
        return results
    def shutdown(self) -> None: pass


class TweezerTopPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "tweezer_top"
    @property
    def display_name(self) -> str: return "Tweezer Top"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 2
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {"tolerance": {"type": "float", "default": 0.005}}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 2:
            return results
        tol = params.get("tolerance", 0.005)
        prev, curr = prices[-2], prices[-1]
        high_diff = abs(prev.high - curr.high) / (prev.high + 1e-10)
        if high_diff < tol and BodyCalculator.is_bullish(prev) and not BodyCalculator.is_bullish(curr):
            confidence = 0.68
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                direction=PatternDirection.BEARISH, status=PatternStatus.FORMING,
                confidence=confidence, probability=0.60,
                entry_price=round(curr.close, 2), stop_loss=round(curr.high, 2),
                take_profit=round(curr.close - abs(prev.close - prev.open), 2),
                start_index=len(prices) - 2, end_index=len(prices) - 1,
                description=f"Tweezer Top at {curr.date}",
            ))
        return results
    def shutdown(self) -> None: pass


class TweezerBottomPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "tweezer_bottom"
    @property
    def display_name(self) -> str: return "Tweezer Bottom"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CANDLESTICK
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 2
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {"tolerance": {"type": "float", "default": 0.005}}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        if len(prices) < 2:
            return results
        tol = params.get("tolerance", 0.005)
        prev, curr = prices[-2], prices[-1]
        low_diff = abs(prev.low - curr.low) / (prev.low + 1e-10)
        if low_diff < tol and not BodyCalculator.is_bullish(prev) and BodyCalculator.is_bullish(curr):
            confidence = 0.68
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.CANDLESTICK,
                direction=PatternDirection.BULLISH, status=PatternStatus.FORMING,
                confidence=confidence, probability=0.60,
                entry_price=round(curr.close, 2), stop_loss=round(curr.low, 2),
                take_profit=round(curr.close + abs(prev.close - prev.open), 2),
                start_index=len(prices) - 2, end_index=len(prices) - 1,
                description=f"Tweezer Bottom at {curr.date}",
            ))
        return results
    def shutdown(self) -> None: pass
