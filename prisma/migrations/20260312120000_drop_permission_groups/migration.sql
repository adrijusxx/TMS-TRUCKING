-- Drop permission group tables (merged into roles)

-- Drop join table first (depends on both PermissionGroup and Role)
DROP TABLE IF EXISTS "RolePermissionGroup";

-- Drop items table (depends on PermissionGroup)
DROP TABLE IF EXISTS "PermissionGroupItem";

-- Drop parent table
DROP TABLE IF EXISTS "PermissionGroup";
