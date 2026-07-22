import time
from datetime import datetime, timezone
from typing import Any

import httpx
import redis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "BIST Elite AI Worker"
    app_env: str = "development"
    redis_url: str = "redis://localhost:6379/0"
    database_url: str = "postgresql://localhost:5432/bist_elite_ai"
    cors_origins: list[str] = ["http://localhost:3000"]
    worker_host: str = "0.0.0.0"
    worker_port: int = 8000
    log_level: str = "info"

    class Config:
        env_file = ".env"
        env_prefix = "WORKER_"
        extra = "ignore"


settings = Settings()
app = FastAPI(
    title=settings.app_name,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_start_time = time.time()


def _check_redis() -> dict[str, Any]:
    try:
        client = redis.from_url(settings.redis_url, socket_connect_timeout=2)
        client.ping()
        client.close()
        return {"status": "healthy", "latency_ms": round(client.connection_pool.connection_kwargs.get("socket_connect_timeout", 2) * 1000, 2)}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


def _check_database() -> dict[str, Any]:
    try:
        url = settings.database_url
        if url.startswith("postgresql"):
            import psycopg2
            from urllib.parse import urlparse

            parsed = urlparse(url)
            conn = psycopg2.connect(
                host=parsed.hostname,
                port=parsed.port or 5432,
                dbname=parsed.path.lstrip("/"),
                user=parsed.username,
                password=parsed.password,
                connect_timeout=5,
            )
            conn.close()
            return {"status": "healthy"}
        return {"status": "skipped", "reason": "not postgresql"}
    except ImportError:
        return {"status": "skipped", "reason": "psycopg2 not installed"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


@app.get("/health")
def health():
    uptime_seconds = round(time.time() - _start_time, 2)
    redis_health = _check_redis()
    db_health = _check_database()

    all_healthy = redis_health["status"] in ("healthy", "skipped") and db_health["status"] in ("healthy", "skipped")

    return {
        "status": "healthy" if all_healthy else "degraded",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime_seconds": uptime_seconds,
        "checks": {
            "redis": redis_health,
            "database": db_health,
        },
    }


@app.get("/health/ready")
def readiness():
    redis_health = _check_redis()
    db_health = _check_database()

    all_ready = redis_health["status"] in ("healthy", "skipped") and db_health["status"] in ("healthy", "skipped")

    if all_ready:
        return {"status": "ready"}
    return {"status": "not ready", "checks": {"redis": redis_health, "database": db_health}}


@app.get("/health/live")
def liveness():
    return {"status": "alive", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/worker/status")
def worker_status():
    return {
        "worker": "idle",
        "queue_size": 0,
        "uptime_seconds": round(time.time() - _start_time, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
