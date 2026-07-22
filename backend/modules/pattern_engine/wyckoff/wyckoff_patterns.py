from __future__ import annotations

from modules.pattern_engine.core.base import BasePatternPlugin
from modules.pattern_engine.core.types import (
    PriceBar, PatternResult, PatternCategory, PatternDirection, PatternStatus,
)
from modules.pattern_engine.analysis.analysis_tools import (
    SwingDetector, SupportResistance, TrendLineCalculator,
)


def _compute_range(prices: list[PriceBar]) -> tuple[float, float]:
    high = max(p.high for p in prices)
    low = min(p.low for p in prices)
    return high, low


def _is_ranging(prices: list[PriceBar], tolerance: float = 0.05) -> bool:
    high, low = _compute_range(prices)
    mid = (high + low) / 2
    if mid == 0:
        return False
    return (high - low) / mid < tolerance


class AccumulationPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "accumulation"
    @property
    def display_name(self) -> str: return "Accumulation"
    @property
    def category(self) -> PatternCategory: return PatternCategory.WYCKOFF
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"range_bars": 30, "tolerance": 0.08}
    def min_bars(self) -> int: return 40
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "range_bars": {"type": "int", "default": 30, "min": 15, "max": 60},
            "tolerance": {"type": "float", "default": 0.08, "min": 0.03, "max": 0.20},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        range_bars = params.get("range_bars", 30)
        tolerance = params.get("tolerance", 0.08)
        recent = prices[-range_bars:] if n >= range_bars else prices
        high, low = _compute_range(recent)
        vol_avg = sum(p.volume for p in recent) / max(1, len(recent))
        decreasing_vol = all(
            recent[i].volume < vol_avg * 1.2 for i in range(-min(5, len(recent)), 0)
        ) if len(recent) >= 5 else False
        range_pct = (high - low) / ((high + low) / 2 + 1e-10)
        if range_pct < tolerance:
            was_downtrend = TrendLineCalculator.is_downtrend(prices[:n - range_bars + 10], lookback=range_bars) if n > range_bars else False
            current = prices[-1].close
            near_support = abs(current - low) / (high - low + 1e-10) < 0.4
            confidence = min(0.80, 0.50 + (1 - range_pct / tolerance) * 0.30)
            if decreasing_vol:
                confidence = min(0.88, confidence + 0.08)
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.WYCKOFF,
                direction=PatternDirection.BULLISH, status=PatternStatus.FORMING,
                confidence=round(confidence, 4), probability=round(confidence * 0.75, 4),
                risk=round(range_pct, 4),
                expected_target=round(high + (high - low), 2),
                entry_price=round(high, 2),
                stop_loss=round(low * 0.97, 2),
                take_profit=round(high + (high - low), 2),
                start_index=n - range_bars, end_index=n - 1,
                key_levels=[round(high, 2), round(low, 2), round((high + low) / 2, 2)],
                description=f"Accumulation: range {low:.2f}-{high:.2f}, decreasing volume",
            ))
        return results
    def shutdown(self) -> None: pass


class DistributionPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "distribution"
    @property
    def display_name(self) -> str: return "Distribution"
    @property
    def category(self) -> PatternCategory: return PatternCategory.WYCKOFF
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"range_bars": 30, "tolerance": 0.08}
    def min_bars(self) -> int: return 40
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "range_bars": {"type": "int", "default": 30, "min": 15, "max": 60},
            "tolerance": {"type": "float", "default": 0.08, "min": 0.03, "max": 0.20},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        range_bars = params.get("range_bars", 30)
        tolerance = params.get("tolerance", 0.08)
        recent = prices[-range_bars:] if n >= range_bars else prices
        high, low = _compute_range(recent)
        vol_avg = sum(p.volume for p in recent) / max(1, len(recent))
        increasing_vol = all(
            recent[i].volume > vol_avg * 0.8 for i in range(-min(5, len(recent)), 0)
        ) if len(recent) >= 5 else False
        range_pct = (high - low) / ((high + low) / 2 + 1e-10)
        if range_pct < tolerance:
            was_uptrend = TrendLineCalculator.is_uptrend(prices[:n - range_bars + 10], lookback=range_bars) if n > range_bars else False
            current = prices[-1].close
            near_resistance = abs(current - high) / (high - low + 1e-10) > 0.6
            confidence = min(0.80, 0.50 + (1 - range_pct / tolerance) * 0.30)
            if increasing_vol:
                confidence = min(0.88, confidence + 0.08)
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.WYCKOFF,
                direction=PatternDirection.BEARISH, status=PatternStatus.FORMING,
                confidence=round(confidence, 4), probability=round(confidence * 0.75, 4),
                risk=round(range_pct, 4),
                expected_target=round(low - (high - low), 2),
                entry_price=round(low, 2),
                stop_loss=round(high * 1.03, 2),
                take_profit=round(low - (high - low), 2),
                start_index=n - range_bars, end_index=n - 1,
                key_levels=[round(high, 2), round(low, 2), round((high + low) / 2, 2)],
                description=f"Distribution: range {low:.2f}-{high:.2f}, elevated volume",
            ))
        return results
    def shutdown(self) -> None: pass


class SpringPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "spring"
    @property
    def display_name(self) -> str: return "Spring"
    @property
    def category(self) -> PatternCategory: return PatternCategory.WYCKOFF
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 20, "spring_pct": 0.01}
    def min_bars(self) -> int: return 25
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 20, "min": 10, "max": 40},
            "spring_pct": {"type": "float", "default": 0.01, "min": 0.003, "max": 0.05},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 20)
        spring_pct = params.get("spring_pct", 0.01)
        swings = SwingDetector.detect_swings(prices, lookback=5)
        lows = SwingDetector.find_swing_lows(swings)
        if len(lows) < 2:
            return results
        support_level = min(l.price for l in lows[-lookback:]) if len(lows) >= 1 else min(p.low for p in prices[-lookback:])
        bar = prices[-1]
        prev_low = min(p.low for p in prices[-3:]) if n >= 3 else bar.low
        if prev_low < support_level and bar.close > support_level:
            spring_depth = (support_level - prev_low) / (support_level + 1e-10)
            if spring_depth < spring_pct:
                confidence = min(0.82, 0.55 + spring_depth * 15)
                results.append(PatternResult(
                    pattern_name=self.display_name, category=PatternCategory.WYCKOFF,
                    direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                    confidence=round(confidence, 4), probability=round(confidence * 0.78, 4),
                    risk=round(spring_depth, 4),
                    expected_target=round(bar.close + (bar.close - support_level) * 2, 2),
                    entry_price=round(bar.close, 2),
                    stop_loss=round(prev_low * 0.98, 2),
                    take_profit=round(bar.close + (bar.close - support_level) * 2, 2),
                    start_index=n - 3, end_index=n - 1,
                    key_levels=[round(support_level, 2), round(prev_low, 2)],
                    description=f"Spring: swept {prev_low:.2f} below support {support_level:.2f}, closed above",
                ))
        return results
    def shutdown(self) -> None: pass


class UpthrustPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "upthrust"
    @property
    def display_name(self) -> str: return "Upthrust"
    @property
    def category(self) -> PatternCategory: return PatternCategory.WYCKOFF
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 20, "upthrust_pct": 0.01}
    def min_bars(self) -> int: return 25
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 20, "min": 10, "max": 40},
            "upthrust_pct": {"type": "float", "default": 0.01, "min": 0.003, "max": 0.05},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 20)
        upthrust_pct = params.get("upthrust_pct", 0.01)
        swings = SwingDetector.detect_swings(prices, lookback=5)
        highs = SwingDetector.find_swing_highs(swings)
        if len(highs) < 2:
            return results
        resistance_level = max(h.price for h in highs[-lookback:]) if len(highs) >= 1 else max(p.high for p in prices[-lookback:])
        bar = prices[-1]
        prev_high = max(p.high for p in prices[-3:]) if n >= 3 else bar.high
        if prev_high > resistance_level and bar.close < resistance_level:
            thrust_depth = (prev_high - resistance_level) / (resistance_level + 1e-10)
            if thrust_depth < upthrust_pct:
                confidence = min(0.82, 0.55 + thrust_depth * 15)
                results.append(PatternResult(
                    pattern_name=self.display_name, category=PatternCategory.WYCKOFF,
                    direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                    confidence=round(confidence, 4), probability=round(confidence * 0.78, 4),
                    risk=round(thrust_depth, 4),
                    expected_target=round(bar.close - (resistance_level - bar.close) * 2, 2),
                    entry_price=round(bar.close, 2),
                    stop_loss=round(prev_high * 1.02, 2),
                    take_profit=round(bar.close - (resistance_level - bar.close) * 2, 2),
                    start_index=n - 3, end_index=n - 1,
                    key_levels=[round(resistance_level, 2), round(prev_high, 2)],
                    description=f"Upthrust: swept {prev_high:.2f} above resistance {resistance_level:.2f}, closed below",
                ))
        return results
    def shutdown(self) -> None: pass


class AutomaticRallyPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "automatic_rally"
    @property
    def display_name(self) -> str: return "Automatic Rally"
    @property
    def category(self) -> PatternCategory: return PatternCategory.WYCKOFF
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 20, "min_move_pct": 0.03}
    def min_bars(self) -> int: return 25
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 20, "min": 10, "max": 40},
            "min_move_pct": {"type": "float", "default": 0.03, "min": 0.01, "max": 0.10},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 20)
        min_move = params.get("min_move_pct", 0.03)
        swings = SwingDetector.detect_swings(prices, lookback=5)
        lows = SwingDetector.find_swing_lows(swings)
        if len(lows) < 2:
            return results
        recent_low = lows[-1]
        prev_low = lows[-2] if len(lows) >= 2 else lows[-1]
        if recent_low.price < prev_low.price:
            decline_pct = (prev_low.price - recent_low.price) / (prev_low.price + 1e-10)
            if decline_pct > min_move:
                end_idx = recent_low.index + 8 if recent_low.index + 8 <= n else n
                rally_bars = prices[recent_low.index:end_idx]
                if len(rally_bars) >= 2:
                    rally_high = max(p.high for p in rally_bars)
                    rally_pct = (rally_high - recent_low.price) / (recent_low.price + 1e-10)
                    if rally_pct > decline_pct * 0.3:
                        confidence = min(0.75, 0.50 + rally_pct * 2)
                        results.append(PatternResult(
                            pattern_name=self.display_name, category=PatternCategory.WYCKOFF,
                            direction=PatternDirection.BULLISH, status=PatternStatus.FORMING,
                            confidence=round(confidence, 4), probability=round(confidence * 0.72, 4),
                            risk=round(decline_pct - rally_pct, 4),
                            expected_target=round(rally_high, 2),
                            entry_price=round(recent_low.price, 2),
                            stop_loss=round(recent_low.price * 0.97, 2),
                            take_profit=round(rally_high, 2),
                            start_index=recent_low.index, end_index=recent_low.index + len(rally_bars) - 1,
                            key_levels=[round(recent_low.price, 2), round(rally_high, 2)],
                            description=f"AR: {decline_pct:.1%} decline, {rally_pct:.1%} rally from {recent_low.price:.2f}",
                        ))
        return results
    def shutdown(self) -> None: pass


class SecondaryTestPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "secondary_test"
    @property
    def display_name(self) -> str: return "Secondary Test"
    @property
    def category(self) -> PatternCategory: return PatternCategory.WYCKOFF
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 20, "test_tolerance": 0.01}
    def min_bars(self) -> int: return 30
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 20, "min": 10, "max": 40},
            "test_tolerance": {"type": "float", "default": 0.01, "min": 0.003, "max": 0.05},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        tolerance = params.get("test_tolerance", 0.01)
        swings = SwingDetector.detect_swings(prices, lookback=5)
        lows = SwingDetector.find_swing_lows(swings)
        if len(lows) < 2:
            return results
        primary = lows[0]
        for l in lows[1:]:
            diff = abs(l.price - primary.price) / (primary.price + 1e-10)
            if diff < tolerance and l.index > primary.index:
                vol_declining = True
                if l.index + 1 < n:
                    avg_vol = sum(p.volume for p in prices[primary.index:l.index]) / max(1, l.index - primary.index)
                    if prices[l.index].volume > avg_vol * 1.5:
                        vol_declining = False
                confidence = min(0.78, 0.52 + (1 - diff / tolerance) * 0.26)
                if vol_declining:
                    confidence = min(0.85, confidence + 0.07)
                results.append(PatternResult(
                    pattern_name=self.display_name, category=PatternCategory.WYCKOFF,
                    direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                    confidence=round(confidence, 4), probability=round(confidence * 0.74, 4),
                    risk=round(diff, 4),
                    expected_target=round(primary.price * 1.10, 2),
                    entry_price=round(l.price, 2),
                    stop_loss=round(primary.price * 0.97, 2),
                    take_profit=round(primary.price * 1.10, 2),
                    start_index=primary.index, end_index=l.index,
                    key_levels=[round(primary.price, 2), round(l.price, 2)],
                    description=f"ST: tested {primary.price:.2f} at {l.price:.2f}, vol {'declining' if vol_declining else 'elevated'}",
                ))
                break
        return results
    def shutdown(self) -> None: pass


class SignOfStrengthPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "sign_of_strength"
    @property
    def display_name(self) -> str: return "Sign of Strength"
    @property
    def category(self) -> PatternCategory: return PatternCategory.WYCKOFF
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 15, "min_move_pct": 0.02}
    def min_bars(self) -> int: return 20
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 15, "min": 5, "max": 30},
            "min_move_pct": {"type": "float", "default": 0.02, "min": 0.005, "max": 0.10},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 15)
        min_move = params.get("min_move_pct", 0.02)
        recent = prices[-lookback:]
        move = (recent[-1].close - recent[0].open) / (recent[0].open + 1e-10)
        vol_avg = sum(p.volume for p in recent) / len(recent)
        last_vol = recent[-1].volume
        is_strong = move > min_move and last_vol > vol_avg * 1.2
        if is_strong:
            confidence = min(0.80, 0.55 + move * 2)
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.WYCKOFF,
                direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                confidence=round(confidence, 4), probability=round(confidence * 0.76, 4),
                risk=round(min_move, 4),
                expected_target=round(recent[-1].close * 1.10, 2),
                entry_price=round(recent[-1].close, 2),
                stop_loss=round(recent[-1].close * 0.97, 2),
                take_profit=round(recent[-1].close * 1.10, 2),
                start_index=n - lookback, end_index=n - 1,
                key_levels=[round(recent[-1].close, 2)],
                description=f"SOS: {move:.1%} move on high volume ({last_vol / vol_avg:.1f}x avg)",
            ))
        return results
    def shutdown(self) -> None: pass


class SignOfWeaknessPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "sign_of_weakness"
    @property
    def display_name(self) -> str: return "Sign of Weakness"
    @property
    def category(self) -> PatternCategory: return PatternCategory.WYCKOFF
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 15, "min_move_pct": 0.02}
    def min_bars(self) -> int: return 20
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 15, "min": 5, "max": 30},
            "min_move_pct": {"type": "float", "default": 0.02, "min": 0.005, "max": 0.10},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 15)
        min_move = params.get("min_move_pct", 0.02)
        recent = prices[-lookback:]
        move = (recent[0].open - recent[-1].close) / (recent[0].open + 1e-10)
        vol_avg = sum(p.volume for p in recent) / len(recent)
        last_vol = recent[-1].volume
        is_weak = move > min_move and last_vol > vol_avg * 1.2
        if is_weak:
            confidence = min(0.80, 0.55 + move * 2)
            results.append(PatternResult(
                pattern_name=self.display_name, category=PatternCategory.WYCKOFF,
                direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                confidence=round(confidence, 4), probability=round(confidence * 0.76, 4),
                risk=round(min_move, 4),
                expected_target=round(recent[-1].close * 0.90, 2),
                entry_price=round(recent[-1].close, 2),
                stop_loss=round(recent[-1].close * 1.03, 2),
                take_profit=round(recent[-1].close * 0.90, 2),
                start_index=n - lookback, end_index=n - 1,
                key_levels=[round(recent[-1].close, 2)],
                description=f"SOW: {move:.1%} decline on high volume ({last_vol / vol_avg:.1f}x avg)",
            ))
        return results
    def shutdown(self) -> None: pass


class LastPointOfSupportPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "lps"
    @property
    def display_name(self) -> str: return "Last Point of Support"
    @property
    def category(self) -> PatternCategory: return PatternCategory.WYCKOFF
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 20, "retest_tolerance": 0.015}
    def min_bars(self) -> int: return 30
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 20, "min": 10, "max": 40},
            "retest_tolerance": {"type": "float", "default": 0.015, "min": 0.005, "max": 0.05},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        tolerance = params.get("retest_tolerance", 0.015)
        swings = SwingDetector.detect_swings(prices, lookback=5)
        lows = SwingDetector.find_swing_lows(swings)
        highs = SwingDetector.find_swing_highs(swings)
        if len(lows) < 2:
            return results
        primary = lows[0]
        retests = [l for l in lows[1:] if abs(l.price - primary.price) / (primary.price + 1e-10) < tolerance]
        if len(retests) >= 1:
            last_retest = retests[-1]
            current = prices[-1].close
            if current > primary.price and TrendLineCalculator.is_uptrend(prices[last_retest.index:], lookback=min(10, n - last_retest.index)) if last_retest.index < n else False:
                avg_vol = sum(p.volume for p in prices[primary.index:last_retest.index]) / max(1, last_retest.index - primary.index)
                test_vol = prices[last_retest.index].volume
                if test_vol < avg_vol * 0.8:
                    confidence = min(0.82, 0.55 + (1 - len(retests) * 0.05) * 0.27)
                    results.append(PatternResult(
                        pattern_name=self.display_name, category=PatternCategory.WYCKOFF,
                        direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                        confidence=round(confidence, 4), probability=round(confidence * 0.77, 4),
                        expected_target=round(primary.price * 1.12, 2),
                        entry_price=round(current, 2),
                        stop_loss=round(primary.price * 0.97, 2),
                        take_profit=round(primary.price * 1.12, 2),
                        start_index=primary.index, end_index=n - 1,
                        key_levels=[round(primary.price, 2)],
                        description=f"LPS: final retest of {primary.price:.2f} on declining volume, now trending up",
                    ))
        return results
    def shutdown(self) -> None: pass


class LastPointOfSupplyPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "lpsupply"
    @property
    def display_name(self) -> str: return "Last Point of Supply"
    @property
    def category(self) -> PatternCategory: return PatternCategory.WYCKOFF
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 20, "retest_tolerance": 0.015}
    def min_bars(self) -> int: return 30
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 20, "min": 10, "max": 40},
            "retest_tolerance": {"type": "float", "default": 0.015, "min": 0.005, "max": 0.05},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        tolerance = params.get("retest_tolerance", 0.015)
        swings = SwingDetector.detect_swings(prices, lookback=5)
        highs = SwingDetector.find_swing_highs(swings)
        if len(highs) < 2:
            return results
        primary = highs[0]
        retests = [h for h in highs[1:] if abs(h.price - primary.price) / (primary.price + 1e-10) < tolerance]
        if len(retests) >= 1:
            last_retest = retests[-1]
            current = prices[-1].close
            if current < primary.price and TrendLineCalculator.is_downtrend(prices[last_retest.index:], lookback=min(10, n - last_retest.index)) if last_retest.index < n else False:
                avg_vol = sum(p.volume for p in prices[primary.index:last_retest.index]) / max(1, last_retest.index - primary.index)
                test_vol = prices[last_retest.index].volume
                if test_vol < avg_vol * 0.8:
                    confidence = min(0.82, 0.55 + (1 - len(retests) * 0.05) * 0.27)
                    results.append(PatternResult(
                        pattern_name=self.display_name, category=PatternCategory.WYCKOFF,
                        direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                        confidence=round(confidence, 4), probability=round(confidence * 0.77, 4),
                        expected_target=round(primary.price * 0.88, 2),
                        entry_price=round(current, 2),
                        stop_loss=round(primary.price * 1.03, 2),
                        take_profit=round(primary.price * 0.88, 2),
                        start_index=primary.index, end_index=n - 1,
                        key_levels=[round(primary.price, 2)],
                        description=f"LPSupply: final retest of {primary.price:.2f} on declining volume, now trending down",
                    ))
        return results
    def shutdown(self) -> None: pass
