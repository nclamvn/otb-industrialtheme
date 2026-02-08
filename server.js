// ═══════════════════════════════════════════════════════════════════════════
// Custom Server for Azure App Services
// This file is used when deploying to Azure App Services (Linux)
// It starts the Next.js standalone server with the correct port
// ═══════════════════════════════════════════════════════════════════════════

const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');

// Azure App Services uses PORT env variable
const port = parseInt(process.env.PORT || process.env.WEBSITES_PORT || '3000', 10);
const hostname = '0.0.0.0';

// In standalone mode, Next.js outputs a server.js in .next/standalone/
// We need to require it properly
async function startServer() {
  try {
    // Try standalone server first (production)
    const next = require('./.next/standalone/server.js');
    console.log(`✓ Next.js standalone server starting on port ${port}`);
  } catch (err) {
    // Fallback: use next directly (development)
    const next = require('next');
    const app = next({ dev: false, hostname, port });
    const handle = app.getRequestHandler();

    await app.prepare();

    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port, hostname, () => {
      console.log(`✓ Next.js server running on http://${hostname}:${port}`);
    });
  }
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
