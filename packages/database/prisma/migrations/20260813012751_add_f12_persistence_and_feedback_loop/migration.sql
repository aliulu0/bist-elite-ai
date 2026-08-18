-- CreateTable
CREATE TABLE "opportunity_snapshots" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "config_version" TEXT NOT NULL,
    "original_score" DOUBLE PRECISION NOT NULL,
    "original_signal_strengths" JSONB NOT NULL,
    "original_decision" JSONB NOT NULL,
    "original_prediction" JSONB NOT NULL,
    "original_risk" TEXT NOT NULL,
    "original_data_quality" JSONB NOT NULL,
    "original_timestamp" TIMESTAMP(3) NOT NULL,
    "data_freshness" TEXT NOT NULL,
    "provider_calls" INTEGER NOT NULL DEFAULT 0,
    "cache_hits" INTEGER NOT NULL DEFAULT 0,
    "cheap_scans" INTEGER NOT NULL DEFAULT 0,
    "deep_analyses" INTEGER NOT NULL DEFAULT 0,
    "snapshot_data" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_outcomes" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "user_action" TEXT NOT NULL,  -- 'CONFIRM' | 'REJECT' | 'IGNORE'
    "realized_outcome" TEXT,      -- 'SUCCESS' | 'FAILURE' | 'PENDING' | 'NULL'
    "outcome_timestamp" TIMESTAMP(3),
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learned_weight_configs" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,        -- e.g. 'v1.0.0', 'v1.0.1'
    "weight_config" JSONB NOT NULL,  -- {momentum: number, score: number, freshness: number, convergence: number}
    "evidence_count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAppliedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "parentVersion" TEXT,
    "mutationType" TEXT,          -- 'SLIGHT_INCREASE' | 'SLIGHT_DECREASE' | 'FLIP'
    "rationale" TEXT,             -- Explainable reason for the change
    "createdBy" String?,
    "updatedBy" String?,

    CONSTRAINT "learned_weight_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_events" (
    "id" TEXT NOT NULL,
    "snapshot_id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,        -- 'CONFIRM' | 'REJECT' | 'IGNORE'
    "timestamp" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "affected_learned_config" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunity_snapshots_ticker_idx" ON "opportunity_snapshots"("ticker");

-- CreateIndex
CREATE INDEX "opportunity_snapshots_config_version_idx" ON "opportunity_snapshots"("config_version");

-- CreateIndex
CREATE INDEX "opportunity_snapshots_is_active_idx" ON "opportunity_snapshots"("is_active");

-- CreateIndex
CREATE INDEX "opportunity_snapshots_createdAt_idx" ON "opportunity_snapshots"("createdAt");

-- CreateIndex
CREATE INDEX "opportunity_outcomes_snapshot_id_idx" ON "opportunity_outcomes"("snapshot_id");

-- CreateIndex
CREATE INDEX "opportunity_outcomes_user_action_idx" ON "opportunity_outcomes"("user_action");

-- CreateIndex
CREATE INDEX "learned_weight_configs_version_idx" ON "learned_weight_configs"("version");

-- CreateIndex
CREATE INDEX "learned_weight_configs_isActive_idx" ON "learned_weight_configs"("isActive");

-- CreateIndex
CREATE INDEX "learned_weight_configs_parentVersion_idx" ON "learned_weight_configs"("parentVersion");

-- CreateIndex
CREATE INDEX "feedback_events_snapshot_id_idx" ON "feedback_events"("snapshot_id");

-- CreateIndex
CREATE INDEX "feedback_events_action_idx" ON "feedback_events"("action");

-- CreateIndex
CREATE INDEX "feedback_events_timestamp_idx" ON "feedback_events"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_outcomes_snapshot_id_key" ON "opportunity_outcomes"("snapshot_id");

-- AddForeignKey
ALTER TABLE "opportunity_outcomes" ADD CONSTRAINT "opportunity_outcomes_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "opportunity_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_events" ADD CONSTRAINT "feedback_events_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "opportunity_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;