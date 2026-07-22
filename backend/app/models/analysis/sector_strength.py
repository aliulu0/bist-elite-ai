from sqlalchemy import Column, String, Float, Date, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_model import BaseModel


class SectorStrength(BaseModel):
    __tablename__ = "sector_strength"

    sector: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    date: Mapped[str] = mapped_column(Date, nullable=False)
    strength_score: Mapped[float] = mapped_column(Float, nullable=False)
    momentum: Mapped[float | None] = mapped_column(Float, nullable=True)
    relative_strength: Mapped[float | None] = mapped_column(Float, nullable=True)
    breadth: Mapped[float | None] = mapped_column(Float, nullable=True)
    leading_stock: Mapped[str | None] = mapped_column(String(10), nullable=True)
    lagging_stock: Mapped[str | None] = mapped_column(String(10), nullable=True)

    __table_args__ = (
        Index("idx_sector_strength_sector_date", "sector", "date", unique=True),
        Index("idx_sector_strength_date", "date"),
        Index("idx_sector_strength_score", "strength_score"),
    )
