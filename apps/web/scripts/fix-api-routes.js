#!/usr/bin/env node

/**
 * Script to add Node.js runtime directive to all API routes
 * This fixes Edge Runtime compatibility issues with bcrypt/auth
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../app/api');
const RUNTIME_DIRECTIVE = "export const runtime = 'nodejs';\n";

let fixedCount = 0;
let skippedCount = 0;

function addRuntimeDirective(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already has runtime directive
  if (content.includes("export const runtime")) {
    console.log(`⏭️  Skip (already has runtime): ${path.relative(API_DIR, filePath)}`);
    skippedCount++;
    return;
  }

  // Skip health check route (doesn't need auth)
  if (filePath.includes('/health/')) {
    console.log(`⏭️  Skip (health route): ${path.relative(API_DIR, filePath)}`);
    skippedCount++;
    return;
  }

  // Add runtime directive at the top
  const newContent = `${RUNTIME_DIRECTIVE}\n${content}`;

  fs.writeFileSync(filePath, newContent);
  console.log(`✅ Fixed: ${path.relative(API_DIR, filePath)}`);
  fixedCount++;
}

function walkDir(dir) {
  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file === 'route.ts') {
        addRuntimeDirective(filePath);
      }
    }
  } catch (err) {
    console.error(`Error processing ${dir}:`, err.message);
  }
}

console.log('🔧 Fixing API routes for Node.js runtime...\n');
walkDir(API_DIR);
console.log(`\n✨ Done! Fixed: ${fixedCount}, Skipped: ${skippedCount}`);
