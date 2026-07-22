import time
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


class UpdateStage(str, Enum):
    IDLE = "idle"
    DOWNLOADING = "downloading"
    PROCESSING = "processing"
    SAVING = "saving"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class UpdateProgress:
    stage: UpdateStage = UpdateStage.IDLE
    total_companies: int = 0
    processed_companies: int = 0
    current_company: str = ""
    start_time: Optional[float] = field(default_factory=time.time)
    end_time: Optional[float] = None
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    updated_prices: int = 0
    updated_financials: int = 0
    updated_technicals: int = 0
    updated_sectors: int = 0
    success_count: int = 0
    failed_count: int = 0

    @property
    def progress_percent(self) -> float:
        if self.total_companies == 0:
            return 0.0
        return (self.processed_companies / self.total_companies) * 100

    @property
    def duration(self) -> Optional[float]:
        if self.end_time and self.start_time:
            return self.end_time - self.start_time
        return None

    def to_dict(self) -> dict:
        return {
            "stage": self.stage.value,
            "progress_percent": round(self.progress_percent, 1),
            "total_companies": self.total_companies,
            "processed_companies": self.processed_companies,
            "current_company": self.current_company,
            "duration": round(self.duration, 2) if self.duration else None,
            "errors": self.errors[-10:],
            "warnings": self.warnings[-10:],
            "updated_prices": self.updated_prices,
            "updated_financials": self.updated_financials,
            "updated_technicals": self.updated_technicals,
            "updated_sectors": self.updated_sectors,
            "success_count": self.success_count,
            "failed_count": self.failed_count,
        }


class ProgressTracker:
    def __init__(self):
        self._current: Optional[UpdateProgress] = None
        self._history: list[UpdateProgress] = []

    @property
    def current(self) -> Optional[UpdateProgress]:
        return self._current

    @property
    def history(self) -> list[UpdateProgress]:
        return self._history

    def start(self, update_type: str) -> UpdateProgress:
        self._current = UpdateProgress(
            stage=UpdateStage.DOWNLOADING,
            start_time=time.time(),
        )
        return self._current

    def set_stage(self, stage: UpdateStage) -> None:
        if self._current:
            self._current.stage = stage

    def set_total(self, total: int) -> None:
        if self._current:
            self._current.total_companies = total

    def update_company(
        self,
        stock_code: str,
        success: bool = True,
        prices: int = 0,
        financials: int = 0,
        technicals: int = 0,
    ) -> None:
        if self._current:
            self._current.current_company = stock_code
            self._current.processed_companies += 1
            if success:
                self._current.success_count += 1
                self._current.updated_prices += prices
                self._current.updated_financials += financials
                self._current.updated_technicals += technicals
            else:
                self._current.failed_count += 1

    def add_error(self, error: str) -> None:
        if self._current:
            self._current.errors.append(error)

    def add_warning(self, warning: str) -> None:
        if self._current:
            self._current.warnings.append(warning)

    def complete(self) -> UpdateProgress:
        if self._current:
            self._current.stage = UpdateStage.COMPLETED
            self._current.end_time = time.time()
            self._history.append(self._current)
            if len(self._history) > 100:
                self._history = self._history[-100:]
        result = self._current
        self._current = None
        return result

    def fail(self, error: str) -> UpdateProgress:
        if self._current:
            self._current.stage = UpdateStage.FAILED
            self._current.end_time = time.time()
            self._current.errors.append(error)
            self._history.append(self._current)
        result = self._current
        self._current = None
        return result


progress_tracker = ProgressTracker()
