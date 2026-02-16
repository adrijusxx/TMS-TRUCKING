-- Find invoices with invalid loadId values (loadId exists but Load doesn't exist)
SELECT i.id, i."invoiceNumber", i."loadId"
FROM "Invoice" i
LEFT JOIN "Load" l ON i."loadId" = l.id
WHERE i."loadId" IS NOT NULL
  AND l.id IS NULL;

-- Fix: Set invalid loadIds to NULL
UPDATE "Invoice"
SET "loadId" = NULL
WHERE "loadId" IS NOT NULL
  AND "loadId" NOT IN (SELECT id FROM "Load" WHERE "deletedAt" IS NULL);

-- Verify fix
SELECT COUNT(*) as invalid_count
FROM "Invoice" i
LEFT JOIN "Load" l ON i."loadId" = l.id
WHERE i."loadId" IS NOT NULL
  AND l.id IS NULL;
-- Should return 0












