from __future__ import annotations

import time
from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from typing import Any, Optional

from modules.data_engine.providers.base.abstract_provider import AbstractProvider, ProviderConfig
from modules.data_engine.providers.models.enums import (
    ProviderPriority,
    ProviderStatus,
    ProviderType,
)
from modules.data_engine.providers.models.schemas import (
    CompanyData,
    FinancialData,
    NewsData,
    PriceData,
    ProviderError,
    SectorData,
)
from modules.data_engine.utils.logger import logger


@dataclass
class FailoverState:
    current_index: int = 0
    failure_counts: dict[str, int] = field(default_factory=dict)
    cooldown_until: dict[str, float] = field(default_factory=dict)
    last_provider: Optional[str] = None


class ProviderManager:
    """Manages a pool of providers for a given ProviderType with automatic failover.

    Providers are tried in priority order. If one fails, the next available
    provider is automatically selected. Failed providers enter a cooldown
    period before being retried.
    """

    COOLDOWN_SECONDS = 300.0
    MAX_CONSECUTIVE_FAILURES = 3

    def __init__(self, provider_type: ProviderType) -> None:
        self._provider_type = provider_type
        self._providers: list[AbstractProvider] = []
        self._state = FailoverState()

    @property
    def provider_type(self) -> ProviderType:
        return self._provider_type

    @property
    def providers(self) -> list[AbstractProvider]:
        return list(self._providers)

    @property
    def active_provider(self) -> Optional[AbstractProvider]:
        ordered = self._get_ordered_providers()
        return ordered[0] if ordered else None

    def register(self, provider: AbstractProvider) -> None:
        if provider.provider_type != self._provider_type:
            raise ValueError(
                f"Provider type mismatch: expected {self._provider_type.value}, "
                f"got {provider.provider_type.value}"
            )
        existing = [p for p in self._providers if p.name == provider.name]
        if existing:
            self._providers.remove(existing[0])
        self._providers.append(provider)
        self._providers.sort(key=lambda p: p.priority.value)
        logger.info(f"Registered provider: {provider.name}")

    def unregister(self, provider_name: str) -> bool:
        for p in self._providers:
            if p.name == provider_name:
                self._providers.remove(p)
                logger.info(f"Unregistered provider: {provider_name}")
                return True
        return False

    def get_provider(self, name: str) -> Optional[AbstractProvider]:
        for p in self._providers:
            if p.name == name:
                return p
        return None

    def _get_ordered_providers(self) -> list[AbstractProvider]:
        now = time.time()
        result = []
        for p in self._providers:
            if not p.is_enabled:
                continue
            name = p.name
            failures = self._state.failure_counts.get(name, 0)
            cooldown_until = self._state.cooldown_until.get(name, 0)
            if failures >= self.MAX_CONSECUTIVE_FAILURES and now < cooldown_until:
                continue
            if failures >= self.MAX_CONSECUTIVE_FAILURES and now >= cooldown_until:
                self._state.failure_counts[name] = 0
            result.append(p)
        return result

    def _on_provider_success(self, provider: AbstractProvider) -> None:
        self._state.failure_counts[provider.name] = 0
        self._state.cooldown_until.pop(provider.name, None)
        self._state.last_provider = provider.name

    def _on_provider_failure(self, provider: AbstractProvider) -> None:
        name = provider.name
        self._state.failure_counts[name] = self._state.failure_counts.get(name, 0) + 1
        if self._state.failure_counts[name] >= self.MAX_CONSECUTIVE_FAILURES:
            self._state.cooldown_until[name] = time.time() + self.COOLDOWN_SECONDS
            logger.warning(
                f"Provider {name} entered cooldown for {self.COOLDOWN_SECONDS}s "
                f"after {self.MAX_CONSECUTIVE_FAILURES} consecutive failures"
            )

    async def execute(
        self,
        stock_code: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        **kwargs: Any,
    ) -> dict[str, Any]:
        ordered = self._get_ordered_providers()
        if not ordered:
            return {
                "success": False,
                "data": [],
                "error": f"No available providers for {self._provider_type.value}",
                "provider": None,
                "attempts": [],
            }

        attempts: list[dict[str, Any]] = []
        for provider in ordered:
            logger.info(f"Trying provider: {provider.name}")
            result = await provider.execute(
                stock_code=stock_code,
                start_date=start_date,
                end_date=end_date,
                **kwargs,
            )
            attempts.append(result)
            if result["success"]:
                self._on_provider_success(provider)
                result["attempts"] = attempts
                return result
            else:
                self._on_provider_failure(provider)
                logger.warning(
                    f"Provider {provider.name} failed: {result.get('error', 'unknown')}. "
                    f"Trying next..."
                )

        return {
            "success": False,
            "data": [],
            "error": f"All providers failed for {self._provider_type.value}",
            "provider": None,
            "attempts": attempts,
        }

    async def health_check_all(self) -> dict[str, Any]:
        results = {}
        for provider in self._providers:
            try:
                health = await provider.health_check()
                results[provider.name] = health.to_dict()
            except Exception as e:
                results[provider.name] = {
                    "status": ProviderStatus.ERROR.value,
                    "error": str(e),
                }
        return results

    def reset_failures(self) -> None:
        self._state = FailoverState()
        logger.info(f"Reset failover state for {self._provider_type.value}")

    def get_status(self) -> dict[str, Any]:
        ordered = self._get_ordered_providers()
        return {
            "provider_type": self._provider_type.value,
            "total_providers": len(self._providers),
            "available_providers": len(ordered),
            "active_provider": ordered[0].name if ordered else None,
            "providers": [p.get_status_dict() for p in self._providers],
            "failure_counts": dict(self._state.failure_counts),
            "last_provider": self._state.last_provider,
        }
