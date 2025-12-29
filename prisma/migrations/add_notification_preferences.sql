-- Add NotificationPreferences model
-- This migration adds notification preferences for users

CREATE TABLE IF NOT EXISTS "NotificationPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL UNIQUE,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "loadAssigned" BOOLEAN NOT NULL DEFAULT true,
    "loadUpdated" BOOLEAN NOT NULL DEFAULT true,
    "maintenanceDue" BOOLEAN NOT NULL DEFAULT true,
    "hosViolation" BOOLEAN NOT NULL DEFAULT true,
    "documentExpiring" BOOLEAN NOT NULL DEFAULT true,
    "invoicePaid" BOOLEAN NOT NULL DEFAULT true,
    "systemAlert" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "NotificationPreferences_userId_idx" ON "NotificationPreferences"("userId");

