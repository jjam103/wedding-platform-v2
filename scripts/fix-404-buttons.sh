#!/bin/bash

# Fix 404 Button Issues - Cache Clearing Script
# This script clears Next.js build cache to resolve cached JavaScript issues

echo "🔧 Fixing 404 Button Issues"
echo "================================"
echo ""

# Check if dev server is running
if pgrep -f "next dev" > /dev/null; then
    echo "⚠️  Dev server is currently running"
    echo "   Please stop it first (Ctrl+C in the terminal running 'npm run dev')"
    echo ""
    read -p "Press Enter after stopping the dev server..."
fi

# Clear Next.js build cache
echo "🗑️  Clearing Next.js build cache..."
if [ -d ".next" ]; then
    rm -rf .next
    echo "✅ Cleared .next directory"
else
    echo "ℹ️  .next directory doesn't exist (already clean)"
fi

# Clear node_modules/.cache if it exists
echo ""
echo "🗑️  Clearing node_modules cache..."
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    echo "✅ Cleared node_modules/.cache"
else
    echo "ℹ️  node_modules/.cache doesn't exist"
fi

echo ""
echo "================================"
echo "✅ Cache cleared successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start the dev server: npm run dev"
echo "2. Hard refresh your browser:"
echo "   • Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)"
echo "   • Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)"
echo "   • Safari: Cmd+Option+R (Mac)"
echo "3. Test the buttons (Create Event, Add Guest, Add Activity)"
echo ""
echo "If the issue persists, try opening in incognito/private mode"
echo "to rule out browser-specific caching issues."
echo ""
