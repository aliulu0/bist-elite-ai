from fastapi import APIRouter, HTTPException
from typing import Any

from modules.plugin_system.manager.plugin_manager import PluginManager

router = APIRouter(prefix="/plugins", tags=["plugins"])

_manager: PluginManager | None = None


def get_plugin_manager() -> PluginManager:
    global _manager
    if _manager is None:
        _manager = PluginManager()
    return _manager


def set_plugin_manager(manager: PluginManager) -> None:
    global _manager
    _manager = manager


@router.get("/status")
async def get_plugins_status():
    manager = get_plugin_manager()
    return manager.get_all_info()


@router.get("/categories")
async def get_categories():
    manager = get_plugin_manager()
    return {"categories": manager.registry.get_category_summary()}


@router.get("/{name}")
async def get_plugin_info(name: str):
    manager = get_plugin_manager()
    info = manager.get_plugin_info(name)
    if not info:
        raise HTTPException(status_code=404, detail=f"Plugin '{name}' not found")
    return info


@router.post("/{name}/enable")
async def enable_plugin(name: str):
    manager = get_plugin_manager()
    result = await manager.enable_plugin(name)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Failed"))
    return result


@router.post("/{name}/disable")
async def disable_plugin(name: str):
    manager = get_plugin_manager()
    result = await manager.disable_plugin(name)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Failed"))
    return result


@router.post("/{name}/uninstall")
async def uninstall_plugin(name: str):
    manager = get_plugin_manager()
    result = await manager.uninstall_plugin(name)
    return result


@router.post("/{name}/execute")
async def execute_plugin(name: str, context: dict[str, Any] | None = None):
    manager = get_plugin_manager()
    result = await manager.execute_plugin(name, context or {})
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Failed"))
    return result


@router.post("/discover")
async def discover_plugins():
    manager = get_plugin_manager()
    summary = await manager.discover_and_load()
    return summary


@router.post("/shutdown")
async def shutdown_all_plugins():
    manager = get_plugin_manager()
    return await manager.shutdown_all()
