from fastapi import APIRouter, HTTPException
from typing import Optional

from modules.data_engine.providers.base.provider_registry import registry
from modules.data_engine.providers.base.provider_factory import ProviderFactory
from modules.data_engine.providers.models.enums import ProviderType

router = APIRouter(prefix="/providers", tags=["providers"])


@router.get("/status")
async def get_providers_status():
    return {
        "providers": registry.get_all_status(),
    }


@router.get("/health")
async def health_check_all():
    results = await registry.health_check_all()
    all_healthy = all(
        status.get("status") == "active"
        for provider_status in results.values()
        for status in provider_status.values()
    )
    return {
        "healthy": all_healthy,
        "results": results,
    }


@router.get("/{provider_type}")
async def get_provider_type_status(provider_type: str):
    try:
        ptype = ProviderType(provider_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider type: {provider_type}. "
            f"Valid types: {[t.value for t in ProviderType]}",
        )
    manager = registry.get_manager(ptype)
    return manager.get_status()


@router.get("/{provider_type}/active")
async def get_active_provider(provider_type: str):
    try:
        ptype = ProviderType(provider_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider type: {provider_type}",
        )
    active = registry.get_active_provider(ptype)
    if not active:
        return {"active_provider": None, "message": "No active provider"}
    return {
        "active_provider": active.get_status_dict(),
    }


@router.post("/{provider_type}/failover/reset")
async def reset_failover(provider_type: str):
    try:
        ptype = ProviderType(provider_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider type: {provider_type}",
        )
    manager = registry.get_manager(ptype)
    manager.reset_failures()
    return {"message": f"Failover state reset for {provider_type}"}


@router.post("/initialize")
async def initialize_providers(
    enable_yahoo: bool = True,
    enable_kap: bool = True,
    enable_mock: bool = True,
):
    ProviderFactory.create_default_providers(
        enable_yahoo=enable_yahoo,
        enable_kap=enable_kap,
        enable_mock=enable_mock,
    )
    return {
        "message": "Providers initialized",
        "status": registry.get_all_status(),
    }
