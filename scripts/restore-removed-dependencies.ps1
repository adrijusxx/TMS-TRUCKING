# Restore Removed Dependencies Script (PowerShell)
# This script restores all dependencies that were removed during cleanup
# Use this if you need to rollback the dependency removals

Write-Host "🔄 Restoring removed dependencies..." -ForegroundColor Cyan

# Production Dependencies
Write-Host "📦 Installing production dependencies..." -ForegroundColor Yellow
npm install @radix-ui/react-toast@^1.2.15
npm install @tanstack/react-virtual@^3.13.12
npm install @types/bcryptjs@^2.4.6
npm install @types/leaflet@^1.9.21
npm install leaflet@^1.9.4
npm install next-themes@^0.4.6
npm install react-leaflet@^5.0.0
npm install zustand@^5.0.8

# Dev Dependencies
Write-Host "🔧 Installing dev dependencies..." -ForegroundColor Yellow
npm install --save-dev @types/xlsx@^0.0.35
npm install --save-dev jest@^30.2.0
npm install --save-dev ts-jest@^29.4.5

Write-Host "✅ Dependencies restored!" -ForegroundColor Green
Write-Host "📝 Note: You may need to update imports in your code if you use these packages." -ForegroundColor Yellow



























