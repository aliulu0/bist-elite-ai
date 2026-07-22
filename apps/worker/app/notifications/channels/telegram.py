from __future__ import annotations

import os
from typing import Any

import httpx

from .base import Channel, ChannelResult
from ..types import DeliveryStatus, NotificationChannel, NotificationRecord


class TelegramChannel(Channel):
    def __init__(self, bot_token: str | None = None, chat_id: str | None = None):
        self._bot_token = bot_token or os.getenv("TELEGRAM_BOT_TOKEN", "")
        self._chat_id = chat_id or os.getenv("TELEGRAM_CHAT_ID", "")
        self._base_url = f"https://api.telegram.org/bot{self._bot_token}"

    @property
    def name(self) -> NotificationChannel:
        return NotificationChannel.TELEGRAM

    @property
    def is_configured(self) -> bool:
        return bool(self._bot_token and self._chat_id)

    def _escape_markdown(self, text: str) -> str:
        special_chars = ["_", "*", "[", "]", "(", ")", "~", "`", ">", "#", "+", "-", "=", "|", "{", "}", ".", "!"]
        for char in special_chars:
            text = text.replace(char, f"\\{char}")
        return text

    def _format_message(self, record: NotificationRecord) -> str:
        lines = [f"*{self._escape_markdown(record.title)}*", ""]
        lines.append(record.message)
        if record.data:
            lines.append("")
            lines.append("\\-\\-\\-")
            for key, value in record.data.items():
                if isinstance(value, (int, float)):
                    lines.append(f"*{key}:* {value}")
                elif isinstance(value, str):
                    lines.append(f"*{key}:* {self._escape_markdown(value)}")
        return "\n".join(lines)

    async def send(self, record: NotificationRecord) -> ChannelResult:
        if not self.is_configured:
            return ChannelResult(
                success=False,
                channel=self.name,
                notification_id=record.id,
                error="Telegram not configured: missing bot token or chat ID",
            )

        formatted = self._format_message(record)
        payload = {
            "chat_id": self._chat_id,
            "text": formatted,
            "parse_mode": "MarkdownV2",
            "disable_web_page_preview": True,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(f"{self._base_url}/sendMessage", json=payload)
                data = response.json()

                if response.status_code == 200 and data.get("ok"):
                    return ChannelResult(
                        success=True,
                        channel=self.name,
                        notification_id=record.id,
                        external_id=str(data["result"]["message_id"]),
                        metadata={"chat_id": self._chat_id},
                    )
                else:
                    error_msg = data.get("description", f"HTTP {response.status_code}")
                    return ChannelResult(
                        success=False,
                        channel=self.name,
                        notification_id=record.id,
                        error=error_msg,
                        metadata={"response": data},
                    )
        except httpx.TimeoutException:
            return ChannelResult(
                success=False,
                channel=self.name,
                notification_id=record.id,
                error="Telegram API timeout",
            )
        except httpx.RequestError as e:
            return ChannelResult(
                success=False,
                channel=self.name,
                notification_id=record.id,
                error=f"Telegram API request error: {str(e)}",
            )
        except Exception as e:
            return ChannelResult(
                success=False,
                channel=self.name,
                notification_id=record.id,
                error=f"Unexpected error: {str(e)}",
            )

    async def health_check(self) -> dict[str, Any]:
        if not self.is_configured:
            return {"status": "not_configured", "channel": "telegram"}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self._base_url}/getMe")
                data = response.json()
                if response.status_code == 200 and data.get("ok"):
                    bot_info = data["result"]
                    return {
                        "status": "healthy",
                        "channel": "telegram",
                        "bot_username": bot_info.get("username"),
                        "bot_name": bot_info.get("first_name"),
                    }
                return {"status": "unhealthy", "channel": "telegram", "error": data.get("description")}
        except Exception as e:
            return {"status": "unhealthy", "channel": "telegram", "error": str(e)}
