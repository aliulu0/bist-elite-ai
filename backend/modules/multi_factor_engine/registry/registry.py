from __future__ import annotations

import threading
from typing import Any, Dict, Optional

from modules.multi_factor_engine.cache.cache import FactorCache
from modules.multi_factor_engine.factors.calculators import ALL_CALCULATORS, BaseFactorCalculator
from modules.multi_factor_engine.profiles.generator import FactorProfileGenerator
from modules.multi_factor_engine.ranking.ranker import FactorRanker
from modules.multi_factor_engine.validators.validator import RequestValidator, ResultValidator


_instance: Optional[MultiFactorRegistry] = None
_lock = threading.Lock()


class MultiFactorRegistry:
    def __init__(self) -> None:
        self._calculators = dict(ALL_CALCULATORS)
        self._ranker = FactorRanker()
        self._profile_generator = FactorProfileGenerator()
        self._request_validator = RequestValidator()
        self._result_validator = ResultValidator()
        self._cache = FactorCache()

    def get_calculator(self, group: Any) -> Optional[BaseFactorCalculator]:
        return self._calculators.get(group)

    def get_all_calculators(self) -> Dict[Any, BaseFactorCalculator]:
        return dict(self._calculators)

    def get_ranker(self) -> FactorRanker:
        return self._ranker

    def get_profile_generator(self) -> FactorProfileGenerator:
        return self._profile_generator

    def get_request_validator(self) -> RequestValidator:
        return self._request_validator

    def get_result_validator(self) -> ResultValidator:
        return self._result_validator

    def get_cache(self) -> FactorCache:
        return self._cache


def get_registry() -> MultiFactorRegistry:
    global _instance
    if _instance is None:
        with _lock:
            if _instance is None:
                _instance = MultiFactorRegistry()
    return _instance


def reset_registry() -> None:
    global _instance, _lock
    with _lock:
        _instance = None
        _lock = threading.Lock()
