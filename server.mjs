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
    case '/api/memory': {
      const out = await run('cat', ['/proc/meminfo']);
      if (!out) return jsonReply(false);
      const grab = (key) => {
        const m = out.match(new RegExp(`^${key}:\\s+(\\d+)\\s*kB`, 'm'));
        return m ? Number(m[1]) : 0;
      };
      const totalKb = grab('MemTotal');
      if (!totalKb) return jsonReply(false);
      const freeKb = grab('MemFree');
      const buffersKb = grab('Buffers');
      const cachedKb = grab('Cached');
      const toMB = (kb) => Math.round((kb / 1024) * 10) / 10;
      return send(res, 200, {
        total: toMB(totalKb),
        free: toMB(freeKb + buffersKb + cachedKb),
        used: toMB(totalKb - freeKb - buffersKb - cachedKb),
      });
    }
    case '/api/disk': {
      const out = await run('sh', ['-c', "df -k 2>/dev/null | tail -n +2"]);
      if (!out) return jsonReply(false);
      const rows = [];
      for (const line of out.split('\n')) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 6) continue;
        const [fs, total, used, free, pct, mount] = parts;
        const t = Number(total), u = Number(used), f = Number(free);
        if (!Number.isFinite(t) || t === 0) continue;
        const toGB = (kb) => Math.round((kb / 1024 / 1024) * 100) / 100;
        rows.push({
          fs,
          mount,
          total: toGB(t),
          used: toGB(u),
          free: toGB(f),
          pct: Number(String(pct).replace('%', '')) || 0,
        });
      }
      return send(res, 200, rows);
    }
    case '/api/storage': {
      // Termux'un gerçekten yaşadığı partition (öncelik sırasıyla): Termux
      // kökü, /data, /storage/emulated. "/" (rootfs) SAHTE — %1 gösterip
      // kullanıcının gerçek doluluğunu gizliyordu.
      const out = await run('sh', ['-c',
        "df -k /data/data/com.termux /data /storage/emulated 2>/dev/null | tail -n +2"]);
      if (!out) return jsonReply(false);
      const parse = (line) => {
        const p = line.trim().split(/\s+/);
        if (p.length < 6) return null;
        const t = Number(p[1]), u = Number(p[2]), f = Number(p[3]);
        if (!Number.isFinite(t) || t === 0) return null;
        const toGB = (kb) => Math.round((kb / 1024 / 1024) * 100) / 100;
        return { total: toGB(t), used: toGB(u), free: toGB(f), pct: Math.round(u / t * 100) };
      };
      let storage = null;
      for (const line of out.split('\n')) {
        const sv = parse(line);
        if (sv) { storage = sv; break; } // df sırası: istenen hedefler sırayla gelir
      }
      if (!storage) return jsonReply(false);
      return send(res, 200, storage);
    }
    case '/api/uptime': {
      const out = await run('cat', ['/proc/uptime']);
      if (!out) return jsonReply(false);
      const sec = Math.floor(Number(out.trim().split(/\s+/)[0]) || 0);
      return send(res, 200, { seconds: sec, bootISO: new Date(Date.now() - sec * 1000).toISOString() });
    }
    case '/api/info': {
      const [model, manuf, android, sdk, host] = await Promise.all([
        run('getprop', ['ro.product.model']),
        run('getprop', ['ro.product.manufacturer']),
        run('getprop', ['ro.build.version.release']),
        run('getprop', ['ro.build.version.sdk']),
        run('hostname', []),
      ]);
      if (!model && !manuf) return jsonReply(false);
      return send(res, 200, {
        model: (model || '').trim() || 'Bilinmiyor',
        manufacturer: (manuf || '').trim() || 'Bilinmiyor',
        android: (android || '').trim() || '?',
        sdk: Number((sdk || '').trim()) || 0,
        hostname: (host || '').trim() || 'localhost',
      });
    }
    case '/api/cpu': {
      const stat1 = await run('cat', ['/proc/stat']);
      if (!stat1) return jsonReply(false);
      await new Promise((r) => setTimeout(r, 1000));
      const stat2 = await run('cat', ['/proc/stat']);
      if (!stat2) return jsonReply(false);
      const parse = (text) => {
        const line = text.split('\n').find((l) => l.startsWith('cpu '));
        if (!line) return null;
        const parts = line.split(/\s+/).slice(1).map(Number);
        const idle = (parts[3] || 0) + (parts[4] || 0);
        const total = parts.reduce((a, b) => a + b, 0);
        return { idle, total };
      };
      const a = parse(stat1), b = parse(stat2);
      if (!a || !b) return jsonReply(false);
      const totalDelta = b.total - a.total;
      const idleDelta = b.idle - a.idle;
      const usage = totalDelta > 0 ? Math.round(((totalDelta - idleDelta) / totalDelta) * 100) : 0;
      const coresOut = await run('sh', ['-c', "grep -c '^processor' /proc/cpuinfo"]);
      return send(res, 200, { usage, cores: Number(coresOut) || 1 });
    }
    case '/api/thermal': {
      const out = await run('sh', ['-c', "for z in /sys/class/thermal/thermal_zone*; do [ -r \"$z/temp\" ] && echo \"$(basename $z)|$(cat $z/temp)\"; done"]);
      if (!out) return jsonReply(false);
      const zones = out
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const [name, raw] = l.split('|');
          const milli = Number(raw);
          return { name: name?.replace('thermal_zone', 'zone') || '?', tempC: Math.round((milli / 1000) * 10) / 10 };
        });
      return send(res, 200, { zones });
    }
    case '/api/wifi': {
      const [ip, ssid] = await Promise.all([
        run('sh', ['-c', "ip -4 addr show wlan0 2>/dev/null | awk '/inet /{print $2}' | cut -d/ -f1 | head -1"]),
        run('sh', ['-c', "cmd wifi status 2>/dev/null | grep -oE 'SSID: .*' | head -1 | sed 's/^SSID: //'"]),
      ]);
      return send(res, 200, { ip: (ip || '').trim() || null, ssid: (ssid || '').trim() || null });
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


// ── Lab kaldırıldı — bildirimler artık sadece APK native. ────────────────
// Eski Lab J7'nin ekranına termux-notification gönderiyordu; bu
// karışıklığa yol açtığı için tamamen devre dışı. 8700 portu hâlâ açık
// (geriye uyumluluk), ama sadece statik bir "burada bir şey yok" sayfası
// döndürüyor.
const LAB_PORT = Number(process.env.LAB_PORT) || 8700;
const labServer = http.createServer(async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0a0a0a" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20rx%3D%228%22%20fill%3D%22%23161616%22%2F%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2212%22%20r%3D%226%22%20fill%3D%22%232383e2%22%2F%3E%3Ccircle%20cx%3D%2222%22%20cy%3D%2220%22%20r%3D%227%22%20fill%3D%22%23a78bfa%22%2F%3E%3C%2Fsvg%3E" />
  <title>Aurora · Lab kaldırıldı</title>
  <style>
    * { box-sizing: border-box; margin: 0; -webkit-tap-highlight-color: transparent; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #f5f5f5; min-height: 100dvh; padding: 32px 20px; text-align: center; }
    h1 { font-size: 22px; letter-spacing: .1em; text-transform: uppercase; }
    p { margin-top: 14px; font-size: 14px; color: #9d9d9d; line-height: 1.6; max-width: 420px; margin-left: auto; margin-right: auto; }
    a { color: #2383e2; }
  </style>
</head>
<body>
  <h1>Lab kaldırıldı</h1>
  <p>Bildirimler artık sadece <b>APK native</b> tarafında geliyor (J7'ye değil). Hatırlatıcıları kontrol etmek için APK'yı aç, sağ alttaki <b>🔔 Test bildirimi</b> butonuna dokun. Lab'ı yanlışlıkla burada aradıysan, sunucu tarafında bildirim gönderimi tamamen kapatıldı.</p>
</body>
</html>`);
});

labServer.listen(LAB_PORT, HOST, () => {
  console.log(`  ─ Notification Lab:   http://<j7-ip>:${LAB_PORT}   (or http://localhost:${LAB_PORT})`);
});

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
