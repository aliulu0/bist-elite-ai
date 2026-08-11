-- CreateEnum
CREATE TYPE "MarketSegment" AS ENUM ('MAIN', 'SECONDARY', 'COLLECTOR', 'IPO');

-- CreateEnum
CREATE TYPE "Timeframe" AS ENUM ('M4', 'D1', 'W1', 'M1');

-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "SignalStrength" AS ENUM ('WEAK', 'MODERATE', 'STRONG', 'VERY_STRONG');

-- CreateEnum
CREATE TYPE "SignalAction" AS ENUM ('BUY', 'SELL', 'HOLD', 'WATCH');

-- CreateEnum
CREATE TYPE "BacktestStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "MarketRegimeType" AS ENUM ('BULL', 'BEAR', 'SIDEWAYS', 'HIGH_VOLATILITY', 'LOW_VOLATILITY', 'CRASH', 'RECOVERY', 'MOMENTUM', 'MEAN_REVERSION', 'BREAKOUT', 'CONSOLIDATION', 'TRANSITION');

-- CreateEnum
CREATE TYPE "CorporateActionType" AS ENUM ('DIVIDEND', 'SPLIT', 'BONUS', 'RIGHTS', 'MERGER', 'DEMERGER', 'NAME_CHANGE', 'SECTOR_CHANGE');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "LogSeverity" AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "industry" TEXT,
    "marketCap" DOUBLE PRECISION,
    "marketSegment" "MarketSegment" NOT NULL DEFAULT 'MAIN',
    "isin" TEXT,
    "website" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "listedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stock" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "exchange" TEXT NOT NULL DEFAULT 'BIST',
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "lotSize" INTEGER NOT NULL DEFAULT 1,
    "tickSize" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalPrice" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeframe" "Timeframe" NOT NULL DEFAULT 'D1',
    "open" DECIMAL(18,4) NOT NULL,
    "high" DECIMAL(18,4) NOT NULL,
    "low" DECIMAL(18,4) NOT NULL,
    "close" DECIMAL(18,4) NOT NULL,
    "adjustedClose" DECIMAL(18,4) NOT NULL,
    "volume" BIGINT NOT NULL,
    "turnover" DECIMAL(18,4),
    "changePercent" DECIMAL(8,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricalPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntradayPrice" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" DECIMAL(18,4) NOT NULL,
    "high" DECIMAL(18,4) NOT NULL,
    "low" DECIMAL(18,4) NOT NULL,
    "close" DECIMAL(18,4) NOT NULL,
    "volume" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntradayPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateAction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "CorporateActionType" NOT NULL,
    "exDate" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(18,4),
    "ratio" DECIMAL(10,4),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "CorporateAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradingSession" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "openTime" TIMESTAMP(3) NOT NULL,
    "closeTime" TIMESTAMP(3) NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorSnapshot" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "indicator" TEXT NOT NULL,
    "timeframe" "Timeframe" NOT NULL DEFAULT 'D1',
    "value" DECIMAL(18,6) NOT NULL,
    "signal" TEXT,
    "parameters" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndicatorSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialStatement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "revenue" DECIMAL(18,4),
    "costOfRevenue" DECIMAL(18,4),
    "grossProfit" DECIMAL(18,4),
    "operatingIncome" DECIMAL(18,4),
    "netIncome" DECIMAL(18,4),
    "totalAssets" DECIMAL(18,4),
    "totalLiabilities" DECIMAL(18,4),
    "totalEquity" DECIMAL(18,4),
    "cashAndEquivalents" DECIMAL(18,4),
    "debt" DECIMAL(18,4),
    "sharesOutstanding" DECIMAL(18,0),
    "eps" DECIMAL(18,4),
    "bookValue" DECIMAL(18,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "FinancialStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialRatio" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "peRatio" DECIMAL(10,4),
    "pbRatio" DECIMAL(10,4),
    "psRatio" DECIMAL(10,4),
    "pcfRatio" DECIMAL(10,4),
    "evEbitda" DECIMAL(10,4),
    "roe" DECIMAL(10,4),
    "roa" DECIMAL(10,4),
    "roic" DECIMAL(10,4),
    "grossMargin" DECIMAL(10,4),
    "operatingMargin" DECIMAL(10,4),
    "netMargin" DECIMAL(10,4),
    "currentRatio" DECIMAL(10,4),
    "quickRatio" DECIMAL(10,4),
    "debtToEquity" DECIMAL(10,4),
    "dividendYield" DECIMAL(10,4),
    "payoutRatio" DECIMAL(10,4),
    "beta" DECIMAL(10,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "FinancialRatio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalScore" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "timeframe" "Timeframe" NOT NULL DEFAULT 'D1',
    "momentum" DECIMAL(5,2),
    "trend" DECIMAL(5,2),
    "volatility" DECIMAL(5,2),
    "volume" DECIMAL(5,2),
    "support" DECIMAL(5,2),
    "resistance" DECIMAL(5,2),
    "pattern" DECIMAL(5,2),
    "composite" DECIMAL(5,2) NOT NULL,
    "factors" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicalScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialScore" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "growth" DECIMAL(5,2),
    "profitability" DECIMAL(5,2),
    "valuation" DECIMAL(5,2),
    "quality" DECIMAL(5,2),
    "health" DECIMAL(5,2),
    "composite" DECIMAL(5,2) NOT NULL,
    "factors" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EliteScore" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "timeframe" "Timeframe" NOT NULL DEFAULT 'D1',
    "technical" DECIMAL(5,2) NOT NULL,
    "financial" DECIMAL(5,2) NOT NULL,
    "confidence" DECIMAL(5,2) NOT NULL,
    "composite" DECIMAL(5,2) NOT NULL,
    "rank" INTEGER,
    "positiveFactors" JSONB,
    "negativeFactors" JSONB,
    "reasoning" TEXT,
    "regime" "MarketRegimeType",
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EliteScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfidenceScore" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "timeframe" "Timeframe" NOT NULL DEFAULT 'D1',
    "dataQuality" DECIMAL(5,2) NOT NULL,
    "modelConsistency" DECIMAL(5,2) NOT NULL,
    "regimeStability" DECIMAL(5,2) NOT NULL,
    "historicalMatch" DECIMAL(5,2),
    "composite" DECIMAL(5,2) NOT NULL,
    "factors" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfidenceScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionSignal" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "timeframe" "Timeframe" NOT NULL DEFAULT 'D1',
    "action" "SignalAction" NOT NULL,
    "strength" "SignalStrength" NOT NULL,
    "entryPrice" DECIMAL(18,4),
    "targetPrice" DECIMAL(18,4),
    "stopLossPrice" DECIMAL(18,4),
    "riskRewardRatio" DECIMAL(5,2),
    "positionSize" DECIMAL(5,2),
    "reasoning" TEXT,
    "factors" JSONB,
    "expiresAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacktestResult" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "strategyName" TEXT NOT NULL,
    "timeframe" "Timeframe" NOT NULL DEFAULT 'D1',
    "status" "BacktestStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "initialCapital" DECIMAL(18,4) NOT NULL,
    "finalCapital" DECIMAL(18,4),
    "totalReturn" DECIMAL(10,4),
    "annualReturn" DECIMAL(10,4),
    "sharpeRatio" DECIMAL(10,4),
    "sortinoRatio" DECIMAL(10,4),
    "maxDrawdown" DECIMAL(10,4),
    "winRate" DECIMAL(5,2),
    "profitFactor" DECIMAL(10,4),
    "totalTrades" INTEGER,
    "avgTradeReturn" DECIMAL(10,4),
    "parameters" JSONB,
    "trades" JSONB,
    "equity" JSONB,
    "errorMessage" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "BacktestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalkForwardResult" (
    "id" TEXT NOT NULL,
    "backtestId" TEXT NOT NULL,
    "windowIndex" INTEGER NOT NULL,
    "inSampleStart" TIMESTAMP(3) NOT NULL,
    "inSampleEnd" TIMESTAMP(3) NOT NULL,
    "outSampleStart" TIMESTAMP(3) NOT NULL,
    "outSampleEnd" TIMESTAMP(3) NOT NULL,
    "inSampleReturn" DECIMAL(10,4),
    "outSampleReturn" DECIMAL(10,4),
    "parameters" JSONB,
    "degradationRatio" DECIMAL(10,4),
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalkForwardResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonteCarloResult" (
    "id" TEXT NOT NULL,
    "backtestId" TEXT NOT NULL,
    "simulations" INTEGER NOT NULL,
    "confidenceLevel" DECIMAL(5,2) NOT NULL,
    "var95" DECIMAL(10,4),
    "var99" DECIMAL(10,4),
    "cvar95" DECIMAL(10,4),
    "cvar99" DECIMAL(10,4),
    "expectedReturn" DECIMAL(10,4),
    "worstCase" DECIMAL(10,4),
    "bestCase" DECIMAL(10,4),
    "percentiles" JSONB,
    "simulations_data" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonteCarloResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "strategy" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioPosition" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "avgPrice" DECIMAL(18,4) NOT NULL,
    "weight" DECIMAL(5,4) NOT NULL,
    "side" "OrderSide" NOT NULL DEFAULT 'BUY',
    "entryDate" TIMESTAMP(3) NOT NULL,
    "exitDate" TIMESTAMP(3),
    "exitPrice" DECIMAL(18,4),
    "stopLoss" DECIMAL(18,4),
    "takeProfit" DECIMAL(18,4),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "PortfolioPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioSnapshot" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalValue" DECIMAL(18,4) NOT NULL,
    "cashBalance" DECIMAL(18,4) NOT NULL,
    "investedValue" DECIMAL(18,4) NOT NULL,
    "dailyReturn" DECIMAL(10,4),
    "totalReturn" DECIMAL(10,4),
    "sharpeRatio" DECIMAL(10,4),
    "maxDrawdown" DECIMAL(10,4),
    "positions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskProfile" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "maxPositionSize" DECIMAL(5,4) NOT NULL,
    "maxSectorExposure" DECIMAL(5,4) NOT NULL,
    "maxCorrelation" DECIMAL(5,4) NOT NULL,
    "stopLossPercent" DECIMAL(5,4) NOT NULL,
    "takeProfitRatio" DECIMAL(5,2) NOT NULL,
    "maxDrawdown" DECIMAL(5,4) NOT NULL,
    "varLimit" DECIMAL(10,4),
    "cvarLimit" DECIMAL(10,4),
    "parameters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketRegime" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeframe" "Timeframe" NOT NULL DEFAULT 'D1',
    "regime" "MarketRegimeType" NOT NULL,
    "confidence" DECIMAL(5,2) NOT NULL,
    "vixLevel" DECIMAL(10,4),
    "breadthIndicator" DECIMAL(5,2),
    "momentumScore" DECIMAL(5,2),
    "factors" JSONB,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketRegime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationLog" (
    "id" TEXT NOT NULL,
    "severity" "LogSeverity" NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "traceId" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "watchlistId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationQueue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "chatId" BIGINT NOT NULL,
    "messageId" BIGINT,
    "text" TEXT NOT NULL,
    "command" TEXT,
    "parameters" JSONB,
    "response" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_symbol_key" ON "Company"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Company_isin_key" ON "Company"("isin");

-- CreateIndex
CREATE INDEX "Company_symbol_idx" ON "Company"("symbol");

-- CreateIndex
CREATE INDEX "Company_sector_idx" ON "Company"("sector");

-- CreateIndex
CREATE INDEX "Company_industry_idx" ON "Company"("industry");

-- CreateIndex
CREATE INDEX "Company_marketCap_idx" ON "Company"("marketCap");

-- CreateIndex
CREATE INDEX "Company_marketSegment_idx" ON "Company"("marketSegment");

-- CreateIndex
CREATE INDEX "Company_isActive_idx" ON "Company"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_symbol_key" ON "Stock"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Stock_ticker_exchange_key" ON "Stock"("ticker", "exchange");

-- CreateIndex
CREATE INDEX "Stock_symbol_idx" ON "Stock"("symbol");

-- CreateIndex
CREATE INDEX "Stock_ticker_idx" ON "Stock"("ticker");

-- CreateIndex
CREATE INDEX "Stock_exchange_idx" ON "Stock"("exchange");

-- CreateIndex
CREATE INDEX "Stock_isActive_idx" ON "Stock"("isActive");

-- CreateIndex
CREATE INDEX "Stock_companyId_idx" ON "Stock"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "HistoricalPrice_stockId_date_timeframe_key" ON "HistoricalPrice"("stockId", "date", "timeframe");

-- CreateIndex
CREATE INDEX "HistoricalPrice_stockId_date_idx" ON "HistoricalPrice"("stockId", "date");

-- CreateIndex
CREATE INDEX "HistoricalPrice_stockId_timeframe_idx" ON "HistoricalPrice"("stockId", "timeframe");

-- CreateIndex
CREATE INDEX "HistoricalPrice_date_idx" ON "HistoricalPrice"("date");

-- CreateIndex
CREATE INDEX "HistoricalPrice_timeframe_idx" ON "HistoricalPrice"("timeframe");

-- CreateIndex
CREATE UNIQUE INDEX "IntradayPrice_stockId_timestamp_key" ON "IntradayPrice"("stockId", "timestamp");

-- CreateIndex
CREATE INDEX "IntradayPrice_stockId_timestamp_idx" ON "IntradayPrice"("stockId", "timestamp");

-- CreateIndex
CREATE INDEX "IntradayPrice_timestamp_idx" ON "IntradayPrice"("timestamp");

-- CreateIndex
CREATE INDEX "CorporateAction_companyId_exDate_idx" ON "CorporateAction"("companyId", "exDate");

-- CreateIndex
CREATE INDEX "CorporateAction_type_idx" ON "CorporateAction"("type");

-- CreateIndex
CREATE INDEX "CorporateAction_exDate_idx" ON "CorporateAction"("exDate");

-- CreateIndex
CREATE UNIQUE INDEX "TradingSession_date_key" ON "TradingSession"("date");

-- CreateIndex
CREATE INDEX "TradingSession_date_idx" ON "TradingSession"("date");

-- CreateIndex
CREATE INDEX "TradingSession_isOpen_idx" ON "TradingSession"("isOpen");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorSnapshot_stockId_indicator_timeframe_computedAt_key" ON "IndicatorSnapshot"("stockId", "indicator", "timeframe", "computedAt");

-- CreateIndex
CREATE INDEX "IndicatorSnapshot_stockId_indicator_idx" ON "IndicatorSnapshot"("stockId", "indicator");

-- CreateIndex
CREATE INDEX "IndicatorSnapshot_stockId_timeframe_idx" ON "IndicatorSnapshot"("stockId", "timeframe");

-- CreateIndex
CREATE INDEX "IndicatorSnapshot_indicator_idx" ON "IndicatorSnapshot"("indicator");

-- CreateIndex
CREATE INDEX "IndicatorSnapshot_computedAt_idx" ON "IndicatorSnapshot"("computedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialStatement_companyId_period_reportType_key" ON "FinancialStatement"("companyId", "period", "reportType");

-- CreateIndex
CREATE INDEX "FinancialStatement_companyId_period_idx" ON "FinancialStatement"("companyId", "period");

-- CreateIndex
CREATE INDEX "FinancialStatement_period_idx" ON "FinancialStatement"("period");

-- CreateIndex
CREATE INDEX "FinancialStatement_reportType_idx" ON "FinancialStatement"("reportType");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialRatio_companyId_period_key" ON "FinancialRatio"("companyId", "period");

-- CreateIndex
CREATE INDEX "FinancialRatio_companyId_period_idx" ON "FinancialRatio"("companyId", "period");

-- CreateIndex
CREATE INDEX "FinancialRatio_period_idx" ON "FinancialRatio"("period");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalScore_stockId_timeframe_computedAt_key" ON "TechnicalScore"("stockId", "timeframe", "computedAt");

-- CreateIndex
CREATE INDEX "TechnicalScore_stockId_timeframe_idx" ON "TechnicalScore"("stockId", "timeframe");

-- CreateIndex
CREATE INDEX "TechnicalScore_computedAt_idx" ON "TechnicalScore"("computedAt");

-- CreateIndex
CREATE INDEX "TechnicalScore_composite_idx" ON "TechnicalScore"("composite");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialScore_stockId_period_computedAt_key" ON "FinancialScore"("stockId", "period", "computedAt");

-- CreateIndex
CREATE INDEX "FinancialScore_stockId_period_idx" ON "FinancialScore"("stockId", "period");

-- CreateIndex
CREATE INDEX "FinancialScore_computedAt_idx" ON "FinancialScore"("computedAt");

-- CreateIndex
CREATE INDEX "FinancialScore_composite_idx" ON "FinancialScore"("composite");

-- CreateIndex
CREATE UNIQUE INDEX "EliteScore_stockId_timeframe_computedAt_key" ON "EliteScore"("stockId", "timeframe", "computedAt");

-- CreateIndex
CREATE INDEX "EliteScore_stockId_timeframe_idx" ON "EliteScore"("stockId", "timeframe");

-- CreateIndex
CREATE INDEX "EliteScore_computedAt_idx" ON "EliteScore"("computedAt");

-- CreateIndex
CREATE INDEX "EliteScore_composite_idx" ON "EliteScore"("composite");

-- CreateIndex
CREATE INDEX "EliteScore_rank_idx" ON "EliteScore"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "ConfidenceScore_stockId_timeframe_computedAt_key" ON "ConfidenceScore"("stockId", "timeframe", "computedAt");

-- CreateIndex
CREATE INDEX "ConfidenceScore_stockId_timeframe_idx" ON "ConfidenceScore"("stockId", "timeframe");

-- CreateIndex
CREATE INDEX "ConfidenceScore_computedAt_idx" ON "ConfidenceScore"("computedAt");

-- CreateIndex
CREATE INDEX "ConfidenceScore_composite_idx" ON "ConfidenceScore"("composite");

-- CreateIndex
CREATE UNIQUE INDEX "DecisionSignal_stockId_timeframe_generatedAt_key" ON "DecisionSignal"("stockId", "timeframe", "generatedAt");

-- CreateIndex
CREATE INDEX "DecisionSignal_stockId_timeframe_idx" ON "DecisionSignal"("stockId", "timeframe");

-- CreateIndex
CREATE INDEX "DecisionSignal_action_idx" ON "DecisionSignal"("action");

-- CreateIndex
CREATE INDEX "DecisionSignal_strength_idx" ON "DecisionSignal"("strength");

-- CreateIndex
CREATE INDEX "DecisionSignal_generatedAt_idx" ON "DecisionSignal"("generatedAt");

-- CreateIndex
CREATE INDEX "DecisionSignal_expiresAt_idx" ON "DecisionSignal"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "BacktestResult_stockId_strategyName_timeframe_startDate_endDate_key" ON "BacktestResult"("stockId", "strategyName", "timeframe", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "BacktestResult_stockId_strategyName_idx" ON "BacktestResult"("stockId", "strategyName");

-- CreateIndex
CREATE INDEX "BacktestResult_status_idx" ON "BacktestResult"("status");

-- CreateIndex
CREATE INDEX "BacktestResult_sharpeRatio_idx" ON "BacktestResult"("sharpeRatio");

-- CreateIndex
CREATE INDEX "BacktestResult_totalReturn_idx" ON "BacktestResult"("totalReturn");

-- CreateIndex
CREATE INDEX "BacktestResult_computedAt_idx" ON "BacktestResult"("computedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WalkForwardResult_backtestId_windowIndex_key" ON "WalkForwardResult"("backtestId", "windowIndex");

-- CreateIndex
CREATE INDEX "WalkForwardResult_backtestId_idx" ON "WalkForwardResult"("backtestId");

-- CreateIndex
CREATE INDEX "WalkForwardResult_outSampleReturn_idx" ON "WalkForwardResult"("outSampleReturn");

-- CreateIndex
CREATE UNIQUE INDEX "MonteCarloResult_backtestId_confidenceLevel_key" ON "MonteCarloResult"("backtestId", "confidenceLevel");

-- CreateIndex
CREATE INDEX "MonteCarloResult_backtestId_idx" ON "MonteCarloResult"("backtestId");

-- CreateIndex
CREATE INDEX "Portfolio_name_idx" ON "Portfolio"("name");

-- CreateIndex
CREATE INDEX "Portfolio_isDefault_idx" ON "Portfolio"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioPosition_portfolioId_stockId_entryDate_key" ON "PortfolioPosition"("portfolioId", "stockId", "entryDate");

-- CreateIndex
CREATE INDEX "PortfolioPosition_portfolioId_idx" ON "PortfolioPosition"("portfolioId");

-- CreateIndex
CREATE INDEX "PortfolioPosition_stockId_idx" ON "PortfolioPosition"("stockId");

-- CreateIndex
CREATE INDEX "PortfolioPosition_entryDate_idx" ON "PortfolioPosition"("entryDate");

-- CreateIndex
CREATE INDEX "PortfolioPosition_exitDate_idx" ON "PortfolioPosition"("exitDate");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioSnapshot_portfolioId_date_key" ON "PortfolioSnapshot"("portfolioId", "date");

-- CreateIndex
CREATE INDEX "PortfolioSnapshot_portfolioId_date_idx" ON "PortfolioSnapshot"("portfolioId", "date");

-- CreateIndex
CREATE INDEX "PortfolioSnapshot_date_idx" ON "PortfolioSnapshot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "RiskProfile_portfolioId_riskLevel_key" ON "RiskProfile"("portfolioId", "riskLevel");

-- CreateIndex
CREATE INDEX "RiskProfile_portfolioId_idx" ON "RiskProfile"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketRegime_date_timeframe_key" ON "MarketRegime"("date", "timeframe");

-- CreateIndex
CREATE INDEX "MarketRegime_date_idx" ON "MarketRegime"("date");

-- CreateIndex
CREATE INDEX "MarketRegime_timeframe_idx" ON "MarketRegime"("timeframe");

-- CreateIndex
CREATE INDEX "MarketRegime_regime_idx" ON "MarketRegime"("regime");

-- CreateIndex
CREATE INDEX "MarketRegime_detectedAt_idx" ON "MarketRegime"("detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_key_idx" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSetting_category_idx" ON "SystemSetting"("category");

-- CreateIndex
CREATE INDEX "SystemSetting_isActive_idx" ON "SystemSetting"("isActive");

-- CreateIndex
CREATE INDEX "ApplicationLog_severity_idx" ON "ApplicationLog"("severity");

-- CreateIndex
CREATE INDEX "ApplicationLog_source_idx" ON "ApplicationLog"("source");

-- CreateIndex
CREATE INDEX "ApplicationLog_createdAt_idx" ON "ApplicationLog"("createdAt");

-- CreateIndex
CREATE INDEX "ApplicationLog_traceId_idx" ON "ApplicationLog"("traceId");

-- CreateIndex
CREATE INDEX "ApplicationLog_userId_idx" ON "ApplicationLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "Watchlist_userId_idx" ON "Watchlist"("userId");

-- CreateIndex
CREATE INDEX "Watchlist_name_idx" ON "Watchlist"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_watchlistId_stockId_key" ON "WatchlistItem"("watchlistId", "stockId");

-- CreateIndex
CREATE INDEX "WatchlistItem_watchlistId_idx" ON "WatchlistItem"("watchlistId");

-- CreateIndex
CREATE INDEX "WatchlistItem_stockId_idx" ON "WatchlistItem"("stockId");

-- CreateIndex
CREATE INDEX "NotificationQueue_userId_status_idx" ON "NotificationQueue"("userId", "status");

-- CreateIndex
CREATE INDEX "NotificationQueue_status_idx" ON "NotificationQueue"("status");

-- CreateIndex
CREATE INDEX "NotificationQueue_createdAt_idx" ON "NotificationQueue"("createdAt");

-- CreateIndex
CREATE INDEX "TelegramMessage_chatId_idx" ON "TelegramMessage"("chatId");

-- CreateIndex
CREATE INDEX "TelegramMessage_userId_idx" ON "TelegramMessage"("userId");

-- CreateIndex
CREATE INDEX "TelegramMessage_command_idx" ON "TelegramMessage"("command");

-- CreateIndex
CREATE INDEX "TelegramMessage_sentAt_idx" ON "TelegramMessage"("sentAt");

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricalPrice" ADD CONSTRAINT "HistoricalPrice_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntradayPrice" ADD CONSTRAINT "IntradayPrice_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateAction" ADD CONSTRAINT "CorporateAction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorSnapshot" ADD CONSTRAINT "IndicatorSnapshot_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialStatement" ADD CONSTRAINT "FinancialStatement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRatio" ADD CONSTRAINT "FinancialRatio_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalScore" ADD CONSTRAINT "TechnicalScore_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialScore" ADD CONSTRAINT "FinancialScore_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EliteScore" ADD CONSTRAINT "EliteScore_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfidenceScore" ADD CONSTRAINT "ConfidenceScore_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionSignal" ADD CONSTRAINT "DecisionSignal_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BacktestResult" ADD CONSTRAINT "BacktestResult_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalkForwardResult" ADD CONSTRAINT "WalkForwardResult_backtestId_fkey" FOREIGN KEY ("backtestId") REFERENCES "BacktestResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonteCarloResult" ADD CONSTRAINT "MonteCarloResult_backtestId_fkey" FOREIGN KEY ("backtestId") REFERENCES "BacktestResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioPosition" ADD CONSTRAINT "PortfolioPosition_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioPosition" ADD CONSTRAINT "PortfolioPosition_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioSnapshot" ADD CONSTRAINT "PortfolioSnapshot_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskProfile" ADD CONSTRAINT "RiskProfile_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationQueue" ADD CONSTRAINT "NotificationQueue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramMessage" ADD CONSTRAINT "TelegramMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
