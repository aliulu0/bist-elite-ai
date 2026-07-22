from __future__ import annotations

from modules.pattern_engine.core.base import BasePatternPlugin
from modules.pattern_engine.core.types import (
    PriceBar, PatternResult, PatternCategory,
)
from modules.pattern_engine.classical.classical_patterns import (
    CupHandlePlugin, DoubleBottomPlugin, DoubleTopPlugin,
    TripleBottomPlugin, TripleTopPlugin,
    AscendingTrianglePlugin, DescendingTrianglePlugin, SymmetricalTrianglePlugin,
    BullFlagPlugin, BearFlagPlugin, PennantPlugin, RectanglePlugin,
    ChannelUpPlugin, ChannelDownPlugin,
    FallingWedgePlugin, RisingWedgePlugin, DiamondPlugin, MegaphonePlugin,
)
from modules.pattern_engine.candlestick.candlestick_patterns import (
    HammerPlugin, InvertedHammerPlugin, DojiPlugin,
    DragonflyDojiPlugin, GravestoneDojiPlugin,
    MorningStarPlugin, EveningStarPlugin,
    BullishEngulfingPlugin, BearishEngulfingPlugin,
    HaramiPlugin, PiercingPlugin, DarkCloudPlugin,
    ThreeWhiteSoldiersPlugin, ThreeBlackCrowsPlugin,
    ShootingStarPlugin, HangingManPlugin,
    TweezerTopPlugin, TweezerBottomPlugin,
)
from modules.pattern_engine.smc.smc_patterns import (
    BreakOfStructurePlugin, ChangeOfCharacterPlugin,
    OrderBlockPlugin, BreakerBlockPlugin, MitigationBlockPlugin,
    FairValueGapPlugin, LiquidityGrabPlugin, LiquiditySweepPlugin,
    EqualHighsPlugin, EqualLowsPlugin,
    PremiumZonePlugin, DiscountZonePlugin, InducementPlugin,
)
from modules.pattern_engine.wyckoff.wyckoff_patterns import (
    AccumulationPlugin, DistributionPlugin,
    SpringPlugin, UpthrustPlugin,
    AutomaticRallyPlugin, SecondaryTestPlugin,
    SignOfStrengthPlugin, SignOfWeaknessPlugin,
    LastPointOfSupportPlugin, LastPointOfSupplyPlugin,
)
from modules.pattern_engine.elliott.elliott_patterns import ElliottWavePlugin


class PatternRegistry:

    def __init__(self) -> None:
        self._plugins: dict[str, BasePatternPlugin] = {}
        self._register_defaults()

    def _register_defaults(self) -> None:
        classical = [
            CupHandlePlugin(), DoubleBottomPlugin(), DoubleTopPlugin(),
            TripleBottomPlugin(), TripleTopPlugin(),
            AscendingTrianglePlugin(), DescendingTrianglePlugin(), SymmetricalTrianglePlugin(),
            BullFlagPlugin(), BearFlagPlugin(), PennantPlugin(), RectanglePlugin(),
            ChannelUpPlugin(), ChannelDownPlugin(),
            FallingWedgePlugin(), RisingWedgePlugin(), DiamondPlugin(), MegaphonePlugin(),
        ]
        candlestick = [
            HammerPlugin(), InvertedHammerPlugin(), DojiPlugin(),
            DragonflyDojiPlugin(), GravestoneDojiPlugin(),
            MorningStarPlugin(), EveningStarPlugin(),
            BullishEngulfingPlugin(), BearishEngulfingPlugin(),
            HaramiPlugin(), PiercingPlugin(), DarkCloudPlugin(),
            ThreeWhiteSoldiersPlugin(), ThreeBlackCrowsPlugin(),
            ShootingStarPlugin(), HangingManPlugin(),
            TweezerTopPlugin(), TweezerBottomPlugin(),
        ]
        smc = [
            BreakOfStructurePlugin(), ChangeOfCharacterPlugin(),
            OrderBlockPlugin(), BreakerBlockPlugin(), MitigationBlockPlugin(),
            FairValueGapPlugin(), LiquidityGrabPlugin(), LiquiditySweepPlugin(),
            EqualHighsPlugin(), EqualLowsPlugin(),
            PremiumZonePlugin(), DiscountZonePlugin(), InducementPlugin(),
        ]
        wyckoff = [
            AccumulationPlugin(), DistributionPlugin(),
            SpringPlugin(), UpthrustPlugin(),
            AutomaticRallyPlugin(), SecondaryTestPlugin(),
            SignOfStrengthPlugin(), SignOfWeaknessPlugin(),
            LastPointOfSupportPlugin(), LastPointOfSupplyPlugin(),
        ]
        elliott = [ElliottWavePlugin()]
        for p in classical + candlestick + smc + wyckoff + elliott:
            self._plugins[p.name] = p

    def register(self, plugin: BasePatternPlugin) -> None:
        self._plugins[plugin.name] = plugin

    def unregister(self, name: str) -> bool:
        if name in self._plugins:
            del self._plugins[name]
            return True
        return False

    def get(self, name: str) -> BasePatternPlugin | None:
        return self._plugins.get(name)

    def list_plugins(self) -> list[dict]:
        return [p.metadata() for p in self._plugins.values()]

    def list_by_category(self, category: PatternCategory) -> list[BasePatternPlugin]:
        return [p for p in self._plugins.values() if p.category == category]

    def detect_all(
        self, prices: list[PriceBar], category: PatternCategory | None = None, **params
    ) -> list[PatternResult]:
        results: list[PatternResult] = []
        plugins = self.list_by_category(category) if category else list(self._plugins.values())
        for plugin in plugins:
            validation_errors = plugin.validate(prices, **params)
            if validation_errors:
                continue
            results.extend(plugin.detect(prices, **params))
        return results

    @property
    def count(self) -> int:
        return len(self._plugins)

    def __contains__(self, name: str) -> bool:
        return name in self._plugins

    def __len__(self) -> int:
        return len(self._plugins)
