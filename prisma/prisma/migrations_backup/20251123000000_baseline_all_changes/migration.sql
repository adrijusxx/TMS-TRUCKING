-- Baseline Migration
-- This migration represents the current state of the database
-- All tables, enums, and changes listed in the drift detection are already applied
-- This migration file exists to sync Prisma's migration history with the actual database state

-- Note: The following changes were already applied via `prisma db push`:
-- - All new enums (AccountingSyncStatus, ApprovalStatus, etc.)
-- - All new tables (Communication, DeductionRule, DriverAdvance, IFTAConfig, IFTAEntry, IFTAStateMileage, LoadExpense, LoadSegment, SettlementApproval, CompanySettings, CustomField)
-- - All enum modifications (DeductionType, UserRole including HR, SAFETY, FLEET)
-- - All table modifications (Breakdown, Communication, Customer, Driver, FuelEntry, Load, Payment, Settlement, SettlementApproval, SettlementDeduction, User, ApiCache)

-- This is an empty migration because the database is already in the correct state
-- It serves to align Prisma's migration tracking with reality

SELECT 1;

