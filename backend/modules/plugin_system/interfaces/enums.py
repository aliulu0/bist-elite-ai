from __future__ import annotations

from enum import Enum, auto
from dataclasses import dataclass, field
from typing import Any


class PluginCategory(str, Enum):
    TECHNICAL = "technical"
    PROVIDER = "provider"
    AI = "ai"
    REPORT = "report"
    NOTIFICATION = "notification"
    STRATEGY = "strategy"
    RISK = "risk"


class PluginStatus(str, Enum):
    DISCOVERED = "discovered"
    LOADED = "loaded"
    INITIALIZED = "initialized"
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"
    DISABLED = "disabled"


class PluginPermission(str, Enum):
    READ_DATA = "read_data"
    WRITE_DATA = "write_data"
    READ_CONFIG = "read_config"
    WRITE_CONFIG = "write_config"
    ACCESS_DATABASE = "access_database"
    ACCESS_NETWORK = "access_network"
    ACCESS_FILESYSTEM = "access_filesystem"
    REGISTER_ROUTES = "register_routes"
    MODIFY_CORE = "modify_core"
    ACCESS_AI = "access_ai"


@dataclass(frozen=True)
class PluginMeta:
    name: str
    version: str
    author: str
    description: str
    category: PluginCategory
    min_app_version: str = "1.0.0"
    max_app_version: str = ""
    dependencies: tuple[str, ...] = ()
    permissions: tuple[PluginPermission, ...] = ()
    tags: tuple[str, ...] = ()
    url: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "version": self.version,
            "author": self.author,
            "description": self.description,
            "category": self.category.value,
            "min_app_version": self.min_app_version,
            "max_app_version": self.max_app_version,
            "dependencies": list(self.dependencies),
            "permissions": [p.value for p in self.permissions],
            "tags": list(self.tags),
            "url": self.url,
        }


@dataclass
class PluginConfigSchema:
    """Defines the configuration schema a plugin expects."""
    fields: dict[str, PluginConfigField] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {k: f.to_dict() for k, f in self.fields.items()}


@dataclass(frozen=True)
class PluginConfigField:
    field_type: str  # "str", "int", "float", "bool", "list", "dict"
    default: Any = None
    required: bool = False
    description: str = ""
    min_value: Any = None
    max_value: Any = None
    choices: tuple[Any, ...] = ()

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {
            "type": self.field_type,
            "default": self.default,
            "required": self.required,
            "description": self.description,
        }
        if self.min_value is not None:
            result["min_value"] = self.min_value
        if self.max_value is not None:
            result["max_value"] = self.max_value
        if self.choices:
            result["choices"] = list(self.choices)
        return result


@dataclass
class PluginHealth:
    status: PluginStatus = PluginStatus.DISCOVERED
    error_message: str = ""
    uptime_seconds: float = 0.0
    execution_count: int = 0
    error_count: int = 0
    last_executed_at: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status.value,
            "error_message": self.error_message,
            "uptime_seconds": round(self.uptime_seconds, 2),
            "execution_count": self.execution_count,
            "error_count": self.error_count,
            "last_executed_at": self.last_executed_at,
            "metadata": self.metadata,
        }
