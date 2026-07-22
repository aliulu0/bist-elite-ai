from sqlalchemy import Column, String, Boolean, Text, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_model import BaseModel


class ApplicationSetting(BaseModel):
    __tablename__ = "application_settings"

    setting_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    setting_value: Mapped[str] = mapped_column(Text, nullable=False)
    setting_type: Mapped[str] = mapped_column(String(20), default="string", nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        Index("idx_app_setting_key", "setting_key"),
        Index("idx_app_setting_is_public", "is_public"),
    )
