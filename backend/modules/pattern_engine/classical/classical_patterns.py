from __future__ import annotations

from modules.pattern_engine.core.base import BasePatternPlugin
from modules.pattern_engine.core.types import (
    PriceBar, PatternResult, PatternCategory, PatternDirection, PatternStatus,
)
from modules.pattern_engine.analysis.analysis_tools import (
    SwingDetector, SupportResistance, TrendLineCalculator,
)


class CupHandlePlugin(BasePatternPlugin):

    def __init__(self) -> None:
        pass

    @property
    def name(self) -> str:
        return "cup_handle"

    @property
    def display_name(self) -> str:
        return "Cup & Handle"

    @property
    def category(self) -> PatternCategory:
        return PatternCategory.CLASSICAL

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"min_cup_depth": 0.10, "max_cup_depth": 0.35, "handle_ratio": 0.15}

    def min_bars(self) -> int:
        return 40

    def metadata(self) -> dict:
        return {
            "name": self.name, "display_name": self.display_name,
            "category": self.category.value,
            "default_params": self.get_default_params(),
        }

    def parameters(self) -> dict:
        return {
            "min_cup_depth": {"type": "float", "default": 0.10, "min": 0.03, "max": 0.50},
            "max_cup_depth": {"type": "float", "default": 0.35, "min": 0.10, "max": 0.60},
            "handle_ratio": {"type": "float", "default": 0.15, "min": 0.05, "max": 0.40},
        }

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        errors: list[str] = []
        if len(prices) < self.min_bars():
            errors.append(f"Need at least {self.min_bars()} bars for Cup & Handle")
        return errors

    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results

        min_cup = params.get("min_cup_depth", 0.10)
        max_cup = params.get("max_cup_depth", 0.35)
        handle_r = params.get("handle_ratio", 0.15)

        swings = SwingDetector.detect_swings(prices, lookback=3)
        highs = SwingDetector.find_swing_highs(swings)
        lows = SwingDetector.find_swing_lows(swings)

        if len(highs) < 2 or len(lows) < 1:
            return results

        for i in range(len(highs) - 1):
            h1 = highs[i]
            h2 = highs[i + 1]
            between_lows = [l for l in lows if h1.index < l.index < h2.index]
            if not between_lows:
                continue
            cup_low = min(between_lows, key=lambda l: l.price)
            cup_depth = (h1.price - cup_low.price) / h1.price
            if not (min_cup <= cup_depth <= max_cup):
                continue
            rim_diff = abs(h1.price - h2.price) / h1.price
            if rim_diff > 0.05:
                continue
            handle_start = h2.index
            handle_end = min(h2.index + int((h2.index - cup_low.index) * handle_r * 3) + 5, n - 1)
            if handle_end <= handle_start:
                continue
            handle_prices = prices[handle_start:handle_end + 1]
            handle_max = max(p.high for p in handle_prices)
            handle_min = min(p.low for p in handle_prices)
            handle_depth = (handle_max - handle_min) / (handle_max + 1e-10)
            if handle_depth > 0.15:
                continue

            neckline = h1.price
            current = prices[-1].close
            status = PatternStatus.CONFIRMED if current > neckline else PatternStatus.FORMING
            confidence = min(0.9, 0.5 + (1 - rim_diff) * 0.3 + (1 - handle_depth) * 0.2)
            target = neckline + (neckline - cup_low.price)

            results.append(PatternResult(
                pattern_name=self.display_name,
                category=PatternCategory.CLASSICAL,
                direction=PatternDirection.BULLISH,
                status=status,
                confidence=round(confidence, 4),
                probability=round(confidence * 0.85, 4),
                risk=round(cup_depth, 4),
                expected_target=round(target, 2),
                expected_duration=h2.index - h1.index,
                expected_pullback=round(handle_depth, 4),
                pattern_quality=round(confidence * 0.9, 4),
                confirmation_score=round(1.0 if status == PatternStatus.CONFIRMED else 0.5, 4),
                entry_price=round(neckline, 2),
                stop_loss=round(cup_low.price, 2),
                take_profit=round(target, 2),
                start_index=h1.index,
                end_index=h2.index,
                key_levels=[round(neckline, 2), round(cup_low.price, 2)],
                description=f"Cup & Handle: neckline={neckline:.2f}, depth={cup_depth:.1%}",
            ))
        return results

    def shutdown(self) -> None:
        pass


class DoubleBottomPlugin(BasePatternPlugin):

    def __init__(self) -> None:
        pass

    @property
    def name(self) -> str:
        return "double_bottom"

    @property
    def display_name(self) -> str:
        return "Double Bottom"

    @property
    def category(self) -> PatternCategory:
        return PatternCategory.CLASSICAL

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"tolerance": 0.03}

    def min_bars(self) -> int:
        return 30

    def metadata(self) -> dict:
        return {"name": self.name, "display_name": self.display_name, "category": self.category.value}

    def parameters(self) -> dict:
        return {"tolerance": {"type": "float", "default": 0.03, "min": 0.01, "max": 0.10}}

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]

    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        tolerance = params.get("tolerance", 0.03)
        swings = SwingDetector.detect_swings(prices, lookback=3)
        lows = SwingDetector.find_swing_lows(swings)
        if len(lows) < 2:
            return results
        for i in range(len(lows) - 1):
            l1 = lows[i]
            l2 = lows[i + 1]
            price_diff = abs(l1.price - l2.price) / max(l1.price, l2.price)
            if price_diff > tolerance:
                continue
            between_highs = [s for s in swings if s.swing_type.value == "high" and l1.index < s.index < l2.index]
            if not between_highs:
                continue
            neckline = max(h.price for h in between_highs)
            current = prices[-1].close
            status = PatternStatus.CONFIRMED if current > neckline else PatternStatus.FORMING
            confidence = min(0.9, 0.6 + (1 - price_diff) * 0.3)
            support = min(l1.price, l2.price)
            target = neckline + (neckline - support)

            results.append(PatternResult(
                pattern_name=self.display_name,
                category=PatternCategory.CLASSICAL,
                direction=PatternDirection.BULLISH,
                status=status,
                confidence=round(confidence, 4),
                probability=round(confidence * 0.80, 4),
                risk=round((neckline - support) / neckline, 4),
                expected_target=round(target, 2),
                expected_duration=l2.index - l1.index,
                expected_pullback=round(price_diff, 4),
                pattern_quality=round(confidence * 0.85, 4),
                confirmation_score=round(1.0 if status == PatternStatus.CONFIRMED else 0.4, 4),
                entry_price=round(neckline, 2),
                stop_loss=round(support * 0.98, 2),
                take_profit=round(target, 2),
                start_index=l1.index,
                end_index=l2.index,
                key_levels=[round(neckline, 2), round(support, 2)],
                description=f"Double Bottom: support={support:.2f}, neckline={neckline:.2f}",
            ))
        return results

    def shutdown(self) -> None:
        pass


class DoubleTopPlugin(BasePatternPlugin):

    def __init__(self) -> None:
        pass

    @property
    def name(self) -> str:
        return "double_top"

    @property
    def display_name(self) -> str:
        return "Double Top"

    @property
    def category(self) -> PatternCategory:
        return PatternCategory.CLASSICAL

    def initialize(self, **kwargs) -> None:
        pass

    def get_default_params(self) -> dict:
        return {"tolerance": 0.03}

    def min_bars(self) -> int:
        return 30

    def metadata(self) -> dict:
        return {"name": self.name, "display_name": self.display_name, "category": self.category.value}

    def parameters(self) -> dict:
        return {"tolerance": {"type": "float", "default": 0.03, "min": 0.01, "max": 0.10}}

    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]

    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        tolerance = params.get("tolerance", 0.03)
        swings = SwingDetector.detect_swings(prices, lookback=3)
        highs = SwingDetector.find_swing_highs(swings)
        if len(highs) < 2:
            return results
        for i in range(len(highs) - 1):
            h1 = highs[i]
            h2 = highs[i + 1]
            price_diff = abs(h1.price - h2.price) / max(h1.price, h2.price)
            if price_diff > tolerance:
                continue
            between_lows = [s for s in swings if s.swing_type.value == "low" and h1.index < s.index < h2.index]
            if not between_lows:
                continue
            neckline = min(l.price for l in between_lows)
            current = prices[-1].close
            status = PatternStatus.CONFIRMED if current < neckline else PatternStatus.FORMING
            confidence = min(0.9, 0.6 + (1 - price_diff) * 0.3)
            resistance = max(h1.price, h2.price)
            target = neckline - (resistance - neckline)

            results.append(PatternResult(
                pattern_name=self.display_name,
                category=PatternCategory.CLASSICAL,
                direction=PatternDirection.BEARISH,
                status=status,
                confidence=round(confidence, 4),
                probability=round(confidence * 0.80, 4),
                risk=round((resistance - neckline) / neckline, 4),
                expected_target=round(target, 2),
                expected_duration=h2.index - h1.index,
                expected_pullback=round(price_diff, 4),
                pattern_quality=round(confidence * 0.85, 4),
                confirmation_score=round(1.0 if status == PatternStatus.CONFIRMED else 0.4, 4),
                entry_price=round(neckline, 2),
                stop_loss=round(resistance * 1.02, 2),
                take_profit=round(target, 2),
                start_index=h1.index,
                end_index=h2.index,
                key_levels=[round(neckline, 2), round(resistance, 2)],
                description=f"Double Top: resistance={resistance:.2f}, neckline={neckline:.2f}",
            ))
        return results

    def shutdown(self) -> None:
        pass


def _detect_triple(prices: list[PriceBar], pattern_name: str, is_bottom: bool, tolerance: float = 0.03) -> list[PatternResult]:
    results: list[PatternResult] = []
    n = len(prices)
    if n < 40:
        return results
    swings = SwingDetector.detect_swings(prices, lookback=3)
    pivots = SwingDetector.find_swing_lows(swings) if is_bottom else SwingDetector.find_swing_highs(swings)
    if len(pivots) < 3:
        return results
    direction = PatternDirection.BULLISH if is_bottom else PatternDirection.BEARISH
    for i in range(len(pivots) - 2):
        p1, p2, p3 = pivots[i], pivots[i + 1], pivots[i + 2]
        prices_list = [p1.price, p2.price, p3.price]
        avg = sum(prices_list) / 3
        max_diff = max(abs(p - avg) / (avg + 1e-10) for p in prices_list)
        if max_diff > tolerance:
            continue
        if is_bottom:
            neckline = max(s.price for s in swings if s.swing_type.value == "high" and p1.index < s.index < p3.index) if any(s.swing_type.value == "high" and p1.index < s.index < p3.index for s in swings) else avg * 1.1
            current = prices[-1].close
            status = PatternStatus.CONFIRMED if current > neckline else PatternStatus.FORMING
            target = neckline + (neckline - avg)
            sl = avg * 0.97
        else:
            neckline = min(s.price for s in swings if s.swing_type.value == "low" and p1.index < s.index < p3.index) if any(s.swing_type.value == "low" and p1.index < s.index < p3.index for s in swings) else avg * 0.9
            current = prices[-1].close
            status = PatternStatus.CONFIRMED if current < neckline else PatternStatus.FORMING
            target = neckline - (avg - neckline)
            sl = avg * 1.03

        confidence = min(0.85, 0.55 + (1 - max_diff) * 0.3)
        results.append(PatternResult(
            pattern_name=pattern_name,
            category=PatternCategory.CLASSICAL,
            direction=direction,
            status=status,
            confidence=round(confidence, 4),
            probability=round(confidence * 0.75, 4),
            risk=round(max_diff, 4),
            expected_target=round(target, 2),
            expected_duration=p3.index - p1.index,
            pattern_quality=round(confidence * 0.8, 4),
            confirmation_score=round(1.0 if status == PatternStatus.CONFIRMED else 0.3, 4),
            entry_price=round(neckline, 2),
            stop_loss=round(sl, 2),
            take_profit=round(target, 2),
            start_index=p1.index,
            end_index=p3.index,
            key_levels=[round(neckline, 2), round(avg, 2)],
            description=f"{pattern_name}: level={avg:.2f}, neckline={neckline:.2f}",
        ))
    return results


class TripleBottomPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "triple_bottom"
    @property
    def display_name(self) -> str: return "Triple Bottom"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"tolerance": 0.03}
    def min_bars(self) -> int: return 40
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {"tolerance": {"type": "float", "default": 0.03}}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        return _detect_triple(prices, self.display_name, True, params.get("tolerance", 0.03))
    def shutdown(self) -> None: pass


class TripleTopPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "triple_top"
    @property
    def display_name(self) -> str: return "Triple Top"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"tolerance": 0.03}
    def min_bars(self) -> int: return 40
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {"tolerance": {"type": "float", "default": 0.03}}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        return _detect_triple(prices, self.display_name, False, params.get("tolerance", 0.03))
    def shutdown(self) -> None: pass


def _detect_triangle(prices: list[PriceBar], name: str, direction: PatternDirection, triangle_type: str) -> list[PatternResult]:
    results: list[PatternResult] = []
    n = len(prices)
    if n < 30:
        return results
    swings = SwingDetector.detect_swings(prices, lookback=3)
    highs = SwingDetector.find_swing_highs(swings)
    lows = SwingDetector.find_swing_lows(swings)
    if len(highs) < 2 or len(lows) < 2:
        return results

    h_slope = (highs[-1].price - highs[-2].price) / max(1, highs[-1].index - highs[-2].index)
    l_slope = (lows[-1].price - lows[-2].price) / max(1, lows[-1].index - lows[-2].index)

    if triangle_type == "ascending":
        is_valid = abs(h_slope) < l_slope * 0.3 and l_slope > 0
    elif triangle_type == "descending":
        is_valid = abs(l_slope) < abs(h_slope) * 0.3 and h_slope < 0
    else:
        is_valid = h_slope < 0 and l_slope > 0 and abs(h_slope) > 0.001 and abs(l_slope) > 0.001

    if not is_valid:
        return results

    apex_price = (highs[-1].price + lows[-1].price) / 2
    current = prices[-1].close
    resistance = highs[-1].price
    support = lows[-1].price
    range_pct = (resistance - support) / (apex_price + 1e-10)

    if direction == PatternDirection.BULLISH:
        status = PatternStatus.CONFIRMED if current > resistance else PatternStatus.FORMING
        target = resistance + (resistance - support)
        sl = support * 0.98
    else:
        status = PatternStatus.CONFIRMED if current < support else PatternStatus.FORMING
        target = support - (resistance - support)
        sl = resistance * 1.02

    confidence = min(0.85, 0.5 + min(1.0, range_pct * 10) * 0.35)

    results.append(PatternResult(
        pattern_name=name,
        category=PatternCategory.CLASSICAL,
        direction=direction,
        status=status,
        confidence=round(confidence, 4),
        probability=round(confidence * 0.78, 4),
        risk=round(range_pct, 4),
        expected_target=round(target, 2),
        expected_duration=highs[-1].index - highs[0].index,
        pattern_quality=round(confidence * 0.82, 4),
        confirmation_score=round(1.0 if status == PatternStatus.CONFIRMED else 0.45, 4),
        entry_price=round(resistance if direction == PatternDirection.BULLISH else support, 2),
        stop_loss=round(sl, 2),
        take_profit=round(target, 2),
        start_index=highs[0].index,
        end_index=highs[-1].index,
        key_levels=[round(resistance, 2), round(support, 2)],
        description=f"{name}: R={resistance:.2f}, S={support:.2f}",
    ))
    return results


class AscendingTrianglePlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "ascending_triangle"
    @property
    def display_name(self) -> str: return "Ascending Triangle"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 30
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        return _detect_triangle(prices, self.display_name, PatternDirection.BULLISH, "ascending")
    def shutdown(self) -> None: pass


class DescendingTrianglePlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "descending_triangle"
    @property
    def display_name(self) -> str: return "Descending Triangle"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 30
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        return _detect_triangle(prices, self.display_name, PatternDirection.BEARISH, "descending")
    def shutdown(self) -> None: pass


class SymmetricalTrianglePlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "symmetrical_triangle"
    @property
    def display_name(self) -> str: return "Symmetrical Triangle"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 30
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        return _detect_triangle(prices, self.display_name, PatternDirection.NEUTRAL, "symmetrical")
    def shutdown(self) -> None: pass


def _detect_flag(prices: list[PriceBar], name: str, direction: PatternDirection, is_bull: bool) -> list[PatternResult]:
    results: list[PatternResult] = []
    n = len(prices)
    if n < 25:
        return results

    pole_len = min(15, n // 3)
    flag_len = min(10, (n - pole_len) // 2)
    if flag_len < 5:
        return results

    pole_prices = prices[:pole_len]
    flag_prices = prices[pole_len:pole_len + flag_len]

    pole_move = (pole_prices[-1].close - pole_prices[0].close) / (pole_prices[0].close + 1e-10)
    if is_bull and pole_move < 0.05:
        return results
    if not is_bull and pole_move > -0.05:
        return results

    flag_high = max(p.high for p in flag_prices)
    flag_low = min(p.low for p in flag_prices)
    flag_range = (flag_high - flag_low) / (flag_high + 1e-10)
    if flag_range > 0.12:
        return results

    current = prices[-1].close
    breakout_level = flag_high if is_bull else flag_low
    status = PatternStatus.CONFIRMED if (is_bull and current > flag_high) or (not is_bull and current < flag_low) else PatternStatus.FORMING
    confidence = min(0.85, 0.55 + (1 - flag_range) * 0.3)
    pole_size = abs(pole_move) * prices[0].close
    target = breakout_level + pole_size if is_bull else breakout_level - pole_size

    results.append(PatternResult(
        pattern_name=name,
        category=PatternCategory.CLASSICAL,
        direction=direction,
        status=status,
        confidence=round(confidence, 4),
        probability=round(confidence * 0.82, 4),
        risk=round(flag_range, 4),
        expected_target=round(target, 2),
        expected_duration=pole_len + flag_len,
        expected_pullback=round(flag_range, 4),
        pattern_quality=round(confidence * 0.88, 4),
        confirmation_score=round(1.0 if status == PatternStatus.CONFIRMED else 0.5, 4),
        entry_price=round(breakout_level, 2),
        stop_loss=round(flag_low if is_bull else flag_high, 2),
        take_profit=round(target, 2),
        start_index=0,
        end_index=pole_len + flag_len,
        key_levels=[round(breakout_level, 2)],
        description=f"{name}: pole={abs(pole_move):.1%}, flag_range={flag_range:.1%}",
    ))
    return results


class BullFlagPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "bull_flag"
    @property
    def display_name(self) -> str: return "Bull Flag"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 25
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        return _detect_flag(prices, self.display_name, PatternDirection.BULLISH, True)
    def shutdown(self) -> None: pass


class BearFlagPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "bear_flag"
    @property
    def display_name(self) -> str: return "Bear Flag"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 25
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        return _detect_flag(prices, self.display_name, PatternDirection.BEARISH, False)
    def shutdown(self) -> None: pass


class PennantPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "pennant"
    @property
    def display_name(self) -> str: return "Pennant"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 25
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        return _detect_triangle(prices, self.display_name, PatternDirection.NEUTRAL, "pennant")
    def shutdown(self) -> None: pass


class RectanglePlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "rectangle"
    @property
    def display_name(self) -> str: return "Rectangle"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 30
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {"tolerance": {"type": "float", "default": 0.02}}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]

    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < 30:
            return results
        tolerance = params.get("tolerance", 0.02)
        swings = SwingDetector.detect_swings(prices, lookback=3)
        highs = SwingDetector.find_swing_highs(swings)
        lows = SwingDetector.find_swing_lows(swings)
        if len(highs) < 2 or len(lows) < 2:
            return results

        avg_high = sum(h.price for h in highs[-3:]) / min(3, len(highs))
        avg_low = sum(l.price for l in lows[-3:]) / min(3, len(lows))
        h_var = max(abs(h.price - avg_high) / (avg_high + 1e-10) for h in highs[-3:])
        l_var = max(abs(l.price - avg_low) / (avg_low + 1e-10) for l in lows[-3:])
        if h_var > tolerance or l_var > tolerance:
            return results

        resistance = avg_high
        support = avg_low
        current = prices[-1].close
        if current > resistance:
            status = PatternStatus.CONFIRMED
            direction = PatternDirection.BULLISH
        elif current < support:
            status = PatternStatus.CONFIRMED
            direction = PatternDirection.BEARISH
        else:
            status = PatternStatus.FORMING
            direction = PatternDirection.NEUTRAL

        confidence = min(0.80, 0.5 + (1 - h_var - l_var) * 0.3)
        rng = resistance - support
        target_bull = resistance + rng
        target_bear = support - rng

        results.append(PatternResult(
            pattern_name=self.display_name,
            category=PatternCategory.CLASSICAL,
            direction=direction,
            status=status,
            confidence=round(confidence, 4),
            probability=round(confidence * 0.75, 4),
            risk=round(rng / (resistance + 1e-10), 4),
            expected_target=round(target_bull if direction != PatternDirection.BEARISH else target_bear, 2),
            expected_duration=highs[-1].index - highs[0].index,
            pattern_quality=round(confidence * 0.8, 4),
            confirmation_score=round(1.0 if status == PatternStatus.CONFIRMED else 0.4, 4),
            entry_price=round(resistance if direction == PatternDirection.BULLISH else support, 2),
            stop_loss=round(support if direction == PatternDirection.BULLISH else resistance, 2),
            take_profit=round(target_bull if direction != PatternDirection.BEARISH else target_bear, 2),
            start_index=highs[0].index,
            end_index=highs[-1].index,
            key_levels=[round(resistance, 2), round(support, 2)],
            description=f"Rectangle: R={resistance:.2f}, S={support:.2f}",
        ))
        return results

    def shutdown(self) -> None: pass


class ChannelUpPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "channel_up"
    @property
    def display_name(self) -> str: return "Channel Up"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 30
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]

    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < 30:
            return results
        swings = SwingDetector.detect_swings(prices, lookback=3)
        highs = SwingDetector.find_swing_highs(swings)
        lows = SwingDetector.find_swing_lows(swings)
        if len(highs) < 2 or len(lows) < 2:
            return results
        h_slope = (highs[-1].price - highs[0].price) / max(1, highs[-1].index - highs[0].index)
        l_slope = (lows[-1].price - lows[0].price) / max(1, lows[-1].index - lows[0].index)
        if h_slope > 0 and l_slope > 0 and abs(h_slope - l_slope) / (abs(h_slope) + 1e-10) < 0.5:
            current = prices[-1].close
            upper = highs[-1].price
            lower = lows[-1].price
            mid = (upper + lower) / 2
            confidence = min(0.80, 0.5 + abs(h_slope) * 10)
            results.append(PatternResult(
                pattern_name=self.display_name,
                category=PatternCategory.CLASSICAL,
                direction=PatternDirection.BULLISH,
                status=PatternStatus.FORMING,
                confidence=round(confidence, 4),
                probability=round(confidence * 0.75, 4),
                expected_target=round(mid + (upper - lower), 2),
                expected_duration=n,
                pattern_quality=round(confidence * 0.8, 4),
                confirmation_score=0.4,
                entry_price=round(lower, 2),
                stop_loss=round(lower - (upper - lower), 2),
                take_profit=round(mid + (upper - lower), 2),
                start_index=0,
                end_index=n - 1,
                key_levels=[round(upper, 2), round(lower, 2)],
                description=f"Channel Up: upper={upper:.2f}, lower={lower:.2f}",
            ))
        return results

    def shutdown(self) -> None: pass


class ChannelDownPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "channel_down"
    @property
    def display_name(self) -> str: return "Channel Down"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 30
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]

    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < 30:
            return results
        swings = SwingDetector.detect_swings(prices, lookback=3)
        highs = SwingDetector.find_swing_highs(swings)
        lows = SwingDetector.find_swing_lows(swings)
        if len(highs) < 2 or len(lows) < 2:
            return results
        h_slope = (highs[-1].price - highs[0].price) / max(1, highs[-1].index - highs[0].index)
        l_slope = (lows[-1].price - lows[0].price) / max(1, lows[-1].index - lows[0].index)
        if h_slope < 0 and l_slope < 0 and abs(h_slope - l_slope) / (abs(h_slope) + 1e-10) < 0.5:
            upper = highs[-1].price
            lower = lows[-1].price
            mid = (upper + lower) / 2
            confidence = min(0.80, 0.5 + abs(l_slope) * 10)
            results.append(PatternResult(
                pattern_name=self.display_name,
                category=PatternCategory.CLASSICAL,
                direction=PatternDirection.BEARISH,
                status=PatternStatus.FORMING,
                confidence=round(confidence, 4),
                probability=round(confidence * 0.75, 4),
                expected_target=round(mid - (upper - lower), 2),
                expected_duration=n,
                pattern_quality=round(confidence * 0.8, 4),
                confirmation_score=0.4,
                entry_price=round(upper, 2),
                stop_loss=round(upper + (upper - lower), 2),
                take_profit=round(mid - (upper - lower), 2),
                start_index=0,
                end_index=n - 1,
                key_levels=[round(upper, 2), round(lower, 2)],
                description=f"Channel Down: upper={upper:.2f}, lower={lower:.2f}",
            ))
        return results

    def shutdown(self) -> None: pass


def _detect_wedge(prices: list[PriceBar], name: str, direction: PatternDirection, is_falling: bool) -> list[PatternResult]:
    results: list[PatternResult] = []
    n = len(prices)
    if n < 30:
        return results
    swings = SwingDetector.detect_swings(prices, lookback=3)
    highs = SwingDetector.find_swing_highs(swings)
    lows = SwingDetector.find_swing_lows(swings)
    if len(highs) < 2 or len(lows) < 2:
        return results
    h_slope = (highs[-1].price - highs[0].price) / max(1, highs[-1].index - highs[0].index)
    l_slope = (lows[-1].price - lows[0].price) / max(1, lows[-1].index - lows[0].index)

    if is_falling:
        is_valid = h_slope < 0 and l_slope < 0 and abs(l_slope) < abs(h_slope) * 0.8
    else:
        is_valid = h_slope > 0 and l_slope > 0 and abs(h_slope) < abs(l_slope) * 0.8

    if not is_valid:
        return results

    current = prices[-1].close
    upper = highs[-1].price
    lower = lows[-1].price
    confidence = min(0.80, 0.5 + min(abs(h_slope), abs(l_slope)) * 20)
    target = upper + (upper - lower) if direction == PatternDirection.BULLISH else lower - (upper - lower)
    status = PatternStatus.CONFIRMED if (direction == PatternDirection.BULLISH and current > upper) or (direction == PatternDirection.BEARISH and current < lower) else PatternStatus.FORMING

    results.append(PatternResult(
        pattern_name=name,
        category=PatternCategory.CLASSICAL,
        direction=direction,
        status=status,
        confidence=round(confidence, 4),
        probability=round(confidence * 0.78, 4),
        risk=round((upper - lower) / (upper + 1e-10), 4),
        expected_target=round(target, 2),
        expected_duration=n,
        pattern_quality=round(confidence * 0.82, 4),
        confirmation_score=round(1.0 if status == PatternStatus.CONFIRMED else 0.4, 4),
        entry_price=round(upper if direction == PatternDirection.BEARISH else lower, 2),
        stop_loss=round(lower if direction == PatternDirection.BEARISH else upper, 2),
        take_profit=round(target, 2),
        start_index=0, end_index=n - 1,
        key_levels=[round(upper, 2), round(lower, 2)],
        description=f"{name}: converging slopes",
    ))
    return results


class FallingWedgePlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "falling_wedge"
    @property
    def display_name(self) -> str: return "Falling Wedge"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 30
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        return _detect_wedge(prices, self.display_name, PatternDirection.BULLISH, True)
    def shutdown(self) -> None: pass


class RisingWedgePlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "rising_wedge"
    @property
    def display_name(self) -> str: return "Rising Wedge"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 30
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        return _detect_wedge(prices, self.display_name, PatternDirection.BEARISH, False)
    def shutdown(self) -> None: pass


class DiamondPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "diamond"
    @property
    def display_name(self) -> str: return "Diamond"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 30
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]

    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < 30:
            return results
        mid = n // 2
        first_half = prices[:mid]
        second_half = prices[mid:]
        first_range = max(p.high for p in first_half) - min(p.low for p in first_half)
        second_range = max(p.high for p in second_half) - min(p.low for p in second_half)
        if second_range > first_range * 1.3 and first_range > 0:
            current = prices[-1].close
            top = max(p.high for p in prices[-mid:])
            bottom = min(p.low for p in prices[-mid:])
            confidence = min(0.75, 0.45 + (second_range / first_range - 1) * 0.3)
            target = bottom - (top - bottom)
            results.append(PatternResult(
                pattern_name=self.display_name,
                category=PatternCategory.CLASSICAL,
                direction=PatternDirection.BEARISH,
                status=PatternStatus.FORMING,
                confidence=round(confidence, 4),
                probability=round(confidence * 0.70, 4),
                expected_target=round(target, 2),
                expected_duration=n,
                pattern_quality=round(confidence * 0.75, 4),
                confirmation_score=0.35,
                key_levels=[round(top, 2), round(bottom, 2)],
                description=f"Diamond: expanding range {first_range:.1f} -> {second_range:.1f}",
            ))
        return results

    def shutdown(self) -> None: pass


class MegaphonePlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "megaphone"
    @property
    def display_name(self) -> str: return "Megaphone"
    @property
    def category(self) -> PatternCategory: return PatternCategory.CLASSICAL
    def initialize(self, **kwargs) -> None: pass
    def min_bars(self) -> int: return 30
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict: return {}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]

    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < 30:
            return results
        swings = SwingDetector.detect_swings(prices, lookback=3)
        highs = SwingDetector.find_swing_highs(swings)
        lows = SwingDetector.find_swing_lows(swings)
        if len(highs) < 3 or len(lows) < 3:
            return results
        h_slope = (highs[-1].price - highs[0].price) / max(1, highs[-1].index - highs[0].index)
        l_slope = (lows[-1].price - lows[0].price) / max(1, lows[-1].index - lows[0].index)
        if h_slope > 0 and l_slope < 0:
            current = prices[-1].close
            top = highs[-1].price
            bottom = lows[-1].price
            confidence = min(0.75, 0.5 + abs(h_slope) * 10 + abs(l_slope) * 10)
            results.append(PatternResult(
                pattern_name=self.display_name,
                category=PatternCategory.CLASSICAL,
                direction=PatternDirection.NEUTRAL,
                status=PatternStatus.FORMING,
                confidence=round(confidence, 4),
                probability=round(confidence * 0.70, 4),
                expected_target=round(top + (top - bottom), 2),
                expected_duration=n,
                pattern_quality=round(confidence * 0.75, 4),
                confirmation_score=0.35,
                key_levels=[round(top, 2), round(bottom, 2)],
                description=f"Megaphone: expanding highs/lows",
            ))
        return results

    def shutdown(self) -> None: pass
