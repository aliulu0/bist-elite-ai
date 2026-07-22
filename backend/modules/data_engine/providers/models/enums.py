from enum import Enum, auto


class ProviderType(str, Enum):
    PRICE = "price"
    FINANCIAL = "financial"
    TECHNICAL = "technical"
    NEWS = "news"
    SECTOR = "sector"


class ProviderStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    RATE_LIMITED = "rate_limited"
    UNAVAILABLE = "unavailable"


class ProviderPriority(int, Enum):
    PRIMARY = 1
    SECONDARY = 2
    FALLBACK = 3
    MOCK = 99


class ProviderSource(str, Enum):
    MOCK = "mock"
    YAHOO_FINANCE = "yahoo_finance"
    FINNHUB = "finnhub"
    POLYGON = "polygon"
    ALPHA_VANTAGE = "alpha_vantage"
    FMP = "financial_modeling_prep"
    KAP = "kap"
    MATRIKS = "matriks"
    TRADINGVIEW = "tradingview"
    FINTABLES = "fintables"
    LOCAL = "local"


class DataType(str, Enum):
    COMPANY_LIST = "company_list"
    DAILY_PRICES = "daily_prices"
    FINANCIAL_REPORTS = "financial_reports"
    TECHNICAL_INDICATORS = "technical_indicators"
    NEWS_ARTICLES = "news_articles"
    SECTOR_DATA = "sector_data"
