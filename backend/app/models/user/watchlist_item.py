from sqlalchemy import Column, String, Integer, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class WatchlistItem(BaseModel):
    __tablename__ = "watchlist_items"

    watchlist_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("watchlists.id", ondelete="CASCADE"), nullable=False
    )
    company_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    watchlist = relationship("Watchlist", back_populates="items")
    company = relationship("Company", back_populates="watchlist_items")

    __table_args__ = (
        Index("idx_watchlist_item_watchlist_id", "watchlist_id"),
        Index("idx_watchlist_item_company_id", "company_id"),
        Index("idx_watchlist_item_watchlist_company", "watchlist_id", "company_id", unique=True),
    )
