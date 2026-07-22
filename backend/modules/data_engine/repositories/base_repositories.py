from typing import Optional, List
from sqlalchemy.orm import Session
import pandas as pd
from datetime import date

from app.models.company.company import Company
from app.models.company.daily_price import DailyPrice
from app.models.financial.financial_report import FinancialReport
from app.models.financial.financial_ratio import FinancialRatio
from app.models.technical.technical_indicator import TechnicalIndicator
from app.models.analysis.sector_strength import SectorStrength
from app.models.analysis.market_summary import MarketSummary


class CompanyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_stock_code(self, stock_code: str) -> Optional[Company]:
        return self.db.query(Company).filter(Company.stock_code == stock_code).first()

    def get_all_active(self) -> List[Company]:
        return self.db.query(Company).filter(Company.active == True).all()

    def get_all(self) -> List[Company]:
        return self.db.query(Company).all()

    def upsert_from_dataframe(self, df: pd.DataFrame) -> int:
        count = 0
        for _, row in df.iterrows():
            stock_code = row.get("stock_code", "")
            existing = self.get_by_stock_code(stock_code)
            if existing:
                existing.company_name = row.get("company_name", existing.company_name)
                existing.sector = row.get("sector", existing.sector)
                existing.sub_sector = row.get("sub_sector", existing.sub_sector)
                existing.market = row.get("market", existing.market)
                existing.market_value = row.get("market_value", existing.market_value)
                existing.free_float = row.get("free_float", existing.free_float)
                existing.website = row.get("website", existing.website)
                existing.kap_url = row.get("kap_url", existing.kap_url)
                existing.active = row.get("active", True)
            else:
                company = Company(
                    stock_code=stock_code,
                    company_name=row.get("company_name", stock_code),
                    sector=row.get("sector", ""),
                    sub_sector=row.get("sub_sector", ""),
                    market=row.get("market", ""),
                    market_value=row.get("market_value"),
                    free_float=row.get("free_float"),
                    website=row.get("website"),
                    kap_url=row.get("kap_url"),
                    active=row.get("active", True),
                )
                self.db.add(company)
            count += 1
        self.db.commit()
        return count


class PriceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_company_and_date(
        self, company_id: str, target_date: date
    ) -> Optional[DailyPrice]:
        return (
            self.db.query(DailyPrice)
            .filter(DailyPrice.company_id == company_id, DailyPrice.date == target_date)
            .first()
        )

    def get_latest_date(self, company_id: str) -> Optional[date]:
        result = (
            self.db.query(DailyPrice.date)
            .filter(DailyPrice.company_id == company_id)
            .order_by(DailyPrice.date.desc())
            .first()
        )
        return result[0] if result else None

    def bulk_insert(self, df: pd.DataFrame, company_id: str) -> int:
        count = 0
        for _, row in df.iterrows():
            target_date = row.get("date")
            if isinstance(target_date, str):
                target_date = pd.to_datetime(target_date).date()
            elif hasattr(target_date, "date"):
                target_date = target_date.date()

            existing = self.get_by_company_and_date(company_id, target_date)
            if existing:
                existing.open = row.get("open", existing.open)
                existing.high = row.get("high", existing.high)
                existing.low = row.get("low", existing.low)
                existing.close = row.get("close", existing.close)
                existing.volume = row.get("volume", existing.volume)
                existing.turnover = row.get("turnover", existing.turnover)
            else:
                price = DailyPrice(
                    company_id=company_id,
                    date=target_date,
                    open=row.get("open", 0),
                    high=row.get("high", 0),
                    low=row.get("low", 0),
                    close=row.get("close", 0),
                    volume=row.get("volume", 0),
                    turnover=row.get("turnover", 0),
                )
                self.db.add(price)
            count += 1
        self.db.commit()
        return count


class FinancialRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_company_and_period(
        self, company_id: str, period: str
    ) -> Optional[FinancialReport]:
        return (
            self.db.query(FinancialReport)
            .filter(
                FinancialReport.company_id == company_id,
                FinancialReport.period == period,
            )
            .first()
        )

    def upsert_from_dataframe(self, df: pd.DataFrame, company_id: str) -> int:
        count = 0
        for _, row in df.iterrows():
            period = row.get("period", "")
            existing = self.get_by_company_and_period(company_id, period)
            if existing:
                existing.revenue = row.get("revenue", existing.revenue)
                existing.gross_profit = row.get("gross_profit", existing.gross_profit)
                existing.ebitda = row.get("ebitda", existing.ebitda)
                existing.operating_profit = row.get("operating_profit", existing.operating_profit)
                existing.net_profit = row.get("net_profit", existing.net_profit)
                existing.equity = row.get("equity", existing.equity)
                existing.assets = row.get("assets", existing.assets)
                existing.liabilities = row.get("liabilities", existing.liabilities)
                existing.cash = row.get("cash", existing.cash)
                existing.net_debt = row.get("net_debt", existing.net_debt)
                existing.shares = row.get("shares", existing.shares)
                existing.eps = row.get("eps", existing.eps)
            else:
                report = FinancialReport(
                    company_id=company_id,
                    period=period,
                    year=int(row.get("year", 0)),
                    quarter=int(row.get("quarter", 0)),
                    revenue=row.get("revenue"),
                    gross_profit=row.get("gross_profit"),
                    ebitda=row.get("ebitda"),
                    operating_profit=row.get("operating_profit"),
                    net_profit=row.get("net_profit"),
                    equity=row.get("equity"),
                    assets=row.get("assets"),
                    liabilities=row.get("liabilities"),
                    cash=row.get("cash"),
                    net_debt=row.get("net_debt"),
                    shares=row.get("shares"),
                    eps=row.get("eps"),
                )
                self.db.add(report)
            count += 1
        self.db.commit()
        return count


class TechnicalRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_company_and_date(
        self, company_id: str, target_date: date
    ) -> Optional[TechnicalIndicator]:
        return (
            self.db.query(TechnicalIndicator)
            .filter(
                TechnicalIndicator.company_id == company_id,
                TechnicalIndicator.date == target_date,
            )
            .first()
        )

    def upsert_from_dataframe(self, df: pd.DataFrame, company_id: str) -> int:
        count = 0
        for _, row in df.iterrows():
            target_date = row.get("date")
            if isinstance(target_date, str):
                target_date = pd.to_datetime(target_date).date()
            elif hasattr(target_date, "date"):
                target_date = target_date.date()

            existing = self.get_by_company_and_date(company_id, target_date)
            if existing:
                for col in df.columns:
                    if col not in ["id", "company_id", "date", "created_at", "updated_at"]:
                        if hasattr(existing, col):
                            setattr(existing, col, row.get(col, getattr(existing, col)))
            else:
                indicator = TechnicalIndicator(
                    company_id=company_id,
                    date=target_date,
                    sma_9=row.get("sma_9"),
                    sma_20=row.get("sma_20"),
                    sma_50=row.get("sma_50"),
                    sma_100=row.get("sma_100"),
                    sma_200=row.get("sma_200"),
                    ema_9=row.get("ema_9"),
                    ema_20=row.get("ema_20"),
                    ema_50=row.get("ema_50"),
                    ema_100=row.get("ema_100"),
                    ema_200=row.get("ema_200"),
                    rsi=row.get("rsi"),
                    stochastic_rsi=row.get("stochastic_rsi"),
                    macd=row.get("macd"),
                    macd_signal=row.get("macd_signal"),
                    adx=row.get("adx"),
                    atr=row.get("atr"),
                    obv=row.get("obv"),
                    cmf=row.get("cmf"),
                    vwap=row.get("vwap"),
                    mfi=row.get("mfi"),
                    ichimoku=row.get("ichimoku"),
                    supertrend=row.get("supertrend"),
                    bollinger_upper=row.get("bollinger_upper"),
                    bollinger_middle=row.get("bollinger_middle"),
                    bollinger_lower=row.get("bollinger_lower"),
                    donchian_upper=row.get("donchian_upper"),
                    donchian_lower=row.get("donchian_lower"),
                )
                self.db.add(indicator)
            count += 1
        self.db.commit()
        return count


class SectorRepository:
    def __init__(self, db: Session):
        self.db = db

    def upsert_from_dataframe(self, df: pd.DataFrame) -> int:
        count = 0
        for _, row in df.iterrows():
            sector = row.get("sector", "")
            target_date = row.get("date")
            if isinstance(target_date, str):
                target_date = pd.to_datetime(target_date).date()
            elif hasattr(target_date, "date"):
                target_date = target_date.date()

            existing = (
                self.db.query(SectorStrength)
                .filter(SectorStrength.sector == sector, SectorStrength.date == target_date)
                .first()
            )
            if existing:
                existing.strength_score = row.get("strength_score", existing.strength_score)
                existing.momentum = row.get("momentum", existing.momentum)
                existing.relative_strength = row.get("relative_strength", existing.relative_strength)
                existing.breadth = row.get("breadth", existing.breadth)
            else:
                strength = SectorStrength(
                    sector=sector,
                    date=target_date,
                    strength_score=row.get("strength_score", 0),
                    momentum=row.get("momentum"),
                    relative_strength=row.get("relative_strength"),
                    breadth=row.get("breadth"),
                    leading_stock=row.get("leading_stock"),
                    lagging_stock=row.get("lagging_stock"),
                )
                self.db.add(strength)
            count += 1
        self.db.commit()
        return count


class NewsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_recent(self, limit: int = 50) -> list:
        return []
