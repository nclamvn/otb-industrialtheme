#!/bin/bash

echo "=== DAFC OTB Frontend Startup ==="
echo "Node version: $(node -v)"
echo "PORT: ${PORT:-3000}"

# Copy static assets if not exists
if [ ! -d ".next/standalone/public" ] && [ -d "public" ]; then
    echo "Copying public folder..."
    cp -r public .next/standalone/
fi

if [ ! -d ".next/standalone/.next/static" ] && [ -d ".next/static" ]; then
    echo "Copying static folder..."
    mkdir -p .next/standalone/.next
    cp -r .next/static .next/standalone/.next/
fi

# Start standalone server
echo "Starting standalone server..."
cd .next/standalone
node server.js
