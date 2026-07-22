from sqlalchemy import Column, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_model import BaseModel


class SystemLog(BaseModel):
    __tablename__ = "system_logs"

    level: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    module: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)

    __table_args__ = (
        Index("idx_system_log_level", "level"),
        Index("idx_system_log_module", "module"),
        Index("idx_system_log_created_at", "created_at"),
    )
