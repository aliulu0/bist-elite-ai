-- CreateTable
CREATE TABLE "telegram_notification_deliveries" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "ticker" TEXT,
    "snapshotId" TEXT,
    "messageType" TEXT NOT NULL DEFAULT 'daily_radar',
    "status" TEXT NOT NULL,
    "telegramMessageId" TEXT,
    "chatIdHash" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "errorMessageSanitized" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "telegram_notification_deliveries_fingerprint_idx" ON "telegram_notification_deliveries"("fingerprint");

-- CreateIndex
CREATE INDEX "telegram_notification_deliveries_ticker_idx" ON "telegram_notification_deliveries"("ticker");

-- CreateIndex
CREATE INDEX "telegram_notification_deliveries_status_idx" ON "telegram_notification_deliveries"("status");

-- CreateIndex
CREATE INDEX "telegram_notification_deliveries_snapshotId_idx" ON "telegram_notification_deliveries"("snapshotId");

-- CreateIndex
CREATE INDEX "telegram_notification_deliveries_createdAt_idx" ON "telegram_notification_deliveries"("createdAt");
