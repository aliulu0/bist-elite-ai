from sqlalchemy import Column, String, Float, Integer, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class PortfolioItem(BaseModel):
    __tablename__ = "portfolio_items"

    portfolio_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False
    )
    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    average_price: Mapped[float] = mapped_column(Float, nullable=False)
    current_price: Mapped[float] = mapped_column(Float, nullable=True)
    profit: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    profit_percent: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    portfolio = relationship("Portfolio", back_populates="items")
    company = relationship("Company", back_populates="portfolio_items")

    __table_args__ = (
        Index("idx_portfolio_item_portfolio_id", "portfolio_id"),
        Index("idx_portfolio_item_company_id", "company_id"),
        Index("idx_portfolio_item_portfolio_company", "portfolio_id", "company_id", unique=True),
    )
