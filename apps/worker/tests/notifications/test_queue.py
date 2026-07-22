import pytest
from unittest.mock import MagicMock, patch
from app.notifications.queue import NotificationQueue
from app.notifications.types import (
    DeliveryLog,
    DeliveryStatus,
    NotificationConfig,
    NotificationChannel,
    NotificationPriority,
    NotificationRecord,
    NotificationStatus,
)


class TestNotificationQueueLocal:
    def setup_method(self):
        self.config = NotificationConfig(redis_url="redis://invalid:6379/1")
        self.queue = NotificationQueue(self.config)

    def test_enqueue_local_fallback(self):
        record = NotificationRecord(
            id="test-1",
            user_id="user1",
            channel=NotificationChannel.TELEGRAM,
            title="Test",
            message="Test message",
        )
        result = self.queue.enqueue(record)
        assert result is True

    def test_dequeue_local_fallback(self):
        record = NotificationRecord(
            id="test-2",
            user_id="user1",
            channel=NotificationChannel.TELEGRAM,
            title="Test",
            message="Test message",
        )
        self.queue.enqueue(record)
        items = self.queue.dequeue(1)
        assert len(items) == 1
        assert items[0]["id"] == "test-2"

    def test_queue_size_local(self):
        assert self.queue.queue_size() == 0
        record = NotificationRecord(
            id="test-3",
            user_id="user1",
            channel=NotificationChannel.TELEGRAM,
            title="Test",
            message="Test",
        )
        self.queue.enqueue(record)
        assert self.queue.queue_size() >= 1

    def test_dequeue_empty_returns_empty_list(self):
        items = self.queue.dequeue(5)
        assert items == []

    def test_dequeue_batch(self):
        for i in range(3):
            record = NotificationRecord(
                id=f"batch-{i}",
                user_id="user1",
                channel=NotificationChannel.TELEGRAM,
                title=f"Test {i}",
                message=f"Message {i}",
            )
            self.queue.enqueue(record)
        items = self.queue.dequeue(10)
        assert len(items) == 3


class TestNotificationQueueMockRedis:
    def setup_method(self):
        self.config = NotificationConfig()
        self.queue = NotificationQueue(self.config)
        self.mock_redis = MagicMock()
        self.queue._redis = self.mock_redis

    def test_enqueue_success(self):
        self.mock_redis.llen.return_value = 10
        self.mock_redis.rpush.return_value = 11
        record = NotificationRecord(
            id="test-enq",
            user_id="user1",
            channel=NotificationChannel.TELEGRAM,
            title="Test",
            message="Test",
        )
        result = self.queue.enqueue(record)
        assert result is True
        self.mock_redis.rpush.assert_called_once()

    def test_enqueue_rejects_when_full(self):
        self.mock_redis.llen.return_value = 100000
        record = NotificationRecord(
            id="test-full",
            user_id="user1",
            channel=NotificationChannel.TELEGRAM,
            title="Test",
            message="Test",
        )
        result = self.queue.enqueue(record)
        assert result is False

    def test_dequeue_success(self):
        import json
        item = {"id": "deq-1", "user_id": "user1", "channel": "telegram"}
        self.mock_redis.lpop.return_value = json.dumps(item)
        results = self.queue.dequeue(1)
        assert len(results) == 1
        assert results[0]["id"] == "deq-1"

    def test_dequeue_empty(self):
        self.mock_redis.lpop.return_value = None
        results = self.queue.dequeue(1)
        assert results == []

    def test_peek(self):
        import json
        items = [{"id": "p1"}, {"id": "p2"}]
        self.mock_redis.lrange.return_value = [json.dumps(i) for i in items]
        results = self.queue.peek(10)
        assert len(results) == 2

    def test_queue_size(self):
        self.mock_redis.llen.return_value = 42
        assert self.queue.queue_size() == 42

    def test_send_to_dead_letter(self):
        self.mock_redis.rpush.return_value = 1
        record = NotificationRecord(
            id="dl-1",
            user_id="user1",
            channel=NotificationChannel.TELEGRAM,
            title="Failed",
            message="This failed",
        )
        result = self.queue.send_to_dead_letter(record, "Connection timeout")
        assert result is True
        self.mock_redis.rpush.assert_called_once()

    def test_clear_dead_letter_queue(self):
        self.mock_redis.llen.return_value = 5
        self.mock_redis.delete.return_value = 5
        count = self.queue.clear_dead_letter_queue()
        assert count == 5

    def test_record_cooldown(self):
        self.mock_redis.setex.return_value = True
        result = self.queue.record_cooldown("user1", "elite_opportunity", 300)
        assert result is True

    def test_is_in_cooldown(self):
        self.mock_redis.exists.return_value = 1
        assert self.queue.is_in_cooldown("user1", "elite_opportunity") is True
        self.mock_redis.exists.return_value = 0
        assert self.queue.is_in_cooldown("user1", "elite_opportunity") is False

    def test_log_delivery(self):
        log = DeliveryLog(
            notification_id="log-1",
            channel=NotificationChannel.TELEGRAM,
            status=DeliveryStatus.SENT,
            attempt=1,
        )
        self.mock_redis.rpush.return_value = 1
        self.mock_redis.ltrim.return_value = True
        result = self.queue.log_delivery(log)
        assert result is True

    def test_flush(self):
        self.mock_redis.llen.return_value = 10
        self.mock_redis.delete.return_value = 10
        count = self.queue.flush()
        assert count == 10
