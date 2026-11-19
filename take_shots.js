// Automated Screenshot Capture for GTA 6 Cover Art Studio
import { createReadStream, statSync, existsSync, unlinkSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('/tmp/opencode/identity_poc_clone/node_modules/playwright-core');

const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400).end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(root, normalize(pathname)));
  if (file !== root && !file.startsWith(root + sep)) {
    response.writeHead(403).end('forbidden');
    return;
  }
  let size;
  try {
    const stats = statSync(file);
    if (!stats.isFile()) throw new Error('not a file');
    size = stats.size;
  } catch {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
});

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  console.log(`Ephemeral test server running at http://127.0.0.1:${port}`);

  // Clean up any old 3-cover.jpg if present
  if (existsSync('screenshots/3-cover.jpg')) {
    unlinkSync('screenshots/3-cover.jpg');
    console.log('Removed legacy screenshots/3-cover.jpg');
  }

  const shots = [
    {
      name: '1-cover.jpg',
      query: '?shot=cover&layout=classic&caption=LEONIDA%20DREAMS&photo=boulevard',
      w: 1280,
      h: 720
    },
    {
      name: '2-editor.jpg',
      query: '?shot=editor&layout=classic&caption=VICE%20CITY%20NIGHTS&photo=pier',
      w: 1280,
      h: 800
    },
    {
      name: '3-square-cover.jpg',
      query: '?shot=square&layout=ocean&caption=SUNSET%20HEIST&photo=pier',
      w: 1080,
      h: 1080
    },
    {
      name: '4-portrait-cover.jpg',
      query: '?shot=portrait&layout=neon&caption=OCEAN%20DRIVE&photo=boulevard',
      w: 1024,
      h: 1280
    }
  ];

  const browser = await chromium.launch({
    executablePath: '/home/kozak/.local/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  try {
    for (const shot of shots) {
      console.log(`Capturing ${shot.name} (${shot.w}x${shot.h})...`);
      const context = await browser.newContext({
        viewport: { width: shot.w, height: shot.h },
        deviceScaleFactor: 1
      });
      const page = await context.newPage();

      page.on('console', msg => {
        if (msg.type() === 'error') console.error('Browser error:', msg.text());
      });
      page.on('requestfailed', req => {
        console.error('Request failed:', req.url(), req.failure());
      });
      page.on('response', resp => {
        if (resp.status() >= 400) console.error('HTTP', resp.status(), resp.url());
      });

      await page.goto(`http://127.0.0.1:${port}/${shot.query}`, { waitUntil: 'networkidle' });

      await page.waitForFunction(() => window.__shotReady === true, { timeout: 15000 });
      await page.waitForTimeout(400);

      const destPath = `screenshots/${shot.name}`;
      await page.screenshot({
        path: destPath,
        type: 'jpeg',
        quality: 85
      });

      const stats = statSync(destPath);
      console.log(`Saved ${destPath}: ${stats.size} bytes (${(stats.size / 1024).toFixed(1)} KiB)`);
      if (stats.size > 262144) {
        throw new Error(`Screenshot ${destPath} exceeds 256 KiB limit: ${stats.size} bytes`);
      }

      await context.close();
    }
    console.log('All 4 screenshots captured successfully!');
  } finally {
    await browser.close();
    server.close();
  }
});
