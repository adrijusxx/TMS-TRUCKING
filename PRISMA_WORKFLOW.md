# Prisma Workflow Best Practices

## 🛑 The Golden Rule
**IF YOU TOUCH `schema.prisma`, YOU MUST CREATE A MIGRATION.**

Prisma does **NOT** automatically update the production database based on the `schema.prisma` file alone. It requires a SQL migration file in `prisma/migrations`.

## ❌ Common Failure Scenario
1. Agent/Dev adds a field to `schema.prisma`.
2. Agent/Dev runs `prisma generate` (this updates the Client, so code passes).
3. Agent/Dev pushes code to AWS.
4. **CRASH**: Production app tries to read the new field, but the Database still has the old schema because **no migration file was created**.

## ✅ The Correct Workflow
1. **Modify Schema**: Edit `prisma/schema.prisma`.
2. **Generate Migration**: Run `npx prisma migrate dev --name <descriptive_name>`.
   - This creates a new folder in `prisma/migrations` with a SQL file.
   - This applies the change to your *local* database.
   - This regenerates the Prisma Client.
3. **Commit**: Commit BOTH `schema.prisma` AND the new `prisma/migrations/...` folder.
4. **Push/Deploy**: When code reaches AWS, `prisma migrate deploy` will see the new SQL file and run it.

## 🛠️ Manually Creating Migrations (if `migrate dev` fails)
If you cannot run `migrate dev` (connectivity issues), you must:
1. Create a folder: `prisma/migrations/YYYYMMDDHHMMSS_name`.
2. Create `migration.sql` inside it.
3. Write the raw SQL matching your schema change.
4. Verify strict order (YYYYMMDD...).

## 🔍 Validation
Run this command to check if your migrations match your schema:
```bash
npx prisma migrate status
```
