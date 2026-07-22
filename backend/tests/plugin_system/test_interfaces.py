import pytest
import json
import tempfile
import shutil
from pathlib import Path

from modules.plugin_system.interfaces.enums import (
    PluginCategory,
    PluginConfigField,
    PluginConfigSchema,
    PluginHealth,
    PluginMeta,
    PluginPermission,
    PluginStatus,
)
from modules.plugin_system.interfaces.plugin_interface import PluginInterface
from modules.plugin_system.interfaces.base_technical import TechnicalIndicatorPlugin
from modules.plugin_system.interfaces.base_provider import DataProviderPlugin
from modules.plugin_system.interfaces.base_ai import AIPlugin
from modules.plugin_system.interfaces.base_report import ReportExporterPlugin
from modules.plugin_system.interfaces.base_notification import NotificationPlugin
from modules.plugin_system.interfaces.base_strategy import StrategyPlugin
from modules.plugin_system.interfaces.base_risk import RiskModelPlugin


class ConcreteTestPlugin(PluginInterface):
    async def initialize(self, config):
        self.set_config(config)
        return True

    async def validate(self):
        return True

    async def execute(self, context):
        self._record_execution(True)
        return {"success": True, "data": "test"}

    async def shutdown(self):
        pass


class FailingInitPlugin(PluginInterface):
    async def initialize(self, config):
        return False

    async def validate(self):
        return True

    async def execute(self, context):
        return {"success": True}

    async def shutdown(self):
        pass


class ErrorPlugin(PluginInterface):
    async def initialize(self, config):
        return True

    async def validate(self):
        return True

    async def execute(self, context):
        raise RuntimeError("test error")

    async def shutdown(self):
        pass


class TestPluginMeta:
    def test_create_meta(self):
        meta = PluginMeta(
            name="test",
            version="1.0.0",
            author="Tester",
            description="Test plugin",
            category=PluginCategory.TECHNICAL,
        )
        assert meta.name == "test"
        assert meta.version == "1.0.0"
        assert meta.category == PluginCategory.TECHNICAL

    def test_meta_to_dict(self):
        meta = PluginMeta(
            name="test",
            version="1.0.0",
            author="Tester",
            description="Desc",
            category=PluginCategory.AI,
            permissions=(PluginPermission.READ_DATA,),
            tags=("test",),
        )
        d = meta.to_dict()
        assert d["name"] == "test"
        assert d["category"] == "ai"
        assert "read_data" in d["permissions"]
        assert "test" in d["tags"]

    def test_meta_frozen(self):
        meta = PluginMeta(
            name="test", version="1.0.0", author="A", description="D",
            category=PluginCategory.TECHNICAL,
        )
        with pytest.raises(AttributeError):
            meta.name = "changed"


class TestPluginConfigSchema:
    def test_create_schema(self):
        schema = PluginConfigSchema(
            fields={
                "period": PluginConfigField(
                    field_type="int", default=14, required=False,
                    description="Period",
                ),
            }
        )
        assert "period" in schema.fields
        assert schema.fields["period"].field_type == "int"

    def test_schema_to_dict(self):
        schema = PluginConfigSchema(
            fields={
                "key": PluginConfigField(
                    field_type="str", default="val", required=True,
                    description="Key", min_value=0, max_value=100,
                    choices=("a", "b"),
                ),
            }
        )
        d = schema.to_dict()
        assert d["key"]["type"] == "str"
        assert d["key"]["required"] is True
        assert "choices" in d["key"]


class TestPluginHealth:
    def test_default_health(self):
        h = PluginHealth()
        assert h.status == PluginStatus.DISCOVERED
        assert h.execution_count == 0

    def test_health_to_dict(self):
        h = PluginHealth(status=PluginStatus.RUNNING, execution_count=5)
        d = h.to_dict()
        assert d["status"] == "running"
        assert d["execution_count"] == 5


class TestPluginInterface:
    def setup_method(self):
        self.plugin = ConcreteTestPlugin(
            meta=PluginMeta(
                name="test_plugin", version="1.0.0", author="Test",
                description="Test", category=PluginCategory.TECHNICAL,
            )
        )

    @pytest.mark.asyncio
    async def test_initialize(self):
        result = await self.plugin.initialize({"key": "value"})
        assert result is True
        assert self.plugin.config["key"] == "value"

    @pytest.mark.asyncio
    async def test_validate(self):
        assert await self.plugin.validate() is True

    @pytest.mark.asyncio
    async def test_execute(self):
        result = await self.plugin.execute({})
        assert result["success"] is True

    @pytest.mark.asyncio
    async def test_shutdown(self):
        await self.plugin.shutdown()

    def test_properties(self):
        assert self.plugin.name == "test_plugin"
        assert self.plugin.version == "1.0.0"
        assert self.plugin.category == PluginCategory.TECHNICAL

    def test_status_dict(self):
        d = self.plugin.get_status_dict()
        assert "meta" in d
        assert "health" in d
        assert d["meta"]["name"] == "test_plugin"

    def test_record_execution(self):
        self.plugin._record_execution(True, 10.0)
        assert self.plugin.health.execution_count == 1

    def test_set_status(self):
        self.plugin._set_status(PluginStatus.ERROR, "boom")
        assert self.plugin.status == PluginStatus.ERROR
        assert self.plugin.health.error_message == "boom"

    def test_repr(self):
        r = repr(self.plugin)
        assert "test_plugin" in r


class TestBaseCategories:
    def test_technical_plugin_instantiation(self):
        p = ConcreteTestPlugin(
            meta=PluginMeta(
                name="tech", version="1.0.0", author="T",
                description="D", category=PluginCategory.TECHNICAL,
            )
        )
        assert p.category == PluginCategory.TECHNICAL

    def test_provider_plugin_instantiation(self):
        p = ConcreteTestPlugin(
            meta=PluginMeta(
                name="prov", version="1.0.0", author="T",
                description="D", category=PluginCategory.PROVIDER,
            )
        )
        assert p.category == PluginCategory.PROVIDER

    def test_ai_plugin_instantiation(self):
        p = ConcreteTestPlugin(
            meta=PluginMeta(
                name="ai", version="1.0.0", author="T",
                description="D", category=PluginCategory.AI,
            )
        )
        assert p.category == PluginCategory.AI

    def test_report_plugin_instantiation(self):
        p = ConcreteTestPlugin(
            meta=PluginMeta(
                name="report", version="1.0.0", author="T",
                description="D", category=PluginCategory.REPORT,
            )
        )
        assert p.category == PluginCategory.REPORT

    def test_notification_plugin_instantiation(self):
        p = ConcreteTestPlugin(
            meta=PluginMeta(
                name="notif", version="1.0.0", author="T",
                description="D", category=PluginCategory.NOTIFICATION,
            )
        )
        assert p.category == PluginCategory.NOTIFICATION

    def test_strategy_plugin_instantiation(self):
        p = ConcreteTestPlugin(
            meta=PluginMeta(
                name="strat", version="1.0.0", author="T",
                description="D", category=PluginCategory.STRATEGY,
            )
        )
        assert p.category == PluginCategory.STRATEGY

    def test_risk_plugin_instantiation(self):
        p = ConcreteTestPlugin(
            meta=PluginMeta(
                name="risk", version="1.0.0", author="T",
                description="D", category=PluginCategory.RISK,
            )
        )
        assert p.category == PluginCategory.RISK
