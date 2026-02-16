-- CreateTable
CREATE TABLE IF NOT EXISTS "UserColumnPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "columnPreferences" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserColumnPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserColumnPreference_userId_entityType_key" ON "UserColumnPreference"("userId", "entityType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserColumnPreference_userId_idx" ON "UserColumnPreference"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserColumnPreference_entityType_idx" ON "UserColumnPreference"("entityType");

-- AddForeignKey
ALTER TABLE "UserColumnPreference" ADD CONSTRAINT "UserColumnPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

