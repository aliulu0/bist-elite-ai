from __future__ import annotations

import os
from typing import Any

from .base import Channel, ChannelResult
from ..types import DeliveryStatus, NotificationChannel, NotificationRecord


class EmailChannel(Channel):
    def __init__(
        self,
        smtp_host: str | None = None,
        smtp_port: int | None = None,
        smtp_user: str | None = None,
        smtp_password: str | None = None,
        from_email: str | None = None,
        use_tls: bool = True,
    ):
        self._smtp_host = smtp_host or os.getenv("SMTP_HOST", "")
        self._smtp_port = smtp_port or int(os.getenv("SMTP_PORT", "587"))
        self._smtp_user = smtp_user or os.getenv("SMTP_USER", "")
        self._smtp_password = smtp_password or os.getenv("SMTP_PASSWORD", "")
        self._from_email = from_email or os.getenv("FROM_EMAIL", "")
        self._use_tls = use_tls

    @property
    def name(self) -> NotificationChannel:
        return NotificationChannel.EMAIL

    @property
    def is_configured(self) -> bool:
        return bool(self._smtp_host and self._from_email)

    def _build_html(self, record: NotificationRecord) -> str:
        rows = ""
        if record.data:
            for key, value in record.data.items():
                rows += f"""
                <tr>
                    <td style="padding:8px;border:1px solid #ddd;font-weight:bold;">{key}</td>
                    <td style="padding:8px;border:1px solid #ddd;">{value}</td>
                </tr>"""

        data_table = ""
        if rows:
            data_table = f"""
            <table style="border-collapse:collapse;width:100%;margin-top:16px;">
                <thead>
                    <tr>
                        <th style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">Field</th>
                        <th style="padding:8px;border:1px solid #ddd;background:#f5f5f5;">Value</th>
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>"""

        return f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="background:#1a1a2e;color:white;padding:20px;border-radius:8px 8px 0 0;">
                <h2 style="margin:0;">{record.title}</h2>
            </div>
            <div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
                <p style="font-size:16px;line-height:1.6;">{record.message}</p>
                {data_table}
                <hr style="margin-top:20px;border:none;border-top:1px solid #eee;">
                <p style="color:#888;font-size:12px;">
                    BIST Elite AI Notification | {record.created_at.strftime('%Y-%m-%d %H:%M UTC')}
                </p>
            </div>
        </body>
        </html>"""

    def _build_text(self, record: NotificationRecord) -> str:
        lines = [record.title, "", record.message]
        if record.data:
            lines.append("")
            lines.append("---")
            for key, value in record.data.items():
                lines.append(f"{key}: {value}")
        lines.append("")
        lines.append(f"BIST Elite AI | {record.created_at.strftime('%Y-%m-%d %H:%M UTC')}")
        return "\n".join(lines)

    async def send(self, record: NotificationRecord) -> ChannelResult:
        if not self.is_configured:
            return ChannelResult(
                success=False,
                channel=self.name,
                notification_id=record.id,
                error="Email not configured: missing SMTP host or from address",
            )

        try:
            import smtplib
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText

            msg = MIMEMultipart("alternative")
            msg["Subject"] = record.title
            msg["From"] = self._from_email
            msg["To"] = record.data.get("email", self._from_email)

            text_content = self._build_text(record)
            html_content = self._build_html(record)

            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(self._smtp_host, self._smtp_port, timeout=30) as server:
                if self._use_tls:
                    server.starttls()
                if self._smtp_user and self._smtp_password:
                    server.login(self._smtp_user, self._smtp_password)
                server.sendmail(self._from_email, [msg["To"]], msg.as_string())

            return ChannelResult(
                success=True,
                channel=self.name,
                notification_id=record.id,
                external_id=msg["Message-ID"] if hasattr(msg, "Message-ID") else "",
                metadata={"to": msg["To"], "subject": record.title},
            )
        except ImportError:
            return ChannelResult(
                success=False,
                channel=self.name,
                notification_id=record.id,
                error="smtplib not available",
            )
        except Exception as e:
            return ChannelResult(
                success=False,
                channel=self.name,
                notification_id=record.id,
                error=f"Email send error: {str(e)}",
            )

    async def health_check(self) -> dict[str, Any]:
        if not self.is_configured:
            return {"status": "not_configured", "channel": "email"}

        try:
            import smtplib
            with smtplib.SMTP(self._smtp_host, self._smtp_port, timeout=10) as server:
                if self._use_tls:
                    server.starttls()
                if self._smtp_user and self._smtp_password:
                    server.login(self._smtp_user, self._smtp_password)
            return {
                "status": "healthy",
                "channel": "email",
                "smtp_host": self._smtp_host,
                "smtp_port": self._smtp_port,
            }
        except Exception as e:
            return {"status": "unhealthy", "channel": "email", "error": str(e)}
