from __future__ import annotations

from typing import Any, Optional

import numpy as np
import pandas as pd

from modules.data_engine.providers.base.abstract_provider import AbstractProvider, ProviderConfig
from modules.data_engine.providers.models.enums import (
    ProviderPriority,
    ProviderSource,
    ProviderStatus,
    ProviderType,
)
from modules.data_engine.providers.models.schemas import ProviderHealth
from modules.data_engine.utils.logger import logger


class LocalTechnicalProvider(AbstractProvider):
    """Computes technical indicators locally from price data.

    This provider does NOT fetch from an external source.
    It takes existing price data and calculates indicators.
    """

    def __init__(
        self,
        priority: ProviderPriority = ProviderPriority.PRIMARY,
    ) -> None:
        config = ProviderConfig(
            source=ProviderSource.LOCAL,
            provider_type=ProviderType.TECHNICAL,
            priority=priority,
            enabled=True,
        )
        super().__init__(config)

    async def connect(self) -> bool:
        self._connected = True
        self._health.status = ProviderStatus.ACTIVE
        return True

    async def download(
        self,
        stock_code: Optional[str] = None,
        start_date=None,
        end_date=None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        price_df = kwargs.get("price_df")
        if price_df is None or (isinstance(price_df, pd.DataFrame) and price_df.empty):
            return {"type": "error", "data": "No price data provided"}
        return {"type": "raw_prices", "data": price_df, "stock_code": stock_code}

    async def validate(self, raw_data: Any) -> bool:
        if isinstance(raw_data, dict) and raw_data.get("type") == "raw_prices":
            df = raw_data.get("data")
            if isinstance(df, pd.DataFrame):
                required = ["date", "open", "high", "low", "close", "volume"]
                return all(col in df.columns for col in required)
        return False

    async def transform(self, raw_data: Any) -> list[dict[str, Any]]:
        if not isinstance(raw_data, dict) or raw_data.get("type") != "raw_prices":
            return []
        df = raw_data["data"].copy()
        stock_code = raw_data.get("stock_code", "")
        result = self._calculate_all_indicators(df)
        if "stock_code" not in result.columns:
            result["stock_code"] = stock_code
        return result.to_dict(orient="records")

    async def save(self, data: list[dict[str, Any]]) -> dict[str, Any]:
        return {"saved": len(data), "provider": self.name}

    async def health_check(self) -> ProviderHealth:
        self._health.status = ProviderStatus.ACTIVE
        import datetime

        self._health.last_check = datetime.datetime.now(datetime.timezone.utc)
        return self._health

    def calculate_indicators(self, price_df: pd.DataFrame) -> pd.DataFrame:
        if price_df.empty or len(price_df) < 2:
            return pd.DataFrame()
        df = price_df.copy()
        df = df.sort_values("date").reset_index(drop=True)
        close = df["close"]
        high = df["high"]
        low = df["low"]
        volume = df["volume"]

        for period in [9, 20, 50, 100, 200]:
            df[f"sma_{period}"] = close.rolling(window=period, min_periods=1).mean()
            df[f"ema_{period}"] = close.ewm(span=period, adjust=False).mean()

        df["rsi"] = self._rsi(close)
        macd_line, signal_line = self._macd(close)
        df["macd"] = macd_line
        df["macd_signal"] = signal_line
        df["adx"] = self._adx(high, low, close)
        df["atr"] = self._atr(high, low, close)
        upper, middle, lower = self._bollinger(close)
        df["bollinger_upper"] = upper
        df["bollinger_middle"] = middle
        df["bollinger_lower"] = lower
        df["obv"] = (np.sign(close.diff()) * volume).fillna(0).cumsum()
        df["vwap"] = (volume * close).cumsum() / volume.cumsum()

        return df

    def _calculate_all_indicators(self, price_df: pd.DataFrame) -> pd.DataFrame:
        return self.calculate_indicators(price_df)

    def _rsi(self, series: pd.Series, period: int = 14) -> pd.Series:
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))

    def _macd(
        self, series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
    ) -> tuple[pd.Series, pd.Series]:
        ema_fast = series.ewm(span=fast, adjust=False).mean()
        ema_slow = series.ewm(span=slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        return macd_line, signal_line

    def _adx(
        self, high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14
    ) -> pd.Series:
        plus_dm = high.diff()
        minus_dm = -low.diff()
        plus_dm[plus_dm < 0] = 0
        minus_dm[minus_dm < 0] = 0
        tr = pd.concat(
            [high - low, (high - close.shift()).abs(), (low - close.shift()).abs()],
            axis=1,
        ).max(axis=1)
        atr = tr.rolling(window=period).mean()
        plus_di = 100 * (plus_dm.rolling(window=period).mean() / atr)
        minus_di = 100 * (minus_dm.rolling(window=period).mean() / atr)
        dx = 100 * ((plus_di - minus_di).abs() / (plus_di + minus_di))
        adx = dx.rolling(window=period).mean()
        return adx

    def _atr(
        self, high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14
    ) -> pd.Series:
        tr = pd.concat(
            [high - low, (high - close.shift()).abs(), (low - close.shift()).abs()],
            axis=1,
        ).max(axis=1)
        return tr.rolling(window=period).mean()

    def _bollinger(
        self, series: pd.Series, period: int = 20, std_dev: float = 2.0
    ) -> tuple[pd.Series, pd.Series, pd.Series]:
        middle = series.rolling(window=period).mean()
        std = series.rolling(window=period).std()
        upper = middle + (std * std_dev)
        lower = middle - (std * std_dev)
        return upper, middle, lower
