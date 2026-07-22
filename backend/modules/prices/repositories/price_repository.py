from datetime import date, timedelta
from sqlalchemy import select, func, desc, and_, extract, text
from sqlalchemy.orm import Session

from app.models.company.daily_price import DailyPrice
from app.models.company.company import Company
from modules.prices.models.price_statistics import PriceStatistics
from modules.prices.models.price_update_log import PriceUpdateLog


class PriceRepository:

    def __init__(self, db: Session):
        self._db = db

    def get_company_by_stock_code(self, stock_code: str) -> Company | None:
        stmt = select(Company).where(Company.stock_code == stock_code.upper().strip())
        return self._db.execute(stmt).scalar_one_or_none()

    def get_prices(
        self,
        company_id: str,
        start_date: date | None = None,
        end_date: date | None = None,
        limit: int | None = None,
        order_desc: bool = False,
    ) -> list[DailyPrice]:
        stmt = select(DailyPrice).where(DailyPrice.company_id == company_id)
        if start_date:
            stmt = stmt.where(DailyPrice.date >= start_date)
        if end_date:
            stmt = stmt.where(DailyPrice.date <= end_date)
        if order_desc:
            stmt = stmt.order_by(desc(DailyPrice.date))
        else:
            stmt = stmt.order_by(DailyPrice.date)
        if limit:
            stmt = stmt.limit(limit)
        return list(self._db.execute(stmt).scalars().all())

    def get_latest_price(self, company_id: str) -> DailyPrice | None:
        stmt = (
            select(DailyPrice)
            .where(DailyPrice.company_id == company_id)
            .order_by(desc(DailyPrice.date))
            .limit(1)
        )
        return self._db.execute(stmt).scalar_one_or_none()

    def get_weekly_prices(self, company_id: str, limit: int = 52) -> list[DailyPrice]:
        stmt = (
            select(DailyPrice)
            .where(DailyPrice.company_id == company_id)
            .order_by(desc(DailyPrice.date))
            .limit(limit * 7)
        )
        all_prices = list(self._db.execute(stmt).scalars().all())
        if not all_prices:
            return []

        weekly: list[DailyPrice] = []
        current_week = None
        week_bar: DailyPrice | None = None

        for p in all_prices:
            pdate = p.date
            iso_week = pdate.isocalendar()[:2]

            if current_week != iso_week:
                if week_bar is not None:
                    weekly.append(week_bar)
                    if len(weekly) >= limit:
                        break
                current_week = iso_week
                week_bar = DailyPrice(
                    id=p.id,
                    company_id=p.company_id,
                    stock_code=p.stock_code,
                    date=pdate,
                    open=p.open,
                    high=p.high,
                    low=p.low,
                    close=p.close,
                    adjusted_close=p.adjusted_close,
                    volume=p.volume,
                    turnover=p.turnover,
                    vwap=p.vwap,
                    trade_count=p.trade_count,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                )
            else:
                if week_bar is not None:
                    week_bar.high = max(week_bar.high, p.high)
                    week_bar.low = min(week_bar.low, p.low)
                    week_bar.volume += p.volume
                    week_bar.turnover += p.turnover
                    week_bar.date = min(week_bar.date, pdate)

        if week_bar is not None and len(weekly) < limit:
            weekly.append(week_bar)

        weekly.sort(key=lambda x: x.date)
        return weekly

    def get_monthly_prices(self, company_id: str, limit: int = 24) -> list[DailyPrice]:
        stmt = (
            select(DailyPrice)
            .where(DailyPrice.company_id == company_id)
            .order_by(desc(DailyPrice.date))
            .limit(limit * 31)
        )
        all_prices = list(self._db.execute(stmt).scalars().all())
        if not all_prices:
            return []

        monthly: list[DailyPrice] = []
        current_month = None
        month_bar: DailyPrice | None = None

        for p in all_prices:
            pdate = p.date
            month_key = (pdate.year, pdate.month)

            if current_month != month_key:
                if month_bar is not None:
                    monthly.append(month_bar)
                    if len(monthly) >= limit:
                        break
                current_month = month_key
                month_bar = DailyPrice(
                    id=p.id,
                    company_id=p.company_id,
                    stock_code=p.stock_code,
                    date=pdate,
                    open=p.open,
                    high=p.high,
                    low=p.low,
                    close=p.close,
                    adjusted_close=p.adjusted_close,
                    volume=p.volume,
                    turnover=p.turnover,
                    vwap=p.vwap,
                    trade_count=p.trade_count,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                )
            else:
                if month_bar is not None:
                    month_bar.high = max(month_bar.high, p.high)
                    month_bar.low = min(month_bar.low, p.low)
                    month_bar.volume += p.volume
                    month_bar.turnover += p.turnover
                    month_bar.date = min(month_bar.date, pdate)

        if month_bar is not None and len(monthly) < limit:
            monthly.append(month_bar)

        monthly.sort(key=lambda x: x.date)
        return monthly

    def get_prices_for_date(self, target_date: date, stock_codes: list[str] | None = None) -> list[DailyPrice]:
        stmt = (
            select(DailyPrice)
            .join(Company, DailyPrice.company_id == Company.id)
            .where(DailyPrice.date == target_date)
        )
        if stock_codes:
            stmt = stmt.where(Company.stock_code.in_([s.upper().strip() for s in stock_codes]))
        stmt = stmt.order_by(Company.stock_code)
        return list(self._db.execute(stmt).scalars().all())

    def upsert_price(self, company_id: str, price_data: dict) -> DailyPrice:
        stmt = select(DailyPrice).where(
            and_(
                DailyPrice.company_id == company_id,
                DailyPrice.date == price_data["date"],
            )
        )
        existing = self._db.execute(stmt).scalar_one_or_none()

        if existing:
            existing.open = price_data.get("open", existing.open)
            existing.high = price_data.get("high", existing.high)
            existing.low = price_data.get("low", existing.low)
            existing.close = price_data.get("close", existing.close)
            existing.adjusted_close = price_data.get("adjusted_close", existing.adjusted_close)
            existing.volume = price_data.get("volume", existing.volume)
            existing.turnover = price_data.get("turnover", existing.turnover)
            existing.vwap = price_data.get("vwap", existing.vwap)
            existing.trade_count = price_data.get("trade_count", existing.trade_count)
            existing.stock_code = price_data.get("stock_code", existing.stock_code)
            self._db.flush()
            return existing

        price = DailyPrice(
            company_id=company_id,
            stock_code=price_data.get("stock_code"),
            date=price_data["date"],
            open=price_data["open"],
            high=price_data["high"],
            low=price_data["low"],
            close=price_data["close"],
            adjusted_close=price_data.get("adjusted_close"),
            volume=price_data.get("volume", 0),
            turnover=price_data.get("turnover", 0),
            vwap=price_data.get("vwap"),
            trade_count=price_data.get("trade_count"),
        )
        self._db.add(price)
        self._db.flush()
        return price

    def bulk_upsert(self, company_id: str, prices: list[dict]) -> tuple[int, int]:
        added = 0
        updated = 0
        for p in prices:
            stmt = select(DailyPrice).where(
                and_(
                    DailyPrice.company_id == company_id,
                    DailyPrice.date == p["date"],
                )
            )
            existing = self._db.execute(stmt).scalar_one_or_none()
            if existing:
                existing.open = p.get("open", existing.open)
                existing.high = p.get("high", existing.high)
                existing.low = p.get("low", existing.low)
                existing.close = p.get("close", existing.close)
                existing.adjusted_close = p.get("adjusted_close", existing.adjusted_close)
                existing.volume = p.get("volume", existing.volume)
                existing.turnover = p.get("turnover", existing.turnover)
                existing.vwap = p.get("vwap", existing.vwap)
                existing.trade_count = p.get("trade_count", existing.trade_count)
                existing.stock_code = p.get("stock_code", existing.stock_code)
                updated += 1
            else:
                price = DailyPrice(
                    company_id=company_id,
                    stock_code=p.get("stock_code"),
                    date=p["date"],
                    open=p["open"],
                    high=p["high"],
                    low=p["low"],
                    close=p["close"],
                    adjusted_close=p.get("adjusted_close"),
                    volume=p.get("volume", 0),
                    turnover=p.get("turnover", 0),
                    vwap=p.get("vwap"),
                    trade_count=p.get("trade_count"),
                )
                self._db.add(price)
                added += 1
        self._db.flush()
        return added, updated

    def get_price_statistics(self, company_id: str, as_of_date: date | None = None) -> PriceStatistics | None:
        stmt = select(PriceStatistics).where(PriceStatistics.company_id == company_id)
        if as_of_date:
            stmt = stmt.where(PriceStatistics.as_of_date == as_of_date)
        else:
            stmt = stmt.order_by(desc(PriceStatistics.as_of_date)).limit(1)
        return self._db.execute(stmt).scalar_one_or_none()

    def upsert_statistics(self, company_id: str, as_of_date: date, stats_data: dict) -> PriceStatistics:
        stmt = select(PriceStatistics).where(
            and_(
                PriceStatistics.company_id == company_id,
                PriceStatistics.as_of_date == as_of_date,
            )
        )
        existing = self._db.execute(stmt).scalar_one_or_none()

        if existing:
            for key, value in stats_data.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
            self._db.flush()
            return existing

        stats = PriceStatistics(company_id=company_id, as_of_date=as_of_date, **stats_data)
        self._db.add(stats)
        self._db.flush()
        return stats

    def get_all_active_companies(self) -> list[Company]:
        stmt = select(Company).where(Company.active == True).order_by(Company.stock_code)
        return list(self._db.execute(stmt).scalars().all())

    def log_update(self, log_data: dict) -> PriceUpdateLog:
        log = PriceUpdateLog(**log_data)
        self._db.add(log)
        self._db.flush()
        return log

    def get_update_logs(self, limit: int = 50) -> list[PriceUpdateLog]:
        stmt = select(PriceUpdateLog).order_by(desc(PriceUpdateLog.started_at)).limit(limit)
        return list(self._db.execute(stmt).scalars().all())

    def get_volume_averages(self, company_id: str, max_period: int = 200) -> dict[str, float | None]:
        stmt = (
            select(DailyPrice)
            .where(DailyPrice.company_id == company_id)
            .order_by(desc(DailyPrice.date))
            .limit(max_period)
        )
        prices = list(self._db.execute(stmt).scalars().all())

        result: dict[str, float | None] = {}
        for period in [5, 10, 20, 50, 100, 200]:
            key = f"avg_volume_{period}"
            if len(prices) >= period:
                vol_sum = sum(p.volume for p in prices[:period])
                result[key] = vol_sum / period
            else:
                result[key] = None
        return result

    def commit(self) -> None:
        self._db.commit()

    def rollback(self) -> None:
        self._db.rollback()
