from sqlalchemy import Column, String, Float, Boolean, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class Company(BaseModel):
    __tablename__ = "companies"

    stock_code: Mapped[str] = mapped_column(
        String(10), unique=True, nullable=False, index=True
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    sector: Mapped[str] = mapped_column(String(100), nullable=True, index=True)
    sub_sector: Mapped[str] = mapped_column(String(100), nullable=True, index=True)
    market: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    market_value: Mapped[float] = mapped_column(Float, nullable=True)
    free_float: Mapped[float] = mapped_column(Float, nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    kap_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    daily_prices = relationship("DailyPrice", back_populates="company", lazy="dynamic")
    financial_reports = relationship("FinancialReport", back_populates="company", lazy="dynamic")
    financial_ratios = relationship("FinancialRatio", back_populates="company", lazy="dynamic")
    technical_indicators = relationship("TechnicalIndicator", back_populates="company", lazy="dynamic")
    elite_scores = relationship("EliteScore", back_populates="company", lazy="dynamic")
    watchlist_items = relationship("WatchlistItem", back_populates="company", lazy="dynamic")
    backtest_results = relationship("BacktestResult", back_populates="company", lazy="dynamic")
    portfolio_items = relationship("PortfolioItem", back_populates="company", lazy="dynamic")
    ai_analyses = relationship("AIAnalysis", back_populates="company", lazy="dynamic")
    notifications = relationship("Notification", back_populates="company", lazy="dynamic")
    price_statistics = relationship("PriceStatistics", back_populates="company", lazy="dynamic")

    __table_args__ = (
        Index("idx_company_sector_market", "sector", "market"),
        Index("idx_company_active_sector", "active", "sector"),
        Index("idx_company_market_value", "market_value"),
    )
