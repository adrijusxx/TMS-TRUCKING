-- Rename tags columns to legacyTags to avoid conflicts with new tag relations
ALTER TABLE "Truck" RENAME COLUMN "tags" TO "legacyTags";
ALTER TABLE "Trailer" RENAME COLUMN "tags" TO "legacyTags";
ALTER TABLE "Customer" RENAME COLUMN "tags" TO "legacyTags";


