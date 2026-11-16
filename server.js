/**
 * Study Dash — Node.js Local Testing Server.
 * Zero external dependencies.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url.split('?')[0]);
  if (filePath.endsWith(path.sep) || fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: ' + req.url);
      } else {
        res.writeHead(500);
        res.end('Server error: ' + err.code);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Service-Worker-Allowed': '/',
        'Cache-Control': 'no-cache'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  const ip = getLocalIp();
  console.log('='.repeat(60));
  console.log(' 🎮 STUDY DASH — Local Server Started');
  console.log('='.repeat(60));
  console.log(` • Desktop:  http://localhost:${PORT}`);
  console.log(` • Phone:    http://${ip}:${PORT}`);
  console.log('='.repeat(60));
});

