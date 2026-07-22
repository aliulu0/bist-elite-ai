from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from typing import Any

import redis
import redis.exceptions

from .types import (
    DeliveryLog,
    DeliveryStatus,
    NotificationConfig,
    NotificationEvent,
    NotificationRecord,
    NotificationStatus,
)


class NotificationQueue:
    def __init__(self, config: NotificationConfig | None = None, local_only: bool = False):
        self._config = config or NotificationConfig()
        self._redis: redis.Redis | None = None
        self._local_queue: list[dict[str, Any]] = []
        self._local_only = local_only

    @property
    def redis(self) -> redis.Redis:
        if self._redis is None:
            self._redis = redis.from_url(
                self._config.redis_url,
                socket_connect_timeout=5,
                decode_responses=True,
            )
        return self._redis

    def enqueue(self, record: NotificationRecord) -> bool:
        priority_val = record.priority.value if hasattr(record.priority, "value") else int(record.priority)
        data: dict[str, Any] = {
            "id": record.id,
            "user_id": record.user_id,
            "event_id": record.event_id,
            "channel": record.channel.value,
            "title": record.title,
            "message": record.message,
            "data": record.data,
            "priority": priority_val,
            "status": record.status.value,
            "attempts": record.attempts,
            "max_attempts": record.max_attempts,
            "created_at": record.created_at.isoformat(),
        }
        if self._local_only:
            self._local_queue.append(data)
            return True
        try:
            queue_size = self.redis.llen(self._config.queue_key)
            if queue_size >= self._config.max_queue_size:
                return False
            self.redis.rpush(self._config.queue_key, json.dumps(data))
            return True
        except (redis.ConnectionError, redis.exceptions.ConnectionError, OSError):
            if data:
                self._local_queue.append(data)
            return True
        except Exception:
            if data:
                self._local_queue.append(data)
            return True

    def dequeue(self, count: int = 1) -> list[dict[str, Any]]:
        if self._local_only:
            batch = self._local_queue[:count]
            self._local_queue = self._local_queue[count:]
            return batch
        try:
            results = []
            for _ in range(count):
                raw = self.redis.lpop(self._config.queue_key)
                if raw is None:
                    break
                results.append(json.loads(raw))
            return results
        except (redis.ConnectionError, redis.exceptions.ConnectionError, OSError):
            if self._local_queue:
                batch = self._local_queue[:count]
                self._local_queue = self._local_queue[count:]
                return batch
            return []
        except Exception:
            return []

    def peek(self, count: int = 10) -> list[dict[str, Any]]:
        if self._local_only:
            return self._local_queue[:count]
        try:
            raw_list = self.redis.lrange(self._config.queue_key, 0, count - 1)
            return [json.loads(r) for r in raw_list]
        except (redis.ConnectionError, redis.exceptions.ConnectionError, OSError):
            return self._local_queue[:count]
        except Exception:
            return []

    def queue_size(self) -> int:
        if self._local_only:
            return len(self._local_queue)
        try:
            return self.redis.llen(self._config.queue_key)
        except (redis.ConnectionError, redis.exceptions.ConnectionError, OSError):
            return len(self._local_queue)
        except Exception:
            return 0

    def send_to_dead_letter(self, record: NotificationRecord, error: str) -> bool:
        if self._local_only:
            return True
        try:
            priority_val = record.priority.value if hasattr(record.priority, "value") else int(record.priority)
            data = {
                "id": record.id,
                "user_id": record.user_id,
                "event_id": record.event_id,
                "channel": record.channel.value,
                "title": record.title,
                "message": record.message,
                "data": record.data,
                "priority": priority_val,
                "status": NotificationStatus.DEAD_LETTER.value,
                "delivery_status": DeliveryStatus.DEAD_LETTER.value,
                "attempts": record.attempts,
                "error": error,
                "created_at": record.created_at.isoformat(),
                "dead_lettered_at": datetime.now(timezone.utc).isoformat(),
            }
            self.redis.rpush(self._config.dead_letter_key, json.dumps(data))
            return True
        except (redis.ConnectionError, redis.exceptions.ConnectionError, OSError):
            return False
        except Exception:
            return False

    def get_dead_letters(self, count: int = 50) -> list[dict[str, Any]]:
        if self._local_only:
            return []
        try:
            raw_list = self.redis.lrange(self._config.dead_letter_key, 0, count - 1)
            return [json.loads(r) for r in raw_list]
        except Exception:
            return []

    def clear_dead_letter_queue(self) -> int:
        if self._local_only:
            return 0
        try:
            size = self.redis.llen(self._config.dead_letter_key)
            self.redis.delete(self._config.dead_letter_key)
            return size
        except Exception:
            return 0

    def record_cooldown(self, user_id: str, event_type: str, cooldown_seconds: int) -> bool:
        if self._local_only:
            return True
        try:
            key = f"{self._config.cooldown_key_prefix}{user_id}:{event_type}"
            self.redis.setex(key, cooldown_seconds, "1")
            return True
        except (redis.ConnectionError, redis.exceptions.ConnectionError, OSError):
            return False
        except Exception:
            return False

    def is_in_cooldown(self, user_id: str, event_type: str) -> bool:
        if self._local_only:
            return False
        try:
            key = f"{self._config.cooldown_key_prefix}{user_id}:{event_type}"
            return self.redis.exists(key) > 0
        except (redis.ConnectionError, redis.exceptions.ConnectionError, OSError):
            return False
        except Exception:
            return False

    def log_delivery(self, log: DeliveryLog) -> bool:
        if self._local_only:
            return True
        try:
            data = {
                "notification_id": log.notification_id,
                "channel": log.channel.value,
                "status": log.status.value,
                "attempt": log.attempt,
                "error": log.error,
                "metadata": log.metadata,
                "timestamp": log.timestamp.isoformat(),
            }
            self.redis.rpush("bist:notifications:delivery_log", json.dumps(data))
            self.redis.ltrim("bist:notifications:delivery_log", -1000, -1)
            return True
        except (redis.ConnectionError, redis.exceptions.ConnectionError, OSError):
            return False
        except Exception:
            return False

    def get_delivery_logs(self, count: int = 100) -> list[dict[str, Any]]:
        if self._local_only:
            return []
        try:
            raw_list = self.redis.lrange("bist:notifications:delivery_log", -count, -1)
            return [json.loads(r) for r in raw_list]
        except Exception:
            return []

    def flush(self) -> int:
        if self._local_only:
            count = len(self._local_queue)
            self._local_queue = []
            return count
        try:
            size = self.redis.llen(self._config.queue_key)
            self.redis.delete(self._config.queue_key)
            return size
        except Exception:
            return 0
