# PowerShell script to restart after schema changes
Write-Host "🔧 Restarting after Prisma schema fix..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Regenerate Prisma Client
Write-Host "Step 1/2: Regenerating Prisma Client..." -ForegroundColor Yellow
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
Write-Host "Step 2/2: Starting dev server..." -ForegroundColor Yellow
npm run dev

