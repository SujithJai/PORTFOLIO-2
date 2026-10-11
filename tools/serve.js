#!/usr/bin/env node
/**
 * Static dev server for GIREESH portfolio.
 * Equivalent to tools/serve.py with full support for:
 * - Proper MIME types (ES modules, fonts, WebM/MP4 video)
 * - Cache-Control: no-store, must-revalidate
 * - POST /__shot endpoint to save base64 screenshot PNGs to shots/
 * - HTTP 206 Partial Content (range requests) for seamless video seeking
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2] || '5173', 10);
const ROOT = path.resolve(__dirname, '..');
const SHOT_DIR = process.env.SHOT_DIR || path.join(ROOT, 'shots');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // Common headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  // Handle /__shot POST endpoint
  if (req.method === 'POST' && req.url.startsWith('/__shot')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const u = new URL(req.url, `http://${req.headers.host}`);
        let name = u.searchParams.get('name') || 'shot';
        name = name.replace(/[^a-zA-Z0-9_\-\.]/g, '') || 'shot';

        const commaIdx = body.indexOf(',');
        const b64 = commaIdx >= 0 ? body.slice(commaIdx + 1) : body;
        const buf = Buffer.from(b64, 'base64');

        if (!fs.existsSync(SHOT_DIR)) {
          fs.mkdirSync(SHOT_DIR, { recursive: true });
        }
        const outPath = path.join(SHOT_DIR, `${name}.png`);
        fs.writeFileSync(outPath, buf);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end(outPath);
      } catch (err) {
        res.statusCode = 500;
        res.end(err.message);
      }
    });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  let pathname = decodeURIComponent(req.url.split('?')[0]);
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(ROOT, pathname.replace(/^\//, ''));

  // Security: prevent path traversal outside root
  if (!filePath.startsWith(ROOT)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || stats.isDirectory()) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    const totalSize = stats.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.statusCode = 416;
        res.setHeader('Content-Range', `bytes */${totalSize}`);
        res.end();
        return;
      }

      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', end - start + 1);
      res.setHeader('Content-Type', contentType);

      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Length', totalSize);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');

      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`GIREESH cinematic portfolio running at: http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop.`);
});
