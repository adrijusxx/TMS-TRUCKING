# 📁 Folder Exclusion List

## Folders to Remove from GitHub (Keep Locally)

### ✅ Already in `.gitignore`

These folders are **already excluded** and will be ignored:

1. **`/docs/`** - Entire documentation folder
   - Contains: Internal docs, archive, audit reports, implementation guides
   - Why: Contains deployment info, IP addresses, internal processes
   - Subfolders included:
     - `docs/archive/` - Old deployment docs with IPs
     - `docs/audit-reports/` - Security audit reports
     - `docs/cleanup/` - Cleanup scripts
     - `docs/guides/` - Internal guides
     - `docs/implementation/` - Implementation details
     - `docs/migrations/` - Migration docs
     - `docs/reports/` - Internal reports
     - `docs/setup/` - Setup guides with server info
     - `docs/specs/` - Internal specifications
     - `docs/test-data/` - Test data files

2. **`/pitch-materials/`** - Screenshots and presentation materials
   - Contains: Application screenshots, demo materials
   - Why: Not needed for codebase, keeps repo size down

3. **`scripts/aws/`** - AWS deployment scripts
   - Contains: IAM role creation, secrets management scripts
   - Why: May contain AWS account info, deployment configs

4. **`scripts/audit/`** - Audit and testing scripts
   - Contains: Audit scripts, test data generators
   - Why: Development/debugging only, not needed in production repo

5. **`scripts/security/`** - Security-related scripts
   - Contains: Credential removal scripts, security audits
   - Why: May contain sensitive operations

6. **`tests/integration/`** - Integration tests
   - Contains: Integration test files that may have test data
   - Why: May contain sensitive test data, keep unit tests only

7. **`logs/`** - Log files directory
   - Contains: Application logs
   - Why: Generated files, not source code

---

## Folders to KEEP in GitHub

These folders contain **application code** and should **stay in the repository**:

### ✅ Application Code (KEEP)
- `/app/` - Next.js application routes
- `/components/` - React components
- `/lib/` - Library code (including `lib/secrets/` - it's code, not actual secrets)
- `/hooks/` - React hooks
- `/types/` - TypeScript type definitions
- `/public/` - Public assets
- `/prisma/` - Database schema and migrations
- `/middleware.ts` - Next.js middleware

### ✅ Essential Scripts (KEEP)
- `/scripts/cron/` - Cron job definitions (production code)
- Database migration scripts (if generic, no hardcoded values)

### ✅ Configuration (KEEP)
- `/prisma/migrations/` - Database migrations (essential for deployment)
- Configuration files: `next.config.js`, `tailwind.config.ts`, `tsconfig.json`

### ✅ Tests (KEEP)
- `/tests/unit/` - Unit tests (keep these)
- `/tests/setup.tsx` - Test setup file

---

## 📊 Summary

| Category | Folders to Remove | Folders to Keep |
|----------|------------------|-----------------|
| **Documentation** | `/docs/`, `/pitch-materials/` | None |
| **Scripts** | `/scripts/aws/`, `/scripts/audit/`, `/scripts/security/` | `/scripts/cron/` |
| **Tests** | `/tests/integration/` | `/tests/unit/`, `/tests/setup.tsx` |
| **Logs** | `/logs/` | None |
| **Application** | None | `/app/`, `/components/`, `/lib/`, `/hooks/`, `/types/` |
| **Config** | None | `/prisma/`, config files |

---

## 🔍 How to Verify

After updating `.gitignore`, check what will be excluded:

```bash
# See what Git will ignore
git status --ignored

# Or check specific folder
git check-ignore -v docs/
git check-ignore -v scripts/aws/
```

---

## 🚀 Quick Removal Commands

To remove folders from Git tracking (but keep locally):

```bash
# Remove documentation folders
git rm --cached -r docs/
git rm --cached -r pitch-materials/

# Remove script folders
git rm --cached -r scripts/aws/
git rm --cached -r scripts/audit/
git rm --cached -r scripts/security/

# Remove test folders
git rm --cached -r tests/integration/

# Commit
git commit -m "chore: remove development and documentation folders from repository"
```

---

## ⚠️ Important Notes

1. **`lib/secrets/`** - This folder contains **code** to access AWS Secrets Manager, not actual secrets. **KEEP THIS** in the repo.

2. **`scripts/cron/`** - These are production cron job definitions. **KEEP THESE** in the repo.

3. **`/docs/`** - The entire folder is excluded, so all subfolders are automatically excluded too.

4. **After removal** - Files will still exist locally, they just won't be tracked by Git anymore.

---

**Last Updated:** 2025-01-XX

