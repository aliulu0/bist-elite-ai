from __future__ import annotations

import math
import random
from typing import Dict, List, Optional

from modules.backtest_engine.core.types import PriceBar, MarketPeriod, classify_market_period


class DatasetManager:
    """Manages historical price data for backtesting."""

    def __init__(self) -> None:
        self._cache: Dict[str, List[PriceBar]] = {}

    def get_data(
        self,
        symbol: str,
        start_date: str = "",
        end_date: str = "",
    ) -> List[PriceBar]:
        key = f"{symbol}:{start_date}:{end_date}"
        if key in self._cache:
            return list(self._cache[key])
        data = self._generate_sample_data(symbol, start_date, end_date)
        self._cache[key] = data
        return list(data)

    def add_data(self, symbol: str, bars: List[PriceBar]) -> None:
        key = f"{symbol}::"
        self._cache[key] = list(bars)

    def get_latest_price(self, symbol: str) -> Optional[PriceBar]:
        key = f"{symbol}::"
        bars = self._cache.get(key, [])
        return bars[-1] if bars else None

    def symbols(self) -> List[str]:
        seen: set = set()
        for key in self._cache:
            sym = key.split(":")[0]
            seen.add(sym)
        return list(seen)

    def clear(self) -> int:
        count = len(self._cache)
        self._cache.clear()
        return count

    def bar_count(self, symbol: str) -> int:
        return sum(1 for k in self._cache if k.startswith(f"{symbol}:"))

    def detect_market_period(
        self,
        symbol: str,
        lookback_days: int = 252,
    ) -> MarketPeriod:
        bars = self.get_data(symbol)
        if len(bars) < 2:
            return MarketPeriod.SIDEWAYS
        recent = bars[-lookback_days:] if len(bars) >= lookback_days else bars
        returns = [
            (recent[i].close - recent[i - 1].close) / recent[i - 1].close
            for i in range(1, len(recent))
            if recent[i - 1].close > 0
        ]
        if not returns:
            return MarketPeriod.SIDEWAYS
        volatility = (sum((r - sum(returns) / len(returns)) ** 2 for r in returns) / len(returns)) ** 0.5 * 252 ** 0.5 * 100
        return classify_market_period(returns, volatility)

    def _generate_sample_data(
        self,
        symbol: str,
        start_date: str = "",
        end_date: str = "",
    ) -> List[PriceBar]:
        bars: List[PriceBar] = []
        base_price = self._base_price_for_symbol(symbol)
        price = base_price
        seed = hash(symbol) % 10000
        rng = random.Random(seed)
        num_days = 504

        for i in range(num_days):
            day = i
            year = 2023 + day // 252
            doy = day % 252 + 1
            month = (doy - 1) // 21 + 1
            dom = (doy - 1) % 21 + 1
            ts = f"{year}-{month:02d}-{dom:02d}"

            drift = rng.gauss(0.0003, 0.015)
            new_price = price * (1 + drift)
            new_price = max(new_price, base_price * 0.2)

            high = new_price * (1 + abs(rng.gauss(0, 0.008)))
            low = new_price * (1 - abs(rng.gauss(0, 0.008)))
            open_p = price * (1 + rng.gauss(0, 0.003))
            vol = rng.uniform(500000, 5000000)

            bars.append(PriceBar(
                timestamp=ts,
                open=round(open_p, 2),
                high=round(max(high, open_p, new_price), 2),
                low=round(min(low, open_p, new_price), 2),
                close=round(new_price, 2),
                volume=round(vol),
                symbol=symbol,
            ))
            price = new_price
        return bars

    def _base_price_for_symbol(self, symbol: str) -> float:
        prices = {
            "TUPRS": 180.0, "GARAN": 130.0, "AKBNK": 55.0, "EREGL": 55.0,
            "BIMAS": 600.0, "KCHOL": 200.0, "ASELS": 70.0, "THYAO": 300.0,
            "SISE": 50.0, "KOZA": 150.0, "TCELL": 90.0, "HALKB": 15.0,
        }
        return prices.get(symbol, 100.0)
