#!/bin/bash

# Restore Removed Dependencies Script
# This script restores all dependencies that were removed during cleanup
# Use this if you need to rollback the dependency removals

echo "🔄 Restoring removed dependencies..."

# Production Dependencies
echo "📦 Installing production dependencies..."
npm install @radix-ui/react-toast@^1.2.15
npm install @tanstack/react-virtual@^3.13.12
npm install @types/bcryptjs@^2.4.6
npm install @types/leaflet@^1.9.21
npm install leaflet@^1.9.4
npm install next-themes@^0.4.6
npm install react-leaflet@^5.0.0
npm install zustand@^5.0.8

# Dev Dependencies
echo "🔧 Installing dev dependencies..."
npm install --save-dev @types/xlsx@^0.0.35
npm install --save-dev jest@^30.2.0
npm install --save-dev ts-jest@^29.4.5

echo "✅ Dependencies restored!"
echo "📝 Note: You may need to update imports in your code if you use these packages."







