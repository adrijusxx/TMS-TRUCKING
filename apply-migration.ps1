# Script to apply Prisma migration and regenerate client
# Stop your dev server first (Ctrl+C), then run this script

Write-Host "Applying Prisma migration..." -ForegroundColor Yellow
npx prisma migrate deploy

Write-Host "`nRegenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "`nDone! You can now restart your dev server." -ForegroundColor Green


