from __future__ import annotations

from modules.pattern_engine.core.types import PriceBar, PatternCategory


class PatternValidator:

    @staticmethod
    def validate_prices(prices: list[PriceBar]) -> list[str]:
        errors: list[str] = []
        if not prices:
            errors.append("Price data is empty")
            return errors
        for i, bar in enumerate(prices):
            if bar.high < bar.low:
                errors.append(f"Bar {i}: high ({bar.high}) < low ({bar.low})")
            if bar.high < bar.open or bar.high < bar.close:
                errors.append(f"Bar {i}: high below open or close")
            if bar.low > bar.open or bar.low > bar.close:
                errors.append(f"Bar {i}: low above open or close")
            if bar.volume < 0:
                errors.append(f"Bar {i}: negative volume")
        if len(prices) < 3:
            errors.append("Need at least 3 bars for pattern detection")
        return errors

    @staticmethod
    def validate_category(category: str) -> list[str]:
        errors: list[str] = []
        valid = [c.value for c in PatternCategory]
        if category not in valid:
            errors.append(f"Invalid category '{category}'. Valid: {valid}")
        return errors

    @staticmethod
    def validate_params(params: dict, plugin_params: dict) -> list[str]:
        errors: list[str] = []
        for key, value in params.items():
            if key not in plugin_params:
                errors.append(f"Unknown parameter: {key}")
                continue
            spec = plugin_params[key]
            expected_type = spec.get("type", "float")
            if expected_type == "float" and not isinstance(value, (int, float)):
                errors.append(f"Parameter '{key}' must be a number")
            elif expected_type == "int" and not isinstance(value, int):
                errors.append(f"Parameter '{key}' must be an integer")
            elif expected_type == "bool" and not isinstance(value, bool):
                errors.append(f"Parameter '{key}' must be a boolean")
            if "min" in spec and isinstance(value, (int, float)):
                if value < spec["min"]:
                    errors.append(f"Parameter '{key}' must be >= {spec['min']}")
            if "max" in spec and isinstance(value, (int, float)):
                if value > spec["max"]:
                    errors.append(f"Parameter '{key}' must be <= {spec['max']}")
        return errors

    @staticmethod
    def validate_detection_args(
        prices: list[PriceBar], min_bars: int, params: dict
    ) -> list[str]:
        errors: list[str] = []
        price_errors = PatternValidator.validate_prices(prices)
        errors.extend(price_errors)
        if len(prices) < min_bars:
            errors.append(f"Need at least {min_bars} bars, got {len(prices)}")
        return errors
