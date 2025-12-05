# PowerShell script to restart after schema changes
Write-Host "🔧 Restarting after Prisma schema fix..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Mark migration as applied (if needed)
Write-Host "Step 1/3: Marking migrations as applied..." -ForegroundColor Yellow
npx prisma migrate resolve --applied 20251205000001_add_samsara_tables

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations marked as applied!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migration marking failed (might already be marked)" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Regenerate Prisma Client
Write-Host "Step 2/3: Regenerating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Prisma Client regenerated successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to regenerate Prisma Client" -ForegroundColor Red
    Write-Host "   This is likely because the dev server is still running." -ForegroundColor Red
    Write-Host "   Please stop the dev server (Ctrl+C) and run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 3/3: Starting dev server..." -ForegroundColor Yellow
npm run dev

