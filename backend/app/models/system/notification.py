from sqlalchemy import Column, String, Float, Boolean, Text, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_model import BaseModel


class Notification(BaseModel):
    __tablename__ = "notifications"

    company_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True
    )
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="info", nullable=False, index=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sent_via: Mapped[str | None] = mapped_column(String(50), nullable=True)

    company = relationship("Company", back_populates="notifications")

    __table_args__ = (
        Index("idx_notification_type", "type"),
        Index("idx_notification_severity", "severity"),
        Index("idx_notification_is_read", "is_read"),
        Index("idx_notification_created_at", "created_at"),
    )
