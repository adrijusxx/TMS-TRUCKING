# TMS — VM Commands Cheat Sheet

---

## SSH Access

```bash
ssh -i "SSH.pem" ec2-user@100.52.143.212
```

---

## PM2 (Process Manager)

```bash
pm2 start ecosystem.config.js      # Start app
pm2 restart tms                     # Restart app
pm2 restart all                     # Restart all processes
pm2 delete tms                      # Remove app from PM2
pm2 save                            # Save current process list
pm2 logs tms                        # Live logs (follow mode)
pm2 logs --lines 100                # Last 100 lines
```

---

## Logs & Debugging

```bash
tail -100 ~/logs/tms-out.log
grep -E 'Google SA|GoogleAuth' ~/logs/tms-out.log
```

Debug session URL: `http://localhost:3000/debug/session`

---

## Standard Deploy (Pull & Restart)

```bash
git checkout -- package-lock.json   # Reset lock file
git pull                            # Pull latest
npm install                         # Install deps
npx prisma generate                 # Generate Prisma client
npx prisma migrate deploy           # Apply pending migrations
npm run build                       # Build
pm2 restart tms                     # Restart
```

---

## TypeScript Error Checking

```bash
npx tsc --noEmit                                        # Full check
npx tsc --noEmit 2>&1 | Select-Object -First 50        # First 50 errors (PowerShell)

$env:NODE_OPTIONS="--max-old-space-size=8192"; npx tsc --noEmit
```

---

## Prisma / Database

| Task | Command |
|------|---------|
| Studio (GUI) | `npm run db:studio` |
| Generate client | `npx prisma generate` |
| Push schema (AWS) | `node scripts/db-push-aws.js` |
| Run migrations | `npx prisma migrate deploy` |
| Run migration w/ secrets | `node scripts/run-migration-with-secrets.js` |
| Full reset (AWS) | `npm run db:reset:aws` — drops schema + migrations + seed |
| Data wipe only (AWS) | `npm run db:wipe:aws` |
| Reset (local) | `npx prisma migrate reset --force` |
| Force push (local) | `npx prisma db push --force-reset` |
| Push (local) | `npx prisma db push` |

**Manual DB URL (if needed):**

```bash
export DATABASE_URL="postgresql://tms_admin:tUQo19WCTuv%7CUmO*X1%7C85z1lv71@tms-database.c6pekwuuuh43.us-east-1.rds.amazonaws.com:5432/postgres"
npx prisma@6.19.0 db push
```

---
## Versioning & Releases

**Bump version:**

You push code to main
GitHub Actions auto-bumps the patch version (0.2.0 → 0.2.1 → 0.2.2 etc.)
Builds and deploys with that new version
Pushes the version bump commit back to the repo with [skip ci] so it doesn't trigger another deploy

```bash
npm version patch    # 0.2.0 → 0.2.1     # 0.2.0 → 0.2.1 (bug fixes)
npm version minor    # 0.2.0 → 0.3.0 (new features)

```

# 1. Sync database schema (adds missing columns + tables)
cd /home/ec2-user/tms/current && node scripts/db-push-aws.js

# 2. Baseline migrations (so future deploys work)
cd /home/ec2-user/tms/current && node scripts/baseline-migrations.js

# 3. Restart the app
pm2 restart tms

## Rollback

```bash
bash /home/ec2-user/tms/scripts/rollback.sh

# Or remotely:
ssh ec2-user@<host> 'cd /home/ec2-user/tms/current && bash /home/ec2-user/tms/scripts/rollback.sh'
```

---

## Admin Scripts

```bash
node scripts/assign-super-admin.js adrian@fwl2.com      # Create super admin
node scripts/db-push-aws.js                              # Push schema to AWS
node scripts/db-reset-aws.js                             # Reset AWS DB
Run prisma migrate deploy on production RDS — which will apply this migration and add all missing columns/tables
npx prisma@6.19.0 generate
npx prisma@6.19.0 deploy
node scripts/run-migration-with-secrets.js
```
Future workflow (to never hit this again)
When you change prisma/schema.prisma:


# 1. Create a migration (locally)
npm run db:migrate
# Name it something descriptive like: add_driver_notes

# 2. Commit the migration file + schema change
git add prisma/
git commit -m "feat: add driver notes table"

# 3. Push — deploy automatically runs prisma migrate deploy
git push
Never use prisma db push for real schema changes — it skips creating migration files, which is what caused all these issues.

---

**Fix VS Code nested .git folders (PowerShell):**

```bash
Get-ChildItem -Path . -Filter .git -Recurse -Hidden | Remove-Item -Recurse -Force

```

** Local Errors Check **
npm run validate              # Full check (env + TypeScript + Prisma + errors + routes)
npm run validate -- --skip-ts # Skip TypeScript for speed (~0.5s instead of ~100s)
npm run validate -- --skip-env # Skip env var check

$env:NODE_OPTIONS="--max-old-space-size=8192"; npx tsc --noEmit

