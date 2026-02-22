-- Create MaintenanceSchedule table to fix orphaned migration reference
CREATE TABLE IF NOT EXISTS "MaintenanceSchedule" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MaintenanceSchedule_pkey" PRIMARY KEY ("id")
);
