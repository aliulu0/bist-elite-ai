import logging
from datetime import date
from typing import Any

logger = logging.getLogger(__name__)


class PriceProvider:

    def fetch_prices(
        self,
        stock_code: str,
        start_date: date,
        end_date: date,
    ) -> list[dict[str, Any]]:
        symbol = self._to_yahoo_symbol(stock_code)
        try:
            import yfinance as yf
            ticker = yf.Ticker(symbol)
            df = ticker.history(
                start=start_date.isoformat(),
                end=end_date.isoformat() if end_date <= date.today() else date.today().isoformat(),
                auto_adjust=False,
            )
            if df.empty:
                logger.info(f"No data returned for {symbol} ({start_date} to {end_date})")
                return []

            prices: list[dict[str, Any]] = []
            for idx, row in df.iterrows():
                trade_date = idx.date() if hasattr(idx, "date") else idx
                prices.append({
                    "stock_code": stock_code.upper().strip(),
                    "date": trade_date,
                    "open": float(row.get("Open", 0)),
                    "high": float(row.get("High", 0)),
                    "low": float(row.get("Low", 0)),
                    "close": float(row.get("Close", 0)),
                    "adjusted_close": float(row.get("Adj Close", row.get("Close", 0))),
                    "volume": float(row.get("Volume", 0)),
                    "turnover": float(row.get("Volume", 0)) * float(row.get("Close", 0)),
                    "vwap": None,
                    "trade_count": None,
                })
            logger.info(f"Fetched {len(prices)} records for {symbol}")
            return prices

        except ImportError:
            logger.warning("yfinance not installed, generating mock data")
            return self._generate_mock(stock_code, start_date, end_date)
        except Exception as e:
            logger.error(f"Error fetching {symbol}: {e}")
            return []

    @staticmethod
    def _to_yahoo_symbol(stock_code: str) -> str:
        code = stock_code.upper().strip()
        if code.endswith(".IS"):
            return code
        return f"{code}.IS"

    @staticmethod
    def _generate_mock(
        stock_code: str,
        start_date: date,
        end_date: date,
    ) -> list[dict[str, Any]]:
        import random
        random.seed(hash(stock_code))

        prices: list[dict[str, Any]] = []
        current_date = start_date
        base_price = 50.0 + random.uniform(-20, 200)

        while current_date <= end_date:
            if current_date.weekday() < 5:
                change_pct = random.gauss(0, 0.02)
                open_price = base_price * (1 + random.gauss(0, 0.005))
                close_price = open_price * (1 + change_pct)
                high_price = max(open_price, close_price) * (1 + abs(random.gauss(0, 0.01)))
                low_price = min(open_price, close_price) * (1 - abs(random.gauss(0, 0.01)))
                volume = random.randint(100000, 10000000)
                turnover = volume * close_price

                prices.append({
                    "stock_code": stock_code.upper().strip(),
                    "date": current_date,
                    "open": round(open_price, 2),
                    "high": round(high_price, 2),
                    "low": round(low_price, 2),
                    "close": round(close_price, 2),
                    "adjusted_close": round(close_price, 2),
                    "volume": float(volume),
                    "turnover": round(turnover, 2),
                    "vwap": None,
                    "trade_count": None,
                })

                base_price = close_price
            current_date = date.fromordinal(current_date.toordinal() + 1)

        return prices
