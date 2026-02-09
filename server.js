const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || process.env.WEBSITES_PORT || '3000', 10);

console.log('=== DAFC OTB Frontend Server ===');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Node version: ${process.version}`);
console.log(`Port: ${port}`);
console.log(`Hostname: ${hostname}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
  .once('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  })
  .listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
