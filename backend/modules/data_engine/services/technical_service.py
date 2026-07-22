from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import date, timedelta
import pandas as pd
import numpy as np

from modules.data_engine.repositories.technical_repository import TechnicalRepository
from modules.data_engine.repositories.price_repository import PriceRepository
from modules.data_engine.repositories.company_repository import CompanyRepository
from modules.data_engine.utils.logger import logger
from modules.data_engine.utils.cache import cache
from app.models.technical.technical_indicator import TechnicalIndicator


class TechnicalService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = TechnicalRepository(db)
        self.price_repository = PriceRepository(db)
        self.company_repository = CompanyRepository(db)

    def get_indicators(self, company_id: str) -> List[TechnicalIndicator]:
        return (
            self.db.query(TechnicalIndicator)
            .filter(TechnicalIndicator.company_id == company_id)
            .order_by(TechnicalIndicator.date.desc())
            .limit(30)
            .all()
        )

    def _calculate_sma(self, series: pd.Series, period: int) -> pd.Series:
        return series.rolling(window=period, min_periods=1).mean()

    def _calculate_ema(self, series: pd.Series, period: int) -> pd.Series:
        return series.ewm(span=period, adjust=False).mean()

    def _calculate_rsi(self, series: pd.Series, period: int = 14) -> pd.Series:
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))

    def _calculate_macd(
        self, series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9
    ) -> tuple[pd.Series, pd.Series]:
        ema_fast = series.ewm(span=fast, adjust=False).mean()
        ema_slow = series.ewm(span=slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        return macd_line, signal_line

    def _calculate_adx(
        self, high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14
    ) -> pd.Series:
        plus_dm = high.diff()
        minus_dm = -low.diff()
        plus_dm[plus_dm < 0] = 0
        minus_dm[minus_dm < 0] = 0
        tr = pd.concat([
            high - low,
            (high - close.shift()).abs(),
            (low - close.shift()).abs(),
        ], axis=1).max(axis=1)
        atr = tr.rolling(window=period).mean()
        plus_di = 100 * (plus_dm.rolling(window=period).mean() / atr)
        minus_di = 100 * (minus_dm.rolling(window=period).mean() / atr)
        dx = 100 * ((plus_di - minus_di).abs() / (plus_di + minus_di))
        adx = dx.rolling(window=period).mean()
        return adx

    def _calculate_atr(
        self, high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14
    ) -> pd.Series:
        tr = pd.concat([
            high - low,
            (high - close.shift()).abs(),
            (low - close.shift()).abs(),
        ], axis=1).max(axis=1)
        return tr.rolling(window=period).mean()

    def _calculate_bollinger(
        self, series: pd.Series, period: int = 20, std_dev: float = 2.0
    ) -> tuple[pd.Series, pd.Series, pd.Series]:
        middle = series.rolling(window=period).mean()
        std = series.rolling(window=period).std()
        upper = middle + (std * std_dev)
        lower = middle - (std * std_dev)
        return upper, middle, lower

    def calculate_indicators(self, price_df: pd.DataFrame) -> pd.DataFrame:
        if price_df.empty or len(price_df) < 2:
            return pd.DataFrame()

        df = price_df.copy()
        df = df.sort_values("date").reset_index(drop=True)

        close = df["close"]
        high = df["high"]
        low = df["low"]
        volume = df["volume"]

        df["sma_9"] = self._calculate_sma(close, 9)
        df["sma_20"] = self._calculate_sma(close, 20)
        df["sma_50"] = self._calculate_sma(close, 50)
        df["sma_100"] = self._calculate_sma(close, 100)
        df["sma_200"] = self._calculate_sma(close, 200)

        df["ema_9"] = self._calculate_ema(close, 9)
        df["ema_20"] = self._calculate_ema(close, 20)
        df["ema_50"] = self._calculate_ema(close, 50)
        df["ema_100"] = self._calculate_ema(close, 100)
        df["ema_200"] = self._calculate_ema(close, 200)

        df["rsi"] = self._calculate_rsi(close)

        macd_line, signal_line = self._calculate_macd(close)
        df["macd"] = macd_line
        df["macd_signal"] = signal_line

        df["adx"] = self._calculate_adx(high, low, close)
        df["atr"] = self._calculate_atr(high, low, close)

        upper, middle, lower = self._calculate_bollinger(close)
        df["bollinger_upper"] = upper
        df["bollinger_middle"] = middle
        df["bollinger_lower"] = lower

        df["obv"] = (np.sign(close.diff()) * volume).fillna(0).cumsum()
        df["vwap"] = (volume * close).cumsum() / volume.cumsum()

        return df

    async def update_technicals_for_company(
        self, stock_code: str, company_id: str
    ) -> dict:
        try:
            cache_key = f"technical_update:{stock_code}"
            if cache.has(cache_key):
                return {"success": True, "message": "Already updated", "count": 0}

            from app.db.database import SessionLocal
            session = SessionLocal()
            try:
                prices = (
                    session.query(
                        __import__("app.models.company.daily_price", fromlist=["DailyPrice"]).DailyPrice
                    )
                    .filter(
                        __import__("app.models.company.daily_price", fromlist=["DailyPrice"]).DailyPrice.company_id == company_id
                    )
                    .order_by(
                        __import__("app.models.company.daily_price", fromlist=["DailyPrice"]).DailyPrice.date.asc()
                    )
                    .all()
                )

                if not prices:
                    return {"success": False, "message": "No price data available"}

                price_data = []
                for p in prices:
                    price_data.append({
                        "date": p.date,
                        "open": p.open,
                        "high": p.high,
                        "low": p.low,
                        "close": p.close,
                        "volume": p.volume,
                    })
                price_df = pd.DataFrame(price_data)
            finally:
                session.close()

            indicators_df = self.calculate_indicators(price_df)
            if indicators_df.empty:
                return {"success": False, "message": "Could not calculate indicators"}

            count = self.repository.upsert_from_dataframe(indicators_df, company_id)
            cache.set(cache_key, True, ttl=3600)
            return {"success": True, "message": f"Updated {count} technical indicators", "count": count}
        except Exception as e:
            logger.error(f"Technical update failed for {stock_code}: {str(e)}")
            return {"success": False, "message": str(e), "count": 0}

    async def update_all_technicals(self, companies: list) -> dict:
        total_updated = 0
        errors = []
        for company in companies:
            result = await self.update_technicals_for_company(
                company.stock_code, company.id
            )
            if result["success"]:
                total_updated += result.get("count", 0)
            else:
                errors.append(f"{company.stock_code}: {result['message']}")
        return {
            "success": len(errors) == 0,
            "total_updated": total_updated,
            "errors": errors,
        }
