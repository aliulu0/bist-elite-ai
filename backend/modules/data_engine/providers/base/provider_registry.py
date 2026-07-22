from __future__ import annotations

from typing import Optional

from modules.data_engine.providers.base.abstract_provider import AbstractProvider
from modules.data_engine.providers.base.provider_manager import ProviderManager
from modules.data_engine.providers.models.enums import ProviderType
from modules.data_engine.utils.logger import logger


class ProviderRegistry:
    """Central registry that holds ProviderManagers for each ProviderType.

    Singleton pattern ensures a single source of truth across the application.
    """

    _instance: Optional["ProviderRegistry"] = None

    def __new__(cls) -> "ProviderRegistry":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._managers = {}
            cls._instance._initialized = True
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None

    def __init__(self) -> None:
        if not hasattr(self, "_initialized"):
            self._managers: dict[ProviderType, ProviderManager] = {}
            self._initialized = True

    def get_manager(self, provider_type: ProviderType) -> ProviderManager:
        if provider_type not in self._managers:
            self._managers[provider_type] = ProviderManager(provider_type)
        return self._managers[provider_type]

    def register(self, provider: AbstractProvider) -> None:
        manager = self.get_manager(provider.provider_type)
        manager.register(provider)
        logger.info(
            f"Registry: registered {provider.name} "
            f"for {provider.provider_type.value}"
        )

    def unregister(self, provider_type: ProviderType, provider_name: str) -> bool:
        if provider_type in self._managers:
            return self._managers[provider_type].unregister(provider_name)
        return False

    def get_provider(
        self, provider_type: ProviderType, provider_name: str
    ) -> Optional[AbstractProvider]:
        if provider_type in self._managers:
            return self._managers[provider_type].get_provider(provider_name)
        return None

    def get_active_provider(
        self, provider_type: ProviderType
    ) -> Optional[AbstractProvider]:
        manager = self.get_manager(provider_type)
        return manager.active_provider

    def get_all_status(self) -> dict[str, dict]:
        result = {}
        for ptype, manager in self._managers.items():
            result[ptype.value] = manager.get_status()
        return result

    async def health_check_all(self) -> dict[str, dict]:
        result = {}
        for ptype, manager in self._managers.items():
            result[ptype.value] = await manager.health_check_all()
        return result

    def reset_all_failures(self) -> None:
        for manager in self._managers.values():
            manager.reset_failures()


registry = ProviderRegistry()
