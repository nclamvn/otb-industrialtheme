#!/bin/bash
# Post-build script: Copy static assets to standalone folder

echo "=== Copying static assets to standalone folder ==="

# Copy public folder
if [ -d "public" ]; then
    cp -r public .next/standalone/
    echo "✓ Copied public/"
fi

# Copy static folder
if [ -d ".next/static" ]; then
    mkdir -p .next/standalone/.next
    cp -r .next/static .next/standalone/.next/
    echo "✓ Copied .next/static/"
fi

echo "=== Done ==="
