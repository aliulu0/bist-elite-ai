# BIST Elite AI - Plugin System

## Architecture

The Plugin System enables modular extensibility for the BIST Elite AI platform. Plugins are discovered automatically from the `plugins/` directory at application startup and can be enabled/disabled dynamically via the REST API.

### Core Components

| Component | Path | Responsibility |
|-----------|------|----------------|
| `PluginInterface` | `interfaces/base.py` | Abstract base class all plugins must extend |
| `PluginManager` | `manager/plugin_manager.py` | Orchestrates discovery, loading, and lifecycle |
| `PluginLoader` | `manager/plugin_loader.py` | Filesystem discovery, manifest parsing, dynamic import |
| `PluginRegistry` | `manager/plugin_registry.py` | Singleton tracking all loaded plugin instances |
| `PluginConfiguration` | `config/plugin_configuration.py` | Persistent enable/disable and custom config per plugin |

### Plugin Lifecycle

```
Discover (plugin.json) → Load (entry_point.class_name) → Initialize → Validate → Execute → Shutdown
```

1. **Discover**: `PluginLoader.discover()` scans `plugins/` for `plugin.json` manifests
2. **Load**: Dynamically imports the entry point module and instantiates the plugin class
3. **Initialize**: `initialize(config)` called with stored configuration
4. **Validate**: `validate()` called to verify the plugin is in a valid state
5. **Execute**: `execute(context)` called on demand with arbitrary context dict
6. **Shutdown**: `shutdown()` called when the application is stopping

### 7 Plugin Categories

| Category | Base Class | Purpose |
|----------|-----------|---------|
| `TECHNICAL` | `TechnicalIndicatorPlugin` | Custom technical indicators |
| `PROVIDER` | `DataProviderPlugin` | Alternative data sources |
| `AI` | `AIPlugin` | AI/ML analysis extensions |
| `REPORT` | `ReportExporterPlugin` | Custom report exporters |
| `NOTIFICATION` | `NotificationPlugin` | Alert delivery channels |
| `STRATEGY` | `StrategyPlugin` | Trading strategy signals |
| `RISK` | `RiskModelPlugin` | Risk calculation models |

---

## Creating a Plugin

### Step 1: Create the directory

```
plugins/my_plugin/
├── plugin.json       ← Manifest
└── my_plugin.py      ← Plugin implementation
```

### Step 2: Write the manifest (`plugin.json`)

```json
{
  "name": "my_plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Does something useful",
  "category": "technical",
  "entry_point": "my_plugin",
  "class_name": "MyPlugin",
  "min_app_version": "1.0.0",
  "max_app_version": "2.0.0",
  "dependencies": [],
  "permissions": ["READ_DATA"]
}
```

### Step 3: Implement the plugin

```python
from modules.plugin_system.interfaces import TechnicalIndicatorPlugin, PluginMeta, PluginCategory


class MyPlugin(TechnicalIndicatorPlugin):
    @property
    def meta(self) -> PluginMeta:
        return PluginMeta(
            name="my_plugin",
            version="1.0.0",
            author="Your Name",
            description="Does something useful",
            category=PluginCategory.TECHNICAL,
        )

    def initialize(self, config: dict) -> bool:
        if not super().initialize(config):
            return False
        # Custom initialization
        self._threshold = config.get("threshold", 14)
        return True

    def validate(self) -> bool:
        return self._initialized and hasattr(self, "_threshold")

    def execute(self, context: dict) -> dict:
        price_data = context.get("price_data", [])
        # Your calculation logic here
        return {"indicator_value": 42.0}

    def calculate(self, price_data: list, params: dict = None) -> list:
        # Implement indicator calculation
        return [{"value": 42.0}]
```

### Key rules

- The class specified in `plugin.json` → `class_name` **must** be importable from the `entry_point` module
- `initialize()` must return `True` on success, `False` on failure
- `validate()` should check all prerequisites before execution
- `execute()` receives a context dict and must return a dict result
- Use `self.get_config_value(key)` to read stored configuration
- Use `self._health.record_execution()` / `self._health.record_error()` for metrics

---

## Plugin Permissions

| Permission | Description |
|-----------|-------------|
| `READ_DATA` | Read market/company data |
| `WRITE_DATA` | Write computed data back to the database |
| `READ_CONFIG` | Read application configuration |
| `WRITE_CONFIG` | Modify application configuration |
| `ACCESS_DATABASE` | Direct database access |
| `ACCESS_NETWORK` | Make external HTTP requests |
| `ACCESS_FILESYSTEM` | Read/write files on disk |
| `REGISTER_ROUTES` | Register custom API routes |
| `MODIFY_CORE` | Modify core system behavior |
| `ACCESS_AI` | Access AI/LLM capabilities |

---

## REST API

### List plugins

```
GET /api/v1/plugins/
```

### Get plugin info

```
GET /api/v1/plugins/{name}
```

### Enable / Disable plugin

```
POST /api/v1/plugins/{name}/enable
POST /api/v1/plugins/{name}/disable
```

### Execute plugin

```
POST /api/v1/plugins/{name}/execute
Body: {"context": {"key": "value"}}
```

### Discover plugins (rescan filesystem)

```
POST /api/v1/plugins/discover
```

### Shutdown all plugins

```
POST /api/v1/plugins/shutdown
```

---

## Configuration

Plugin configurations are persisted in `plugins/plugin_configs.json`:

```json
{
  "my_plugin": {
    "enabled": true,
    "config": {"threshold": 14}
  }
}
```

Use `PluginConfiguration` programmatically:

```python
from modules.plugin_system import PluginConfiguration

config = PluginConfiguration.instance()
config.set_plugin_enabled("my_plugin", True)
config.set_plugin_config("my_plugin", {"threshold": 21})
```

---

## Example Plugins (7 shipped)

| Plugin | Category | Description |
|--------|----------|-------------|
| `rsi_calculator` | TECHNICAL | RSI indicator with configurable period |
| `csv_exporter` | REPORT | Exports report data to CSV files |
| `log_notifier` | NOTIFICATION | Sends notifications to application logs |
| `ma_crossover_strategy` | STRATEGY | Moving average crossover signal generator |
| `portfolio_risk` | RISK | Portfolio risk calculation (VaR, volatility) |
| `sentiment_analyzer` | AI | Basic market sentiment analysis |
| `mock_data_provider` | PROVIDER | Mock data for testing |

---

## Testing

```bash
cd backend
python -m pytest tests/plugin_system/ -v
```

**47 tests** covering: interfaces, base categories, loader, registry, manager, configuration.

---

## UML

See `docs/PLUGIN_SYSTEM.puml` for the complete class diagram.
