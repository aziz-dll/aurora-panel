import http from 'node:http';
import os from 'node:os';
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 8788;
const HOST = process.env.HOST || '0.0.0.0';

function lanAddresses() {
  const urls = [];
  for (const infos of Object.values(os.networkInterfaces())) {
    for (const info of infos ?? []) {
      if (info.family === 'IPv4' && !info.internal) urls.push(`http://${info.address}:${PORT}`);
    }
  }
  return urls;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

function run(bin, args) {
  return new Promise((resolve) => {
    execFile(bin, args, { timeout: 8000 }, (err, stdout) => {
      resolve(err ? null : stdout);
    });
  });
}

let hasTermux = null;
async function probeTermux() {
  if (hasTermux === null) {
    const out = await run('which', ['termux-battery-status']);
    hasTermux = out !== null;
    if (!hasTermux) console.log('[termux] termux-api bulunamadı — API uçları kapalı.');
    else console.log('[termux] termux-api algılandı ✓');
  }
  return hasTermux;
}

function send(res, code, data, type = 'application/json; charset=utf-8') {
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

async function handleApi(req, res, pathname) {
  const termuxReady = await probeTermux();

  if (pathname === '/api/ping') {
    return send(res, 200, { ok: true, termux: termuxReady });
  }

  const jsonReply = (ok) => send(res, ok ? 200 : 503, { ok });

  if (!termuxReady) return jsonReply(false);

  switch (pathname) {
    case '/api/battery': {
      const out = await run('termux-battery-status', []);
      try {
        const b = JSON.parse(out);
        return send(res, 200, {
          percent: typeof b.percentage === 'number' ? b.percentage : null,
          charging: b.status === 'CHARGING' || b.plugged === 'PLUGGED_AC' || b.plugged === 'PLUGGED_USB',
          status: String(b.status ?? ''),
        });
      } catch {
        return jsonReply(false);
      }
    }
    case '/api/notify': {
      const { title = 'Aurora', content = '' } = await readBody(req);
      return jsonReply((await run('termux-notification', ['--title', String(title), '--content', String(content)])) !== null);
    }
    case '/api/toast': {
      const { message = '' } = await readBody(req);
      return jsonReply((await run('termux-toast', ['-g', 'top', String(message)])) !== null);
    }
    case '/api/vibrate': {
      const { ms = 500 } = await readBody(req);
      return jsonReply((await run('termux-vibrate', ['-d', String(Math.min(5000, Number(ms) || 500))])) !== null);
    }
    case '/api/clipboard': {
      const { text = '' } = await readBody(req);
      return jsonReply((await run('termux-clipboard-set', [String(text).slice(0, 10000)])) !== null);
    }
    default:
      return send(res, 404, { ok: false, error: 'unknown endpoint' });
  }
}

function serveStatic(res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(DIST, rel));
  if (!file.startsWith(DIST)) return send(res, 403, 'forbidden', 'text/plain');

  fs.readFile(file, (err, buf) => {
    if (err) {
      // SPA fallback
      fs.readFile(path.join(DIST, 'index.html'), (err2, index) => {
        if (err2) return send(res, 404, 'dist/ yok — önce `npm run build` çalıştır.', 'text/plain; charset=utf-8');
        res.writeHead(200, { 'Content-Type': MIME['.html'] });
        res.end(index);
      });
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    res.end(buf);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  try {
    if (pathname.startsWith('/api/') && (req.method === 'GET' || req.method === 'POST')) {
      return await handleApi(req, res, pathname);
    }
    if (req.method === 'GET') return serveStatic(res, pathname);
    return send(res, 405, { ok: false, error: 'method not allowed' });
  } catch (e) {
    return send(res, 500, { ok: false, error: String(e) });
  }
});

server.listen(PORT, HOST, async () => {
  console.log(`\n  🎒 Aurora`);
  console.log(`  ─ Ağdaki cihazlar: ${lanAddresses().map((u) => `\n${' '.repeat(4)}${u}`).join('') || '\n    (ağ bulunamadı — WiFi bağlı mı?)'}`);
  console.log(`  ─ Bu cihaz:        http://localhost:${PORT}\n`);
  await probeTermux();
});
