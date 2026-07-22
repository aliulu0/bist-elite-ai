from sqlalchemy import Column, String, Integer, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class Watchlist(BaseModel):
    __tablename__ = "watchlists"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    items = relationship("WatchlistItem", back_populates="watchlist", lazy="selectin")

    __table_args__ = (
        Index("idx_watchlist_name", "name"),
        Index("idx_watchlist_sort_order", "sort_order"),
    )
