-- Fix: Remove orphaned MaintenanceSchedule references
DELETE FROM "_prisma_migrations" WHERE migration_name LIKE '%MaintenanceSchedule%';
