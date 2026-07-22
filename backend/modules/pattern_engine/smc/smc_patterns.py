from __future__ import annotations

from modules.pattern_engine.core.base import BasePatternPlugin
from modules.pattern_engine.core.types import (
    PriceBar, PatternResult, PatternCategory, PatternDirection, PatternStatus,
)
from modules.pattern_engine.analysis.analysis_tools import (
    SwingDetector, SupportResistance, BodyCalculator,
)


class BreakOfStructurePlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "bos"
    @property
    def display_name(self) -> str: return "Break of Structure"
    @property
    def category(self) -> PatternCategory: return PatternCategory.SMC
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 5, "tolerance": 0.01}
    def min_bars(self) -> int: return 20
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 5, "min": 2, "max": 15},
            "tolerance": {"type": "float", "default": 0.01, "min": 0.001, "max": 0.05},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 5)
        tolerance = params.get("tolerance", 0.01)
        swings = SwingDetector.detect_swings(prices, lookback=lookback)
        highs = SwingDetector.find_swing_highs(swings)
        lows = SwingDetector.find_swing_lows(swings)
        if len(highs) < 2 and len(lows) < 2:
            return results
        current = prices[-1].close
        for i in range(len(highs) - 1):
            h = highs[i]
            if current > h.price * (1 + tolerance):
                confidence = min(0.85, 0.55 + abs(current - h.price) / h.price * 5)
                target = current + (current - h.price)
                results.append(PatternResult(
                    pattern_name=self.display_name, category=PatternCategory.SMC,
                    direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                    confidence=round(confidence, 4), probability=round(confidence * 0.80, 4),
                    risk=round(tolerance, 4),
                    expected_target=round(target, 2),
                    entry_price=round(current, 2),
                    stop_loss=round(h.price, 2),
                    take_profit=round(target, 2),
                    start_index=h.index, end_index=n - 1,
                    key_levels=[round(h.price, 2)],
                    description=f"BOS bullish: broke {h.price:.2f} at index {h.index}",
                ))
                break
        for i in range(len(lows) - 1):
            l = lows[i]
            if current < l.price * (1 - tolerance):
                confidence = min(0.85, 0.55 + abs(l.price - current) / l.price * 5)
                target = current - (l.price - current)
                results.append(PatternResult(
                    pattern_name=self.display_name, category=PatternCategory.SMC,
                    direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                    confidence=round(confidence, 4), probability=round(confidence * 0.80, 4),
                    risk=round(tolerance, 4),
                    expected_target=round(target, 2),
                    entry_price=round(current, 2),
                    stop_loss=round(l.price, 2),
                    take_profit=round(target, 2),
                    start_index=l.index, end_index=n - 1,
                    key_levels=[round(l.price, 2)],
                    description=f"BOS bearish: broke {l.price:.2f} at index {l.index}",
                ))
                break
        return results
    def shutdown(self) -> None: pass


class ChangeOfCharacterPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "choc"
    @property
    def display_name(self) -> str: return "Change of Character"
    @property
    def category(self) -> PatternCategory: return PatternCategory.SMC
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 5, "trend_bars": 15}
    def min_bars(self) -> int: return 25
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 5, "min": 2, "max": 15},
            "trend_bars": {"type": "int", "default": 15, "min": 5, "max": 50},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 5)
        trend_bars = params.get("trend_bars", 15)
        swings = SwingDetector.detect_swings(prices, lookback=lookback)
        highs = SwingDetector.find_swing_highs(swings)
        lows = SwingDetector.find_swing_lows(swings)
        if len(highs) < 2 or len(lows) < 2:
            return results
        recent_highs = [h for h in highs if h.index >= n - trend_bars]
        recent_lows = [l for l in lows if l.index >= n - trend_bars]
        if not recent_highs or not recent_lows:
            return results
        current = prices[-1].close
        was_uptrend = recent_highs[-1].price > recent_highs[0].price if len(recent_highs) >= 2 else False
        was_downtrend = recent_lows[-1].price < recent_lows[0].price if len(recent_lows) >= 2 else False
        if was_uptrend:
            last_support = min(l.price for l in recent_lows)
            if current < last_support:
                confidence = min(0.82, 0.55 + (last_support - current) / last_support * 3)
                results.append(PatternResult(
                    pattern_name=self.display_name, category=PatternCategory.SMC,
                    direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                    confidence=round(confidence, 4), probability=round(confidence * 0.78, 4),
                    risk=round((last_support - current) / (current + 1e-10), 4),
                    expected_target=round(current - (last_support - current), 2),
                    entry_price=round(current, 2),
                    stop_loss=round(last_support, 2),
                    take_profit=round(current - (last_support - current), 2),
                    start_index=recent_lows[-1].index, end_index=n - 1,
                    key_levels=[round(last_support, 2)],
                    description=f"CHoC bearish: broke support {last_support:.2f} after uptrend",
                ))
        if was_downtrend:
            last_resistance = max(h.price for h in recent_highs)
            if current > last_resistance:
                confidence = min(0.82, 0.55 + (current - last_resistance) / last_resistance * 3)
                results.append(PatternResult(
                    pattern_name=self.display_name, category=PatternCategory.SMC,
                    direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                    confidence=round(confidence, 4), probability=round(confidence * 0.78, 4),
                    risk=round((current - last_resistance) / (current + 1e-10), 4),
                    expected_target=round(current + (current - last_resistance), 2),
                    entry_price=round(current, 2),
                    stop_loss=round(last_resistance, 2),
                    take_profit=round(current + (current - last_resistance), 2),
                    start_index=recent_highs[-1].index, end_index=n - 1,
                    key_levels=[round(last_resistance, 2)],
                    description=f"CHoC bullish: broke resistance {last_resistance:.2f} after downtrend",
                ))
        return results
    def shutdown(self) -> None: pass


class OrderBlockPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "order_block"
    @property
    def display_name(self) -> str: return "Order Block"
    @property
    def category(self) -> PatternCategory: return PatternCategory.SMC
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 5, "move_threshold": 0.02}
    def min_bars(self) -> int: return 15
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 5, "min": 2, "max": 15},
            "move_threshold": {"type": "float", "default": 0.02, "min": 0.005, "max": 0.10},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        threshold = params.get("move_threshold", 0.02)
        lookback = params.get("lookback", 5)
        for i in range(lookback, n - 3):
            ob_bar = prices[i]
            is_bearish_ob = BodyCalculator.is_bearish(ob_bar)
            is_bullish_ob = BodyCalculator.is_bullish(ob_bar)
            if is_bearish_ob:
                move_up = (prices[i + 3].close - ob_bar.close) / (ob_bar.close + 1e-10)
                if move_up > threshold:
                    ob_top = ob_bar.open
                    ob_bottom = ob_bar.close
                    current = prices[-1].close
                    if ob_bottom <= current <= ob_top * 1.02:
                        confidence = min(0.80, 0.50 + move_up * 5)
                        results.append(PatternResult(
                            pattern_name=self.display_name, category=PatternCategory.SMC,
                            direction=PatternDirection.BULLISH, status=PatternStatus.FORMING,
                            confidence=round(confidence, 4), probability=round(confidence * 0.75, 4),
                            risk=round((ob_top - ob_bottom) / (ob_top + 1e-10), 4),
                            expected_target=round(ob_top + (ob_top - ob_bottom) * 2, 2),
                            entry_price=round(ob_top, 2),
                            stop_loss=round(ob_bottom * 0.99, 2),
                            take_profit=round(ob_top + (ob_top - ob_bottom) * 2, 2),
                            start_index=i, end_index=i,
                            key_levels=[round(ob_top, 2), round(ob_bottom, 2)],
                            description=f"Bullish OB: {ob_bar.date} [{ob_bottom:.2f}-{ob_top:.2f}]",
                        ))
            if is_bullish_ob:
                move_down = (ob_bar.close - prices[i + 3].close) / (ob_bar.close + 1e-10)
                if move_down > threshold:
                    ob_top = ob_bar.close
                    ob_bottom = ob_bar.open
                    current = prices[-1].close
                    if ob_bottom * 0.98 <= current <= ob_top:
                        confidence = min(0.80, 0.50 + move_down * 5)
                        results.append(PatternResult(
                            pattern_name=self.display_name, category=PatternCategory.SMC,
                            direction=PatternDirection.BEARISH, status=PatternStatus.FORMING,
                            confidence=round(confidence, 4), probability=round(confidence * 0.75, 4),
                            risk=round((ob_top - ob_bottom) / (ob_top + 1e-10), 4),
                            expected_target=round(ob_bottom - (ob_top - ob_bottom) * 2, 2),
                            entry_price=round(ob_bottom, 2),
                            stop_loss=round(ob_top * 1.01, 2),
                            take_profit=round(ob_bottom - (ob_top - ob_bottom) * 2, 2),
                            start_index=i, end_index=i,
                            key_levels=[round(ob_top, 2), round(ob_bottom, 2)],
                            description=f"Bearish OB: {ob_bar.date} [{ob_bottom:.2f}-{ob_top:.2f}]",
                        ))
        return results
    def shutdown(self) -> None: pass


class BreakerBlockPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "breaker_block"
    @property
    def display_name(self) -> str: return "Breaker Block"
    @property
    def category(self) -> PatternCategory: return PatternCategory.SMC
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 5}
    def min_bars(self) -> int: return 25
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {"lookback": {"type": "int", "default": 5, "min": 2, "max": 15}}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 5)
        swings = SwingDetector.detect_swings(prices, lookback=lookback)
        highs = SwingDetector.find_swing_highs(swings)
        lows = SwingDetector.find_swing_lows(swings)
        if len(highs) < 2 or len(lows) < 2:
            return results
        for i in range(len(lows) - 1):
            l1 = lows[i]
            l2 = lows[i + 1]
            if l2.price < l1.price:
                broken_low = l1
                retested = l2
                for j in range(retested.index, n):
                    if prices[j].close > broken_low.price:
                        current = prices[-1].close
                        distance = abs(current - broken_low.price) / (broken_low.price + 1e-10)
                        if distance < 0.05:
                            confidence = min(0.78, 0.50 + (1 - distance) * 0.28)
                            results.append(PatternResult(
                                pattern_name=self.display_name, category=PatternCategory.SMC,
                                direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                                confidence=round(confidence, 4), probability=round(confidence * 0.72, 4),
                                risk=round(distance, 4),
                                expected_target=round(current - (broken_low.price - current) * 1.5, 2),
                                entry_price=round(current, 2),
                                stop_loss=round(broken_low.price * 1.02, 2),
                                take_profit=round(current - (broken_low.price - current) * 1.5, 2),
                                start_index=broken_low.index, end_index=n - 1,
                                key_levels=[round(broken_low.price, 2)],
                                description=f"Bearish Breaker: old support {broken_low.price:.2f} rejected",
                            ))
                        break
                break
        for i in range(len(highs) - 1):
            h1 = highs[i]
            h2 = highs[i + 1]
            if h2.price > h1.price:
                broken_high = h1
                retested = h2
                for j in range(retested.index, n):
                    if prices[j].close < broken_high.price:
                        current = prices[-1].close
                        distance = abs(current - broken_high.price) / (broken_high.price + 1e-10)
                        if distance < 0.05:
                            confidence = min(0.78, 0.50 + (1 - distance) * 0.28)
                            results.append(PatternResult(
                                pattern_name=self.display_name, category=PatternCategory.SMC,
                                direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                                confidence=round(confidence, 4), probability=round(confidence * 0.72, 4),
                                risk=round(distance, 4),
                                expected_target=round(current + (current - broken_high.price) * 1.5, 2),
                                entry_price=round(current, 2),
                                stop_loss=round(broken_high.price * 0.98, 2),
                                take_profit=round(current + (current - broken_high.price) * 1.5, 2),
                                start_index=broken_high.index, end_index=n - 1,
                                key_levels=[round(broken_high.price, 2)],
                                description=f"Bullish Breaker: old resistance {broken_high.price:.2f} now support",
                            ))
                        break
                break
        return results
    def shutdown(self) -> None: pass


class MitigationBlockPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "mitigation_block"
    @property
    def display_name(self) -> str: return "Mitigation Block"
    @property
    def category(self) -> PatternCategory: return PatternCategory.SMC
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 5, "test_tolerance": 0.02}
    def min_bars(self) -> int: return 20
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 5, "min": 2, "max": 15},
            "test_tolerance": {"type": "float", "default": 0.02, "min": 0.005, "max": 0.10},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        tol = params.get("test_tolerance", 0.02)
        lookback = params.get("lookback", 5)
        for i in range(lookback, n - 5):
            ob_bar = prices[i]
            is_bearish_ob = BodyCalculator.is_bearish(ob_bar)
            is_bullish_ob = BodyCalculator.is_bullish(ob_bar)
            if is_bearish_ob:
                move_up = (prices[min(i + 3, n - 1)].close - ob_bar.close) / (ob_bar.close + 1e-10)
                if move_up > 0.01:
                    ob_top = ob_bar.open
                    test_count = 0
                    for j in range(i + 4, n):
                        if abs(prices[j].high - ob_top) / (ob_top + 1e-10) < tol:
                            test_count += 1
                    if test_count >= 1:
                        current = prices[-1].close
                        if current < ob_top and current > ob_bar.close * 0.97:
                            confidence = min(0.76, 0.50 + test_count * 0.08)
                            results.append(PatternResult(
                                pattern_name=self.display_name, category=PatternCategory.SMC,
                                direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                                confidence=round(confidence, 4), probability=round(confidence * 0.70, 4),
                                expected_target=round(current - (ob_top - current) * 1.5, 2),
                                entry_price=round(current, 2),
                                stop_loss=round(ob_top * 1.02, 2),
                                take_profit=round(current - (ob_top - current) * 1.5, 2),
                                start_index=i, end_index=n - 1,
                                key_levels=[round(ob_top, 2), round(ob_bar.close, 2)],
                                description=f"Bearish Mitigation: OB tested {test_count}x, holding as resistance",
                            ))
            if is_bullish_ob:
                move_down = (ob_bar.close - prices[min(i + 3, n - 1)].close) / (ob_bar.close + 1e-10)
                if move_down > 0.01:
                    ob_bottom = ob_bar.open
                    test_count = 0
                    for j in range(i + 4, n):
                        if abs(prices[j].low - ob_bottom) / (ob_bottom + 1e-10) < tol:
                            test_count += 1
                    if test_count >= 1:
                        current = prices[-1].close
                        if current > ob_bottom and current < ob_bar.close * 1.03:
                            confidence = min(0.76, 0.50 + test_count * 0.08)
                            results.append(PatternResult(
                                pattern_name=self.display_name, category=PatternCategory.SMC,
                                direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                                confidence=round(confidence, 4), probability=round(confidence * 0.70, 4),
                                expected_target=round(current + (current - ob_bottom) * 1.5, 2),
                                entry_price=round(current, 2),
                                stop_loss=round(ob_bottom * 0.98, 2),
                                take_profit=round(current + (current - ob_bottom) * 1.5, 2),
                                start_index=i, end_index=n - 1,
                                key_levels=[round(ob_bottom, 2), round(ob_bar.close, 2)],
                                description=f"Bullish Mitigation: OB tested {test_count}x, holding as support",
                            ))
        return results
    def shutdown(self) -> None: pass


class FairValueGapPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "fair_value_gap"
    @property
    def display_name(self) -> str: return "Fair Value Gap"
    @property
    def category(self) -> PatternCategory: return PatternCategory.SMC
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"min_gap_ratio": 0.002}
    def min_bars(self) -> int: return 5
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {"min_gap_ratio": {"type": "float", "default": 0.002, "min": 0.0005, "max": 0.02}}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < 3:
            return results
        min_gap = params.get("min_gap_ratio", 0.002)
        for i in range(n - 3, max(n - 20, 0), -1):
            c1 = prices[i]
            c2 = prices[i + 1]
            c3 = prices[i + 2]
            bull_gap = c3.low - c1.high
            avg_price = (c1.close + c2.close + c3.close) / 3
            if bull_gap > 0 and bull_gap / (avg_price + 1e-10) > min_gap:
                current = prices[-1].close
                gap_mid = (c1.high + c3.low) / 2
                filled = current < c1.high
                if not filled:
                    confidence = min(0.82, 0.55 + bull_gap / avg_price * 15)
                    results.append(PatternResult(
                        pattern_name=self.display_name, category=PatternCategory.SMC,
                        direction=PatternDirection.BEARISH, status=PatternStatus.FORMING,
                        confidence=round(confidence, 4), probability=round(confidence * 0.76, 4),
                        risk=round(bull_gap / avg_price, 4),
                        expected_target=round(c1.high, 2),
                        entry_price=round(c3.low, 2),
                        stop_loss=round(c2.high * 1.01, 2),
                        take_profit=round(c1.high, 2),
                        start_index=i, end_index=i + 2,
                        key_levels=[round(c1.high, 2), round(c3.low, 2)],
                        description=f"Bullish FVG: gap {bull_gap:.2f} between {c1.high:.2f}-{c3.low:.2f}",
                    ))
                    break
            bear_gap = c1.low - c3.high
            if bear_gap > 0 and bear_gap / (avg_price + 1e-10) > min_gap:
                current = prices[-1].close
                filled = current > c1.low
                if not filled:
                    confidence = min(0.82, 0.55 + bear_gap / avg_price * 15)
                    results.append(PatternResult(
                        pattern_name=self.display_name, category=PatternCategory.SMC,
                        direction=PatternDirection.BULLISH, status=PatternStatus.FORMING,
                        confidence=round(confidence, 4), probability=round(confidence * 0.76, 4),
                        risk=round(bear_gap / avg_price, 4),
                        expected_target=round(c1.low, 2),
                        entry_price=round(c3.high, 2),
                        stop_loss=round(c2.low * 0.99, 2),
                        take_profit=round(c1.low, 2),
                        start_index=i, end_index=i + 2,
                        key_levels=[round(c1.low, 2), round(c3.high, 2)],
                        description=f"Bearish FVG: gap {bear_gap:.2f} between {c1.low:.2f}-{c3.high:.2f}",
                    ))
                    break
        return results
    def shutdown(self) -> None: pass


class LiquidityGrabPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "liquidity_grab"
    @property
    def display_name(self) -> str: return "Liquidity Grab"
    @property
    def category(self) -> PatternCategory: return PatternCategory.SMC
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 5, "grab_pct": 0.003}
    def min_bars(self) -> int: return 20
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 5, "min": 2, "max": 15},
            "grab_pct": {"type": "float", "default": 0.003, "min": 0.001, "max": 0.02},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 5)
        grab_pct = params.get("grab_pct", 0.003)
        swings = SwingDetector.detect_swings(prices, lookback=lookback)
        highs = SwingDetector.find_swing_highs(swings)
        lows = SwingDetector.find_swing_lows(swings)
        current = prices[-1].close
        prev = prices[-2] if n >= 2 else None
        if not prev:
            return results
        for h in highs:
            if h.index < n - 5:
                continue
            sweep_high = max(p.high for p in prices[h.index:n])
            if sweep_high > h.price and current < h.price:
                wick_above = sweep_high - h.price
                body_below = h.price - current
                if wick_above > 0 and body_below > wick_above:
                    confidence = min(0.80, 0.55 + wick_above / h.price * 20)
                    results.append(PatternResult(
                        pattern_name=self.display_name, category=PatternCategory.SMC,
                        direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                        confidence=round(confidence, 4), probability=round(confidence * 0.75, 4),
                        risk=round(grab_pct, 4),
                        expected_target=round(current - (sweep_high - current) * 1.5, 2),
                        entry_price=round(current, 2),
                        stop_loss=round(sweep_high, 2),
                        take_profit=round(current - (sweep_high - current) * 1.5, 2),
                        start_index=h.index, end_index=n - 1,
                        key_levels=[round(h.price, 2), round(sweep_high, 2)],
                        description=f"Bearish Liquidity Grab: swept {sweep_high:.2f}, closed below {h.price:.2f}",
                    ))
                    break
        for l in lows:
            if l.index < n - 5:
                continue
            sweep_low = min(p.low for p in prices[l.index:n])
            if sweep_low < l.price and current > l.price:
                wick_below = l.price - sweep_low
                body_above = current - l.price
                if wick_below > 0 and body_above > wick_below:
                    confidence = min(0.80, 0.55 + wick_below / l.price * 20)
                    results.append(PatternResult(
                        pattern_name=self.display_name, category=PatternCategory.SMC,
                        direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                        confidence=round(confidence, 4), probability=round(confidence * 0.75, 4),
                        risk=round(grab_pct, 4),
                        expected_target=round(current + (current - sweep_low) * 1.5, 2),
                        entry_price=round(current, 2),
                        stop_loss=round(sweep_low, 2),
                        take_profit=round(current + (current - sweep_low) * 1.5, 2),
                        start_index=l.index, end_index=n - 1,
                        key_levels=[round(l.price, 2), round(sweep_low, 2)],
                        description=f"Bullish Liquidity Grab: swept {sweep_low:.2f}, closed above {l.price:.2f}",
                    ))
                    break
        return results
    def shutdown(self) -> None: pass


class LiquiditySweepPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "liquidity_sweep"
    @property
    def display_name(self) -> str: return "Liquidity Sweep"
    @property
    def category(self) -> PatternCategory: return PatternCategory.SMC
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 5, "sweep_ratio": 0.005}
    def min_bars(self) -> int: return 20
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 5, "min": 2, "max": 15},
            "sweep_ratio": {"type": "float", "default": 0.005, "min": 0.001, "max": 0.03},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 5)
        sweep_ratio = params.get("sweep_ratio", 0.005)
        swings = SwingDetector.detect_swings(prices, lookback=lookback)
        highs = SwingDetector.find_swing_highs(swings)
        lows = SwingDetector.find_swing_lows(swings)
        current = prices[-1].close
        for h in highs[-3:]:
            if h.index >= n - 2:
                continue
            swept_high = max(p.high for p in prices[h.index:h.index + 4]) if h.index + 4 <= n else max(p.high for p in prices[h.index:])
            if swept_high > h.price * (1 + sweep_ratio):
                close_below = current < h.price
                if close_below:
                    confidence = min(0.82, 0.55 + (swept_high - h.price) / h.price * 15)
                    results.append(PatternResult(
                        pattern_name=self.display_name, category=PatternCategory.SMC,
                        direction=PatternDirection.BEARISH, status=PatternStatus.CONFIRMED,
                        confidence=round(confidence, 4), probability=round(confidence * 0.77, 4),
                        expected_target=round(current - (swept_high - current), 2),
                        entry_price=round(current, 2),
                        stop_loss=round(swept_high, 2),
                        take_profit=round(current - (swept_high - current), 2),
                        start_index=h.index, end_index=n - 1,
                        key_levels=[round(h.price, 2), round(swept_high, 2)],
                        description=f"Bearish Sweep: {swept_high:.2f} > {h.price:.2f}, closed below",
                    ))
                    break
        for l in lows[-3:]:
            if l.index >= n - 2:
                continue
            swept_low = min(p.low for p in prices[l.index:l.index + 4]) if l.index + 4 <= n else min(p.low for p in prices[l.index:])
            if swept_low < l.price * (1 - sweep_ratio):
                close_above = current > l.price
                if close_above:
                    confidence = min(0.82, 0.55 + (l.price - swept_low) / l.price * 15)
                    results.append(PatternResult(
                        pattern_name=self.display_name, category=PatternCategory.SMC,
                        direction=PatternDirection.BULLISH, status=PatternStatus.CONFIRMED,
                        confidence=round(confidence, 4), probability=round(confidence * 0.77, 4),
                        expected_target=round(current + (current - swept_low), 2),
                        entry_price=round(current, 2),
                        stop_loss=round(swept_low, 2),
                        take_profit=round(current + (current - swept_low), 2),
                        start_index=l.index, end_index=n - 1,
                        key_levels=[round(l.price, 2), round(swept_low, 2)],
                        description=f"Bullish Sweep: {swept_low:.2f} < {l.price:.2f}, closed above",
                    ))
                    break
        return results
    def shutdown(self) -> None: pass


class EqualHighsPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "equal_highs"
    @property
    def display_name(self) -> str: return "Equal Highs"
    @property
    def category(self) -> PatternCategory: return PatternCategory.SMC
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 5, "tolerance": 0.005}
    def min_bars(self) -> int: return 20
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 5, "min": 2, "max": 15},
            "tolerance": {"type": "float", "default": 0.005, "min": 0.001, "max": 0.02},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 5)
        tolerance = params.get("tolerance", 0.005)
        swings = SwingDetector.detect_swings(prices, lookback=lookback)
        highs = SwingDetector.find_swing_highs(swings)
        if len(highs) < 2:
            return results
        for i in range(len(highs) - 1):
            h1 = highs[i]
            h2 = highs[i + 1]
            diff = abs(h1.price - h2.price) / (max(h1.price, h2.price) + 1e-10)
            if diff < tolerance:
                avg_level = (h1.price + h2.price) / 2
                current = prices[-1].close
                bsl_target = avg_level * 1.02
                confidence = min(0.78, 0.55 + (1 - diff / tolerance) * 0.23)
                results.append(PatternResult(
                    pattern_name=self.display_name, category=PatternCategory.SMC,
                    direction=PatternDirection.BEARISH, status=PatternStatus.FORMING,
                    confidence=round(confidence, 4), probability=round(confidence * 0.73, 4),
                    risk=round(diff, 4),
                    expected_target=round(bsl_target, 2),
                    entry_price=round(avg_level, 2),
                    stop_loss=round(avg_level * 1.03, 2),
                    take_profit=round(bsl_target, 2),
                    start_index=h1.index, end_index=h2.index,
                    key_levels=[round(avg_level, 2)],
                    description=f"Equal Highs: {h1.price:.2f} & {h2.price:.2f}, BSL={bsl_target:.2f}",
                ))
        return results
    def shutdown(self) -> None: pass


class EqualLowsPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "equal_lows"
    @property
    def display_name(self) -> str: return "Equal Lows"
    @property
    def category(self) -> PatternCategory: return PatternCategory.SMC
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 5, "tolerance": 0.005}
    def min_bars(self) -> int: return 20
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 5, "min": 2, "max": 15},
            "tolerance": {"type": "float", "default": 0.005, "min": 0.001, "max": 0.02},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 5)
        tolerance = params.get("tolerance", 0.005)
        swings = SwingDetector.detect_swings(prices, lookback=lookback)
        lows = SwingDetector.find_swing_lows(swings)
        if len(lows) < 2:
            return results
        for i in range(len(lows) - 1):
            l1 = lows[i]
            l2 = lows[i + 1]
            diff = abs(l1.price - l2.price) / (max(l1.price, l2.price) + 1e-10)
            if diff < tolerance:
                avg_level = (l1.price + l2.price) / 2
                current = prices[-1].close
                ssl_target = avg_level * 0.98
                confidence = min(0.78, 0.55 + (1 - diff / tolerance) * 0.23)
                results.append(PatternResult(
                    pattern_name=self.display_name, category=PatternCategory.SMC,
                    direction=PatternDirection.BULLISH, status=PatternStatus.FORMING,
                    confidence=round(confidence, 4), probability=round(confidence * 0.73, 4),
                    risk=round(diff, 4),
                    expected_target=round(ssl_target, 2),
                    entry_price=round(avg_level, 2),
                    stop_loss=round(avg_level * 0.97, 2),
                    take_profit=round(ssl_target, 2),
                    start_index=l1.index, end_index=l2.index,
                    key_levels=[round(avg_level, 2)],
                    description=f"Equal Lows: {l1.price:.2f} & {l2.price:.2f}, SSL={ssl_target:.2f}",
                ))
        return results
    def shutdown(self) -> None: pass


class PremiumZonePlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "premium_zone"
    @property
    def display_name(self) -> str: return "Premium Zone"
    @property
    def category(self) -> PatternCategory: return PatternCategory.SMC
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 20}
    def min_bars(self) -> int: return 20
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {"lookback": {"type": "int", "default": 20, "min": 10, "max": 50}}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 20)
        recent = prices[-lookback:]
        swing_high = max(p.high for p in recent)
        swing_low = min(p.low for p in recent)
        equilibrium = (swing_high + swing_low) / 2
        current = prices[-1].close
        if current > equilibrium:
            position_pct = (current - equilibrium) / (swing_high - equilibrium + 1e-10)
            if position_pct < 1.0:
                confidence = min(0.72, 0.45 + position_pct * 0.27)
                results.append(PatternResult(
                    pattern_name=self.display_name, category=PatternCategory.SMC,
                    direction=PatternDirection.BEARISH, status=PatternStatus.FORMING,
                    confidence=round(confidence, 4), probability=round(confidence * 0.70, 4),
                    risk=round(position_pct * 0.05, 4),
                    expected_target=round(equilibrium, 2),
                    entry_price=round(current, 2),
                    stop_loss=round(swing_high * 1.01, 2),
                    take_profit=round(equilibrium, 2),
                    start_index=n - lookback, end_index=n - 1,
                    key_levels=[round(swing_high, 2), round(equilibrium, 2), round(swing_low, 2)],
                    description=f"Premium Zone: price={current:.2f} in premium (eq={equilibrium:.2f})",
                ))
        return results
    def shutdown(self) -> None: pass


class DiscountZonePlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "discount_zone"
    @property
    def display_name(self) -> str: return "Discount Zone"
    @property
    def category(self) -> PatternCategory: return PatternCategory.SMC
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 20}
    def min_bars(self) -> int: return 20
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {"lookback": {"type": "int", "default": 20, "min": 10, "max": 50}}
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 20)
        recent = prices[-lookback:]
        swing_high = max(p.high for p in recent)
        swing_low = min(p.low for p in recent)
        equilibrium = (swing_high + swing_low) / 2
        current = prices[-1].close
        if current < equilibrium:
            position_pct = (equilibrium - current) / (equilibrium - swing_low + 1e-10)
            if position_pct < 1.0:
                confidence = min(0.72, 0.45 + position_pct * 0.27)
                results.append(PatternResult(
                    pattern_name=self.display_name, category=PatternCategory.SMC,
                    direction=PatternDirection.BULLISH, status=PatternStatus.FORMING,
                    confidence=round(confidence, 4), probability=round(confidence * 0.70, 4),
                    risk=round(position_pct * 0.05, 4),
                    expected_target=round(equilibrium, 2),
                    entry_price=round(current, 2),
                    stop_loss=round(swing_low * 0.99, 2),
                    take_profit=round(equilibrium, 2),
                    start_index=n - lookback, end_index=n - 1,
                    key_levels=[round(swing_high, 2), round(equilibrium, 2), round(swing_low, 2)],
                    description=f"Discount Zone: price={current:.2f} in discount (eq={equilibrium:.2f})",
                ))
        return results
    def shutdown(self) -> None: pass


class InducementPlugin(BasePatternPlugin):
    def __init__(self) -> None: pass
    @property
    def name(self) -> str: return "inducement"
    @property
    def display_name(self) -> str: return "Inducement"
    @property
    def category(self) -> PatternCategory: return PatternCategory.SMC
    def initialize(self, **kwargs) -> None: pass
    def get_default_params(self) -> dict: return {"lookback": 5, "inducement_pct": 0.005}
    def min_bars(self) -> int: return 25
    def metadata(self) -> dict: return {"name": self.name, "display_name": self.display_name, "category": self.category.value}
    def parameters(self) -> dict:
        return {
            "lookback": {"type": "int", "default": 5, "min": 2, "max": 15},
            "inducement_pct": {"type": "float", "default": 0.005, "min": 0.001, "max": 0.02},
        }
    def validate(self, prices: list[PriceBar], **params) -> list[str]:
        return [] if len(prices) >= self.min_bars() else [f"Need at least {self.min_bars()} bars"]
    def detect(self, prices: list[PriceBar], **params) -> list[PatternResult]:
        results: list[PatternResult] = []
        n = len(prices)
        if n < self.min_bars():
            return results
        lookback = params.get("lookback", 5)
        pct = params.get("inducement_pct", 0.005)
        swings = SwingDetector.detect_swings(prices, lookback=lookback)
        highs = SwingDetector.find_swing_highs(swings)
        lows = SwingDetector.find_swing_lows(swings)
        if len(highs) < 2 or len(lows) < 2:
            return results
        for i in range(len(lows) - 1):
            l1 = lows[i]
            l2 = lows[i + 1]
            between_highs = [h for h in highs if l1.index < h.index < l2.index]
            if not between_highs:
                continue
            inducement_high = max(h.price for h in between_highs)
            current = prices[-1].close
            if current < inducement_high and current > l1.price:
                swept = any(p.high > inducement_high for p in prices[l2.index:])
                if not swept:
                    conf = min(0.75, 0.50 + (current - l1.price) / (inducement_high - l1.price + 1e-10) * 0.25)
                    results.append(PatternResult(
                        pattern_name=self.display_name, category=PatternCategory.SMC,
                        direction=PatternDirection.BEARISH, status=PatternStatus.FORMING,
                        confidence=round(conf, 4), probability=round(conf * 0.70, 4),
                        expected_target=round(current - (inducement_high - current) * 1.5, 2),
                        entry_price=round(inducement_high, 2),
                        stop_loss=round(inducement_high * 1.02, 2),
                        take_profit=round(current - (inducement_high - current) * 1.5, 2),
                        start_index=l1.index, end_index=l2.index,
                        key_levels=[round(inducement_high, 2), round(l1.price, 2)],
                        description=f"Inducement: minor high {inducement_high:.2f} to be swept",
                    ))
                    break
        for i in range(len(highs) - 1):
            h1 = highs[i]
            h2 = highs[i + 1]
            between_lows = [l for l in lows if h1.index < l.index < h2.index]
            if not between_lows:
                continue
            inducement_low = min(l.price for l in between_lows)
            current = prices[-1].close
            if current > inducement_low and current < h1.price:
                swept = any(p.low < inducement_low for p in prices[h2.index:])
                if not swept:
                    conf = min(0.75, 0.50 + (h1.price - current) / (h1.price - inducement_low + 1e-10) * 0.25)
                    results.append(PatternResult(
                        pattern_name=self.display_name, category=PatternCategory.SMC,
                        direction=PatternDirection.BULLISH, status=PatternStatus.FORMING,
                        confidence=round(conf, 4), probability=round(conf * 0.70, 4),
                        expected_target=round(current + (current - inducement_low) * 1.5, 2),
                        entry_price=round(inducement_low, 2),
                        stop_loss=round(inducement_low * 0.98, 2),
                        take_profit=round(current + (current - inducement_low) * 1.5, 2),
                        start_index=h1.index, end_index=h2.index,
                        key_levels=[round(inducement_low, 2), round(h1.price, 2)],
                        description=f"Inducement: minor low {inducement_low:.2f} to be swept",
                    ))
                    break
        return results
    def shutdown(self) -> None: pass
