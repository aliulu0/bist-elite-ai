from sqlalchemy import Column, String, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_model import BaseModel


class TelegramSetting(BaseModel):
    __tablename__ = "telegram_settings"

    bot_token: Mapped[str] = mapped_column(String(255), nullable=False)
    chat_id: Mapped[str] = mapped_column(String(50), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    daily_report: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    price_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    analysis_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("idx_telegram_setting_enabled", "enabled"),
    )
