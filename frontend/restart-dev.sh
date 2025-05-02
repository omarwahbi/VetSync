#!/bin/bash

echo "Stopping any running Next.js dev servers..."
pkill -f "node.*next dev" || true

echo "Clearing Next.js cache..."
rm -rf .next/cache

echo "Starting Next.js dev server..."
npm run dev 