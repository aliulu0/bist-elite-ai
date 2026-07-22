from sqlalchemy import Column, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_model import SoftDeleteModel


class SavedFilter(SoftDeleteModel):
    __tablename__ = "saved_filters"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    filter_config: Mapped[str] = mapped_column(Text, nullable=False)
    is_default: Mapped[bool] = mapped_column(default=False, nullable=False)

    __table_args__ = (
        Index("idx_saved_filter_name", "name"),
        Index("idx_saved_filter_is_default", "is_default"),
    )
