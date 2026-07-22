from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import get_settings
from app.api.v1 import api_router
from app.db.database import engine, Base

import app.models  # noqa: F401 - Import all models to register them with SQLAlchemy

settings = get_settings()

_plugin_manager = None


def get_plugin_manager():
    global _plugin_manager
    return _plugin_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _plugin_manager
    Base.metadata.create_all(bind=engine)

    from modules.data_engine.providers.base.provider_factory import ProviderFactory
    ProviderFactory.create_default_providers(
        enable_yahoo=True,
        enable_kap=True,
        enable_mock=True,
    )

    from modules.plugin_system.manager.plugin_manager import PluginManager
    _plugin_manager = PluginManager()
    _plugin_manager.set_app_version("1.0.0")

    from modules.plugin_system.api.router import set_plugin_manager
    set_plugin_manager(_plugin_manager)

    plugin_summary = await _plugin_manager.discover_and_load()
    print(f"Plugins loaded: {plugin_summary['loaded']}/{plugin_summary['discovered']}")

    yield

    if _plugin_manager:
        await _plugin_manager.shutdown_all()
        _plugin_manager = None


app = FastAPI(
    title=settings.APP_NAME,
    description="Professional AI Stock Analysis Platform for Borsa Istanbul",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.APP_DEBUG else None,
    redoc_url="/redoc" if settings.APP_DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

from modules.data_engine.api.router import router as data_engine_router
app.include_router(data_engine_router, prefix=settings.API_V1_PREFIX)

from modules.data_engine.api.provider_router import router as provider_router
app.include_router(provider_router, prefix=settings.API_V1_PREFIX)

from modules.plugin_system.api.router import router as plugin_router
app.include_router(plugin_router, prefix=settings.API_V1_PREFIX)

from modules.prices.api.router import router as price_router
app.include_router(price_router, prefix=settings.API_V1_PREFIX)

from modules.financial.api.router import router as financial_router
app.include_router(financial_router, prefix=settings.API_V1_PREFIX)

from modules.moving_average.api.router import router as ma_router
app.include_router(ma_router, prefix=settings.API_V1_PREFIX)

from modules.momentum_engine.api.router import router as momentum_router
app.include_router(momentum_router, prefix=settings.API_V1_PREFIX)

from modules.trend_engine.api.router import router as trend_router
app.include_router(trend_router, prefix=settings.API_V1_PREFIX)

from modules.volume_engine.api.router import router as volume_router
app.include_router(volume_router, prefix=settings.API_V1_PREFIX)

from modules.pattern_engine.api.router import router as pattern_router
app.include_router(pattern_router, prefix=settings.API_V1_PREFIX)

from modules.strategy_engine.api.router import router as strategy_router
app.include_router(strategy_router, prefix=settings.API_V1_PREFIX)

from modules.early_opportunity_engine.api.router import router as opportunity_router
app.include_router(opportunity_router, prefix=settings.API_V1_PREFIX)

from modules.explainability_engine.api.router import router as explainability_router
app.include_router(explainability_router, prefix=settings.API_V1_PREFIX)

from modules.scoring_engine.api.router import router as scoring_router
app.include_router(scoring_router, prefix=settings.API_V1_PREFIX)

from modules.elite_score_engine.api.router import router as elite_score_router
app.include_router(elite_score_router, prefix=settings.API_V1_PREFIX)

from modules.confidence_engine.api.router import router as confidence_router
app.include_router(confidence_router, prefix=settings.API_V1_PREFIX)

from modules.decision_engine.api.router import router as decision_router
app.include_router(decision_router, prefix=settings.API_V1_PREFIX)

from modules.backtest_engine.api.router import router as backtest_router
app.include_router(backtest_router, prefix=settings.API_V1_PREFIX)

from modules.walk_forward_engine.api.router import router as walk_forward_router
app.include_router(walk_forward_router, prefix=settings.API_V1_PREFIX)

from modules.monte_carlo_engine.api.router import router as monte_carlo_router
app.include_router(monte_carlo_router, prefix=settings.API_V1_PREFIX)

from modules.strategy_optimizer.api.router import router as strategy_optimizer_router
app.include_router(strategy_optimizer_router, prefix=settings.API_V1_PREFIX)

from modules.similarity_engine.api.router import router as similarity_router
app.include_router(similarity_router, prefix=settings.API_V1_PREFIX)

from modules.market_regime_engine.api.router import router as market_regime_router
app.include_router(market_regime_router, prefix=settings.API_V1_PREFIX)

from modules.multi_factor_engine.api.router import router as multi_factor_router
app.include_router(multi_factor_router, prefix=settings.API_V1_PREFIX)

from modules.portfolio_engine.api.router import router as portfolio_router
app.include_router(portfolio_router, prefix=settings.API_V1_PREFIX)

from modules.position_sizing_engine.api.router import router as position_sizing_router
app.include_router(position_sizing_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
def health_check():
    from modules.data_engine.providers.base.provider_registry import registry
    provider_status = registry.get_all_status()
    plugin_info = {}
    if _plugin_manager:
        plugin_info = _plugin_manager.get_all_info()
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "providers": {
            ptype: {
                "available": status.get("available_providers", 0),
                "active": status.get("active_provider"),
            }
            for ptype, status in provider_status.items()
        },
        "plugins": {
            "total": plugin_info.get("total", 0),
            "enabled": plugin_info.get("enabled", 0),
        },
    }
