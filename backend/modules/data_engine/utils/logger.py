import logging
import sys
from datetime import datetime, timezone
from typing import Optional
from pathlib import Path


class DataEngineLogger:
    def __init__(self, name: str = "data_engine"):
        self.logger = logging.getLogger(name)
        if not self.logger.handlers:
            self.logger.setLevel(logging.DEBUG)

            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(logging.INFO)
            console_format = logging.Formatter(
                "%(asctime)s | %(levelname)-8s | %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
            console_handler.setFormatter(console_format)
            self.logger.addHandler(console_handler)

            log_dir = Path("logs")
            log_dir.mkdir(exist_ok=True)
            file_handler = logging.FileHandler(
                log_dir / f"data_engine_{datetime.now().strftime('%Y%m%d')}.log",
                encoding="utf-8",
            )
            file_handler.setLevel(logging.DEBUG)
            file_format = logging.Formatter(
                "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
            file_handler.setFormatter(file_format)
            self.logger.addHandler(file_handler)

    def info(self, message: str) -> None:
        self.logger.info(message)

    def debug(self, message: str) -> None:
        self.logger.debug(message)

    def warning(self, message: str) -> None:
        self.logger.warning(message)

    def error(self, message: str) -> None:
        self.logger.error(message)

    def critical(self, message: str) -> None:
        self.logger.critical(message)

    def update_start(self, update_type: str) -> None:
        self.info(f"{'='*60}")
        self.info(f"UPDATE STARTED: {update_type}")
        self.info(f"Time: {datetime.now(timezone.utc).isoformat()}")
        self.info(f"{'='*60}")

    def update_complete(
        self,
        update_type: str,
        duration: float,
        success_count: int,
        failed_count: int,
    ) -> None:
        self.info(f"{'='*60}")
        self.info(f"UPDATE COMPLETED: {update_type}")
        self.info(f"Duration: {duration:.2f}s")
        self.info(f"Success: {success_count} | Failed: {failed_count}")
        self.info(f"{'='*60}")

    def company_processed(self, stock_code: str, status: str) -> None:
        self.debug(f"Company {stock_code}: {status}")


logger = DataEngineLogger()
