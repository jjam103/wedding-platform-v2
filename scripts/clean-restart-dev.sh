#!/bin/bash

# Clean Restart Development Server
# Clears all Next.js caches and restarts dev server fresh

echo "🧹 Cleaning Next.js caches..."

# Stop any running dev servers
echo "Stopping any running dev servers..."
pkill -f "next dev" || true
sleep 2

# Remove all cache directories
echo "Removing cache directories..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .swc

echo "✅ Cache cleared!"
echo ""
echo "🚀 Starting fresh dev server..."
echo "Run: npm run dev"
echo ""
echo "Then in a separate terminal:"
echo "npm run test:e2e -- __tests__/e2e/auth/guestAuth.spec.ts"
