#!/bin/bash

# Script to remove deployment and development files from Git tracking
# while keeping them locally for your use

set -e

echo "🧹 Removing deployment and development files from Git tracking..."
echo ""

# Files to remove
FILES=(
  "deploy.sh"
  "deploy-to-vm.ps1"
  "nginx.config.conf"
  "ecosystem.config.js"
  "scripts/setup-nginx.sh"
  "scripts/setup-nginx-aws.sh"
  "scripts/fix-subdomain-deployment.sh"
  "scripts/verify-deployment.sh"
  "scripts/migrate-deploy.sh"
  "scripts/setup-database-urls.sh"
  "scripts/test-db-connection.sh"
  "scripts/test-direct-connection.sh"
  "scripts/get-neon-connection.sh"
  "scripts/deep-diagnose-connection.sh"
  "scripts/diagnose-migration-issue.sh"
  "scripts/check-context-update.sh"
  "scripts/check-context-update.ps1"
  "scripts/check-errors.js"
  "scripts/filter-dev-logs.js"
  "scripts/type-check-filtered.js"
  "scripts/type-check-filtered.ps1"
  "scripts/restart-after-schema-fix.ps1"
  "scripts/restore-removed-dependencies.sh"
  "scripts/restore-removed-dependencies.ps1"
  "scripts/audit-database-mappings.ts"
  "scripts/audit-import-mappings.ts"
  "scripts/diagnose-blocked-driver-imports.ts"
  "scripts/cleanup-api-cache.ts"
  "scripts/cleanup-soft-deleted-drivers.ts"
  "scripts/reset-database.ts"
  "scripts/reset-to-clean-admin.ts"
  "scripts/soft-delete-records.ts"
  "scripts/verify-and-fix-users.ts"
  "scripts/update-drivers-from-import.ts"
  "scripts/migrate-demo-to-fourways.ts"
  "scripts/create-admin-user.ts"
  "scripts/create-fourways-company.ts"
  "scripts/delete-andrew-mohkur.ts"
  "scripts/move-drivers-between-companies.ts"
  "scripts/assign-drivers-to-mc.ts"
  "scripts/list-users.ts"
  "scripts/extract-schema-reference.ts"
  "scripts/apply-schema-fixes.ts"
  "PROJECT_RULES.md"
  "PROJECT-CONTEXT.md"
  "QUICK-REFERENCE.md"
)

# Directories to remove (entire folders)
DIRS=(
  "scripts/aws"           # AWS deployment scripts
  "scripts/audit"          # Audit and testing scripts
  "scripts/security"      # Security-related scripts
  "docs"                   # Entire documentation folder (includes archive/, audit-reports/, etc.)
  "pitch-materials"        # Screenshots and demo materials
  "tests/integration"      # Integration tests (keep unit tests)
  "logs"                   # Log files directory
)

# Remove files
echo "📄 Removing files..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    git rm --cached "$file" 2>/dev/null && echo "  ✓ Removed: $file" || echo "  ⚠ Not tracked: $file"
  else
    echo "  ⊘ Not found: $file"
  fi
done

# Remove directories
echo ""
echo "📁 Removing directories..."
for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ]; then
    git rm --cached -r "$dir" 2>/dev/null && echo "  ✓ Removed: $dir/" || echo "  ⚠ Not tracked: $dir/"
  else
    echo "  ⊘ Not found: $dir/"
  fi
done

echo ""
echo "✅ Files removed from Git tracking (kept locally)"
echo ""
echo "📝 Next steps:"
echo "  1. Review changes: git status"
echo "  2. Commit: git commit -m 'chore: remove deployment and development files from repository'"
echo "  3. Push: git push origin main"
echo ""
echo "⚠️  Note: These files are now in .gitignore and will stay local only."

