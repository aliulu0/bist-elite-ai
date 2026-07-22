import math
from datetime import date, timedelta
from dataclasses import dataclass, field

import numpy as np


@dataclass
class PriceBar:
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: float
    turnover: float = 0.0


class CalculationService:

    @staticmethod
    def calculate_returns(prices: list[PriceBar]) -> dict[str, float | None]:
        result: dict[str, float | None] = {
            "daily_return": None,
            "weekly_return": None,
            "monthly_return": None,
            "yearly_return": None,
            "log_return": None,
        }
        if len(prices) < 2:
            return result

        current = prices[-1]
        prev = prices[-2]

        if prev.close > 0:
            result["daily_return"] = (current.close - prev.close) / prev.close
            result["log_return"] = math.log(current.close / prev.close)

        if len(prices) >= 5:
            result["weekly_return"] = (current.close - prices[-5].close) / prices[-5].close

        if len(prices) >= 22:
            result["monthly_return"] = (current.close - prices[-22].close) / prices[-22].close

        if len(prices) >= 252:
            result["yearly_return"] = (current.close - prices[-252].close) / prices[-252].close

        return result

    @staticmethod
    def calculate_volatility(prices: list[PriceBar], window: int = 20) -> dict[str, float | None]:
        result: dict[str, float | None] = {
            "historical_volatility": None,
            "atr_data": None,
            "avg_daily_range": None,
        }
        if len(prices) < window + 1:
            return result

        closes = [p.close for p in prices]
        returns = [
            math.log(closes[i] / closes[i - 1])
            for i in range(1, len(closes))
            if closes[i - 1] > 0
        ]
        if len(returns) >= window:
            recent = returns[-window:]
            std = float(np.std(recent, ddof=1)) if len(recent) > 1 else 0.0
            result["historical_volatility"] = std * math.sqrt(252)

        tr_list: list[float] = []
        for i in range(1, len(prices)):
            curr = prices[i]
            prev = prices[i - 1]
            tr = max(
                curr.high - curr.low,
                abs(curr.high - prev.close),
                abs(curr.low - prev.close),
            )
            tr_list.append(tr)

        if len(tr_list) >= window:
            result["atr_data"] = float(np.mean(tr_list[-window:]))

        ranges = [p.high - p.low for p in prices[-window:] if p.high >= p.low]
        if ranges:
            result["avg_daily_range"] = float(np.mean(ranges))

        return result

    @staticmethod
    def calculate_liquidity(
        prices: list[PriceBar],
        current_volume: float,
        avg_volume_20: float | None,
        turnover: float,
        market_cap: float | None = None,
    ) -> dict[str, float | None]:
        result: dict[str, float | None] = {
            "relative_volume": None,
            "volume_ratio": None,
            "turnover_ratio": None,
            "liquidity_score": None,
        }

        if avg_volume_20 and avg_volume_20 > 0:
            result["relative_volume"] = current_volume / avg_volume_20

        if len(prices) >= 20:
            vols = [p.volume for p in prices[-20:]]
            avg_vol = float(np.mean(vols)) if vols else 0
            if avg_vol > 0:
                result["volume_ratio"] = current_volume / avg_vol

        if market_cap and market_cap > 0:
            result["turnover_ratio"] = (turnover / market_cap) * 100

        scores: list[float] = []
        if result["relative_volume"] is not None:
            scores.append(min(result["relative_volume"] / 2.0, 1.0))
        if result["volume_ratio"] is not None:
            scores.append(min(result["volume_ratio"] / 2.0, 1.0))
        if result["turnover_ratio"] is not None:
            scores.append(min(result["turnover_ratio"] / 5.0, 1.0))

        if scores:
            result["liquidity_score"] = float(np.mean(scores))

        return result

    @staticmethod
    def calculate_gaps(prices: list[PriceBar]) -> dict[str, bool]:
        result = {"gap_up": False, "gap_down": False}
        if len(prices) < 2:
            return result

        current = prices[-1]
        prev = prices[-2]

        if prev.close > 0:
            gap_pct = (current.open - prev.close) / prev.close
            if gap_pct > 0.01:
                result["gap_up"] = True
            elif gap_pct < -0.01:
                result["gap_down"] = True

        return result

    @staticmethod
    def calculate_extremes(prices: list[PriceBar]) -> dict[str, float | None]:
        result: dict[str, float | None] = {
            "week_52_high": None,
            "week_52_low": None,
            "all_time_high": None,
            "all_time_low": None,
        }
        if not prices:
            return result

        result["all_time_high"] = max(p.high for p in prices)
        result["all_time_low"] = min(p.low for p in prices)

        year_ago = prices[-1].date - timedelta(days=365)
        year_prices = [p for p in prices if p.date >= year_ago]
        if year_prices:
            result["week_52_high"] = max(p.high for p in year_prices)
            result["week_52_low"] = min(p.low for p in year_prices)

        return result

    @staticmethod
    def calculate_trend(prices: list[PriceBar]) -> dict:
        result: dict = {
            "higher_high": None,
            "lower_low": None,
            "higher_low": None,
            "lower_high": None,
            "trend_direction": None,
        }
        if len(prices) < 3:
            return result

        curr = prices[-1]
        prev = prices[-2]
        prev2 = prices[-3]

        result["higher_high"] = curr.high > prev.high
        result["lower_low"] = curr.low < prev.low
        result["higher_low"] = curr.low > prev.low
        result["lower_high"] = curr.high < prev.high

        if result["higher_high"] and result["higher_low"]:
            result["trend_direction"] = "UPTREND"
        elif result["lower_low"] and result["lower_high"]:
            result["trend_direction"] = "DOWNTREND"
        elif result["higher_high"] and result["lower_low"]:
            result["trend_direction"] = "VOLATILE"
        else:
            result["trend_direction"] = "SIDEWAYS"

        return result

    @staticmethod
    def calculate_volume_averages(prices: list[PriceBar]) -> dict[str, float | None]:
        result: dict[str, float | None] = {}
        volumes = [p.volume for p in prices]
        for period in [5, 10, 20, 50, 100, 200]:
            key = f"avg_volume_{period}"
            if len(volumes) >= period:
                result[key] = float(np.mean(volumes[-period:]))
            else:
                result[key] = None
        return result

    @staticmethod
    def compute_all(prices: list[PriceBar], market_cap: float | None = None) -> dict:
        if not prices:
            return {}

        current = prices[-1]
        volume_averages = CalculationService.calculate_volume_averages(prices)
        avg_vol_20 = volume_averages.get("avg_volume_20")

        returns = CalculationService.calculate_returns(prices)
        volatility = CalculationService.calculate_volatility(prices)
        liquidity = CalculationService.calculate_liquidity(
            prices, current.volume, avg_vol_20, current.turnover, market_cap
        )
        gaps = CalculationService.calculate_gaps(prices)
        extremes = CalculationService.calculate_extremes(prices)
        trend = CalculationService.calculate_trend(prices)

        stats: dict = {}
        stats.update(volume_averages)
        stats.update(returns)
        stats.update(volatility)
        stats.update(liquidity)
        stats.update(gaps)
        stats.update(extremes)
        stats.update(trend)

        return stats
