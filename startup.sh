#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Azure App Services Startup Script
# ═══════════════════════════════════════════════════════════════════════════

echo "🚀 Starting DAFC OTB Next.js App..."
echo "   Node version: $(node --version)"
echo "   NPM version: $(npm --version)"
echo "   PORT: ${PORT:-3000}"

# Copy static files to standalone directory (required for standalone mode)
if [ -d ".next/standalone" ]; then
  echo "📦 Setting up standalone deployment..."

  # Copy public folder
  if [ -d "public" ]; then
    cp -r public .next/standalone/public 2>/dev/null || true
  fi

  # Copy static assets
  if [ -d ".next/static" ]; then
    mkdir -p .next/standalone/.next
    cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
  fi

  echo "✓ Static files copied"

  # Start standalone server
  cd .next/standalone
  PORT=${PORT:-3000} HOSTNAME=0.0.0.0 node server.js
else
  echo "⚠ Standalone build not found, using next start..."
  npx next start -p ${PORT:-3000} -H 0.0.0.0
fi
