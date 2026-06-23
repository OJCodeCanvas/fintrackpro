#!/bin/bash
# Mobile build script — produces a static export in /out for Capacitor.
# Temporarily moves server-side API routes out (native app uses local data layer instead).

set -e

echo "Building FinTrack for mobile (static export)..."

# Temporarily move API routes OUT of the src/app directory — they can't be
# statically exported, and the native app uses the local (on-device) data layer.
if [ -d "src/app/api" ]; then
  mv src/app/api ./.api_backup
  echo "  Temporarily excluded /api routes"
fi

# Build with static export
BUILD_TARGET=mobile npx next build

# Restore API routes
if [ -d "./.api_backup" ]; then
  mv ./.api_backup src/app/api
  echo "  Restored /api routes"
fi

echo "Mobile build complete -> out/"
