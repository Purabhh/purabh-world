// Zero-dependency static file server. Serves the project so ES modules + the
// importmap resolve over http. Used for local dev and as a simple deploy option.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = process.env.PORT || process.argv[2] || 5173;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
};

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent((req.url || '/').split('?')[0]);
    if (p === '/' || p.endsWith('/')) p += 'index.html';
    const fp = normalize(join(root, p));
    if (!fp.startsWith(root)) { res.writeHead(403); return res.end('forbidden'); }
    let data;
    try {
      data = await readFile(fp);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' });
      return res.end('404 not found');
    }
    res.writeHead(200, {
      'content-type': TYPES[extname(fp).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500); res.end(String(err));
  }
});

server.listen(port, () => console.log(`Purabh's World  ->  http://localhost:${port}`));
