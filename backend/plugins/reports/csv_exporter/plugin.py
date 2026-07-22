from __future__ import annotations

import csv
import io
from pathlib import Path
from typing import Any

from modules.plugin_system.interfaces import (
    PluginConfigField,
    PluginConfigSchema,
    PluginMeta,
    ReportExporterPlugin,
)


class CSVExporterPlugin(ReportExporterPlugin):
    def __init__(self) -> None:
        meta = PluginMeta(
            name="csv_exporter",
            version="1.0.0",
            author="BIST Elite AI",
            description="Exports data to CSV format",
            category="report",
        )
        config_schema = PluginConfigSchema(
            fields={
                "delimiter": PluginConfigField(
                    field_type="str",
                    default=",",
                    description="CSV delimiter",
                ),
                "output_dir": PluginConfigField(
                    field_type="str",
                    default="./exports",
                    description="Output directory for exported files",
                ),
            }
        )
        super().__init__(meta, config_schema)

    @property
    def supported_format(self) -> str:
        return "csv"

    async def initialize(self, config: dict[str, Any]) -> bool:
        self.set_config(config)
        output_dir = Path(self.get_config_value("output_dir", "./exports"))
        output_dir.mkdir(parents=True, exist_ok=True)
        return True

    async def validate(self) -> bool:
        return True

    async def export(
        self,
        data: dict[str, Any],
        output_path: str | None = None,
    ) -> dict[str, Any]:
        records = data.get("records", [])
        if not records:
            return {"error": "No records to export"}

        delimiter = self.get_config_value("delimiter", ",")
        headers = list(records[0].keys()) if records else []

        if output_path is None:
            output_dir = Path(self.get_config_value("output_dir", "./exports"))
            filename = data.get("filename", "export")
            output_path = str(output_dir / f"{filename}.csv")

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=headers, delimiter=delimiter)
        writer.writeheader()
        writer.writerows(records)

        content = output.getvalue()
        if output_path:
            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "w", encoding="utf-8", newline="") as f:
                f.write(content)

        return {
            "path": output_path,
            "rows": len(records),
            "columns": len(headers),
            "size_bytes": len(content.encode("utf-8")),
        }

    async def shutdown(self) -> None:
        pass
