import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.notifications.channels.base import Channel, ChannelResult
from app.notifications.channels.telegram import TelegramChannel
from app.notifications.channels.email_channel import EmailChannel
from app.notifications.channels.manager import ChannelManager
from app.notifications.types import (
    DeliveryStatus,
    NotificationChannel,
    NotificationPriority,
    NotificationRecord,
)


class TestChannelResult:
    def test_creation(self):
        result = ChannelResult(
            success=True,
            channel=NotificationChannel.TELEGRAM,
            notification_id="test-1",
        )
        assert result.success is True
        assert result.channel == NotificationChannel.TELEGRAM
        assert result.error == ""


class TestTelegramChannel:
    def test_not_configured_without_token(self):
        ch = TelegramChannel(bot_token="", chat_id="")
        assert ch.is_configured is False

    def test_not_configured_without_chat_id(self):
        ch = TelegramChannel(bot_token="123:ABC", chat_id="")
        assert ch.is_configured is False

    def test_configured_with_both(self):
        ch = TelegramChannel(bot_token="123:ABC", chat_id="12345")
        assert ch.is_configured is True

    def test_name(self):
        ch = TelegramChannel()
        assert ch.name == NotificationChannel.TELEGRAM

    def test_escape_markdown(self):
        ch = TelegramChannel()
        result = ch._escape_markdown("Hello *world*")
        assert "\\*" in result

    def test_format_message(self):
        ch = TelegramChannel()
        record = NotificationRecord(
            title="Test Alert",
            message="This is a test",
            data={"score": 85.0, "symbol": "GARAN"},
        )
        formatted = ch._format_message(record)
        assert "Test Alert" in formatted
        assert "This is a test" in formatted


class TestEmailChannel:
    def test_not_configured_without_host(self):
        ch = EmailChannel(smtp_host="", from_email="")
        assert ch.is_configured is False

    def test_configured(self):
        ch = EmailChannel(smtp_host="smtp.gmail.com", from_email="test@test.com")
        assert ch.is_configured is True

    def test_name(self):
        ch = EmailChannel()
        assert ch.name == NotificationChannel.EMAIL

    def test_build_text(self):
        ch = EmailChannel()
        record = NotificationRecord(
            title="Email Alert",
            message="Check this out",
            data={"score": 90},
        )
        text = ch._build_text(record)
        assert "Email Alert" in text
        assert "Check this out" in text
        assert "score: 90" in text

    def test_build_html(self):
        ch = EmailChannel()
        record = NotificationRecord(
            title="HTML Alert",
            message="HTML content",
            data={"key": "value"},
        )
        html = ch._build_html(record)
        assert "HTML Alert" in html
        assert "<table" in html
        assert "key" in html


class TestChannelManager:
    def test_register_and_get(self):
        mgr = ChannelManager()
        ch = TelegramChannel(bot_token="123:ABC", chat_id="123")
        mgr.register(ch)
        assert mgr.get(NotificationChannel.TELEGRAM) is ch

    def test_get_returns_none_for_unregistered(self):
        mgr = ChannelManager()
        assert mgr.get(NotificationChannel.EMAIL) is None

    def test_get_all(self):
        mgr = ChannelManager()
        t = TelegramChannel()
        e = EmailChannel()
        mgr.register(t)
        mgr.register(e)
        assert len(mgr.get_all()) == 2

    def test_get_configured(self):
        mgr = ChannelManager()
        t = TelegramChannel(bot_token="123:ABC", chat_id="123")
        e = EmailChannel()
        mgr.register(t)
        mgr.register(e)
        configured = mgr.get_configured()
        assert len(configured) == 1
        assert configured[0].name == NotificationChannel.TELEGRAM

    def test_create_default(self):
        mgr = ChannelManager.create_default()
        assert len(mgr.get_all()) == 2
