from sqlalchemy import Column, String, Float, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import SoftDeleteModel


class Portfolio(SoftDeleteModel):
    __tablename__ = "portfolios"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    total_value: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_profit: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    items = relationship("PortfolioItem", back_populates="portfolio", lazy="selectin")

    __table_args__ = (
        Index("idx_portfolio_name", "name"),
    )
