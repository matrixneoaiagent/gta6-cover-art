// Playwright screenshot capture script for Vice Graphix Cover Art
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('/tmp/opencode/identity_poc_clone/node_modules/playwright-core');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

const appDir = path.resolve(__dirname, 'app');
const screenshotsDir = path.resolve(__dirname, 'screenshots');

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://127.0.0.1`);
      let pathname = decodeURIComponent(parsedUrl.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const filePath = path.resolve(path.join(appDir, pathname));

      if (!filePath.startsWith(appDir)) {
        res.writeHead(403).end('Forbidden');
        return;
      }

      try {
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) throw new Error('Not a file');
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME[ext] || 'application/octet-stream',
          'Content-Length': stat.size,
          'Cache-Control': 'no-store'
        });
        fs.createReadStream(filePath).pipe(res);
      } catch {
        res.writeHead(404).end('Not Found');
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

async function main() {
  fs.mkdirSync(screenshotsDir, { recursive: true });

  // Remove old starter screenshots if present
  const oldFiles = ['3-cover.jpg'];
  for (const f of oldFiles) {
    const fp = path.join(screenshotsDir, f);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }

  const { server, port } = await startServer();
  console.log(`Static server running on http://127.0.0.1:${port}`);

  const browser = await chromium.launch({
    executablePath: '/home/kozak/.local/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

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

  for (const shot of shots) {
    console.log(`Capturing ${shot.name} (${shot.w}x${shot.h})...`);
    const page = await browser.newPage({
      viewport: { width: shot.w, height: shot.h },
      deviceScaleFactor: 1
    });

    const url = `http://127.0.0.1:${port}/${shot.query}`;
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for canvas ready flag
    await page.waitForFunction(() => window.__shotReady === true, { timeout: 15000 });
    // Brief settle time
    await page.waitForTimeout(400);

    const outPath = path.join(screenshotsDir, shot.name);
    await page.screenshot({
      path: outPath,
      type: 'jpeg',
      quality: 85
    });

    const size = fs.statSync(outPath).size;
    console.log(`Saved ${shot.name}: ${size} bytes (${(size / 1024).toFixed(1)} KiB)`);
    if (size > 262144) {
      throw new Error(`Screenshot ${shot.name} exceeds 256 KiB: ${size} bytes`);
    }

    await page.close();
  }

  await browser.close();
  server.close();
  console.log('All screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Error taking screenshots:', err);
  process.exit(1);
});
