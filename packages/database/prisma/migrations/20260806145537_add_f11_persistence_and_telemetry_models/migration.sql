-- CreateTable
CREATE TABLE "AnalysisResult" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "eliteScore" DOUBLE PRECISION,
    "eliteRating" TEXT,
    "elitePriority" TEXT,
    "opportunityScore" DOUBLE PRECISION,
    "opportunityLevel" TEXT,
    "financialScore" DOUBLE PRECISION,
    "technicalScore" DOUBLE PRECISION,
    "smartMoneyScore" DOUBLE PRECISION,
    "confluenceScore" DOUBLE PRECISION,
    "candidateScore" DOUBLE PRECISION,
    "candidatePriority" TEXT,
    "confidence" DOUBLE PRECISION,
    "earlyOpportunity" BOOLEAN NOT NULL DEFAULT false,
    "indicators" JSONB,
    "marketStructure" JSONB,
    "smartMoney" JSONB,
    "technicalRules" JSONB,
    "technicalSummary" JSONB,
    "financialRules" JSONB,
    "financialSummary" JSONB,
    "confluence" JSONB,
    "candidate" JSONB,
    "opportunityDetail" JSONB,
    "eliteScoreDetail" JSONB,
    "pipelineSteps" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScannerRun" (
    "id" TEXT NOT NULL,
    "scanType" TEXT NOT NULL,
    "totalSymbols" INTEGER NOT NULL DEFAULT 0,
    "topCandidateCount" INTEGER NOT NULL DEFAULT 0,
    "watchlistCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "avgEliteScore" DOUBLE PRECISION,
    "avgOpportunityScore" DOUBLE PRECISION,
    "avgCandidateScore" DOUBLE PRECISION,
    "scoreDistribution" JSONB,
    "topCandidates" JSONB,
    "watchlist" JSONB,
    "rejected" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScannerRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScannerSymbolResult" (
    "id" TEXT NOT NULL,
    "scannerRunId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "eliteScore" DOUBLE PRECISION,
    "eliteRating" TEXT,
    "opportunityLevel" TEXT,
    "opportunityScore" DOUBLE PRECISION,
    "candidateScore" DOUBLE PRECISION,
    "compositeScore" DOUBLE PRECISION,
    "rank" INTEGER,
    "reasons" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScannerSymbolResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacktestPipelineRun" (
    "id" TEXT NOT NULL,
    "symbolsProcessed" INTEGER NOT NULL DEFAULT 0,
    "symbolsSucceeded" INTEGER NOT NULL DEFAULT 0,
    "symbolsFailed" INTEGER NOT NULL DEFAULT 0,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION,
    "avgReturn" DOUBLE PRECISION,
    "maxDrawdown" DOUBLE PRECISION,
    "profitFactor" DOUBLE PRECISION,
    "benchmarkAlpha" DOUBLE PRECISION,
    "benchmarkBeta" DOUBLE PRECISION,
    "perSymbolResults" JSONB,
    "benchmarkReturns" JSONB,
    "metadata" JSONB,
    "completionStatus" TEXT NOT NULL DEFAULT 'completed',
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BacktestPipelineRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderHealthRecord" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "successfulRequests" INTEGER NOT NULL DEFAULT 0,
    "failedRequests" INTEGER NOT NULL DEFAULT 0,
    "timeoutCount" INTEGER NOT NULL DEFAULT 0,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "avgLatencyMs" DOUBLE PRECISION,
    "p50LatencyMs" DOUBLE PRECISION,
    "p95LatencyMs" DOUBLE PRECISION,
    "p99LatencyMs" DOUBLE PRECISION,
    "reliabilityScore" DOUBLE PRECISION,
    "successRate" DOUBLE PRECISION,
    "errorRate" DOUBLE PRECISION,
    "uptime" DOUBLE PRECISION,
    "lastFailureTime" TIMESTAMP(3),
    "lastSuccessTime" TIMESTAMP(3),
    "lastRequestTime" TIMESTAMP(3),
    "recoveryTimeMs" DOUBLE PRECISION,
    "snapshotTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderHealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulerJobRun" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "symbolsProcessed" INTEGER NOT NULL DEFAULT 0,
    "symbolsSucceeded" INTEGER NOT NULL DEFAULT 0,
    "symbolsFailed" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "error" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchedulerJobRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisResult_symbol_timeframe_idx" ON "AnalysisResult"("symbol", "timeframe");

-- CreateIndex
CREATE INDEX "AnalysisResult_createdAt_idx" ON "AnalysisResult"("createdAt");

-- CreateIndex
CREATE INDEX "AnalysisResult_eliteScore_idx" ON "AnalysisResult"("eliteScore");

-- CreateIndex
CREATE INDEX "AnalysisResult_eliteRating_idx" ON "AnalysisResult"("eliteRating");

-- CreateIndex
CREATE INDEX "AnalysisResult_opportunityLevel_idx" ON "AnalysisResult"("opportunityLevel");

-- CreateIndex
CREATE INDEX "AnalysisResult_candidatePriority_idx" ON "AnalysisResult"("candidatePriority");

-- CreateIndex
CREATE UNIQUE INDEX "AnalysisResult_symbol_timeframe_createdAt_key" ON "AnalysisResult"("symbol", "timeframe", "createdAt");

-- CreateIndex
CREATE INDEX "ScannerRun_createdAt_idx" ON "ScannerRun"("createdAt");

-- CreateIndex
CREATE INDEX "ScannerRun_scanType_idx" ON "ScannerRun"("scanType");

-- CreateIndex
CREATE INDEX "ScannerSymbolResult_symbol_createdAt_idx" ON "ScannerSymbolResult"("symbol", "createdAt");

-- CreateIndex
CREATE INDEX "ScannerSymbolResult_status_idx" ON "ScannerSymbolResult"("status");

-- CreateIndex
CREATE INDEX "ScannerSymbolResult_eliteScore_idx" ON "ScannerSymbolResult"("eliteScore");

-- CreateIndex
CREATE INDEX "ScannerSymbolResult_scannerRunId_idx" ON "ScannerSymbolResult"("scannerRunId");

-- CreateIndex
CREATE INDEX "BacktestPipelineRun_startedAt_idx" ON "BacktestPipelineRun"("startedAt");

-- CreateIndex
CREATE INDEX "BacktestPipelineRun_completionStatus_idx" ON "BacktestPipelineRun"("completionStatus");

-- CreateIndex
CREATE INDEX "BacktestPipelineRun_completedAt_idx" ON "BacktestPipelineRun"("completedAt");

-- CreateIndex
CREATE INDEX "ProviderHealthRecord_provider_snapshotTime_idx" ON "ProviderHealthRecord"("provider", "snapshotTime");

-- CreateIndex
CREATE INDEX "ProviderHealthRecord_provider_status_idx" ON "ProviderHealthRecord"("provider", "status");

-- CreateIndex
CREATE INDEX "ProviderHealthRecord_snapshotTime_idx" ON "ProviderHealthRecord"("snapshotTime");

-- CreateIndex
CREATE INDEX "ProviderHealthRecord_reliabilityScore_idx" ON "ProviderHealthRecord"("reliabilityScore");

-- CreateIndex
CREATE INDEX "SchedulerJobRun_jobName_startedAt_idx" ON "SchedulerJobRun"("jobName", "startedAt");

-- CreateIndex
CREATE INDEX "SchedulerJobRun_status_idx" ON "SchedulerJobRun"("status");

-- CreateIndex
CREATE INDEX "SchedulerJobRun_startedAt_idx" ON "SchedulerJobRun"("startedAt");

-- CreateIndex
CREATE INDEX "SchedulerJobRun_completedAt_idx" ON "SchedulerJobRun"("completedAt");

-- AddForeignKey
ALTER TABLE "ScannerSymbolResult" ADD CONSTRAINT "ScannerSymbolResult_scannerRunId_fkey" FOREIGN KEY ("scannerRunId") REFERENCES "ScannerRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "BacktestResult_stockId_strategyName_timeframe_startDate_endDate" RENAME TO "BacktestResult_stockId_strategyName_timeframe_startDate_end_key";
