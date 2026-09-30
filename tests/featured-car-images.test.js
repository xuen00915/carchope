const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { test, before, after } = require('node:test');
const { chromium } = require('playwright');

const siteRoot = path.resolve(__dirname, '..');
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const expectedImages = {
  'XPENG G6 Electric': 'assets/xpeng-g6-electric.png',
  'Volkswagen Golf SV': 'assets/volkswagen-golf-sv.webp',
  'Toyota Prius Plus Hybrid': 'assets/toyota-prius-plus-hybrid.png',
};

let server;
let browser;
let baseUrl;

function contentType(filePath) {
  return {
    '.css': 'text/css',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.png': 'image/png',
    '.webp': 'image/webp',
  }[path.extname(filePath)] || 'application/octet-stream';
}

before(async () => {
  server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    const filePath = path.resolve(siteRoot, relativePath);

    if (!filePath.startsWith(`${siteRoot}${path.sep}`) || !fs.existsSync(filePath)) {
      response.writeHead(404).end('Not found');
      return;
    }

    response.writeHead(200, { 'content-type': contentType(filePath) });
    fs.createReadStream(filePath).pipe(response);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath: chromePath, headless: true });
});

after(async () => {
  await browser?.close();
  await new Promise((resolve) => server?.close(resolve));
});

async function assertImageLoaded(card, expectedPath) {
  const image = card.locator('img').first();
  assert.equal(await image.getAttribute('src'), expectedPath);
  await image.evaluate((element) => element.complete || new Promise((resolve) => {
    element.addEventListener('load', resolve, { once: true });
    element.addEventListener('error', resolve, { once: true });
  }));
  const dimensions = await image.evaluate((element) => ({
    width: element.naturalWidth,
    height: element.naturalHeight,
  }));
  assert.ok(dimensions.width > 0 && dimensions.height > 0, `${expectedPath} must load`);
}

for (const pagePath of ['/index.html', '/products.html']) {
  test(`${pagePath} shows the exact image for every featured model`, async () => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(`${baseUrl}${pagePath}`, { waitUntil: 'domcontentloaded' });

    for (const [model, expectedPath] of Object.entries(expectedImages)) {
      const card = page.locator('.featured-grid .feature-car').filter({ hasText: model });
      assert.equal(await card.count(), 1, `${model} should appear once in the featured grid`);
      await assertImageLoaded(card, expectedPath);
    }

    await page.close();
  });
}

test('Road Experience showcase uses the same exact model images', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`${baseUrl}/road-experience/index.html`, { waitUntil: 'domcontentloaded' });

  for (const [model, rootPath] of Object.entries(expectedImages)) {
    const card = page.locator('[data-featured-car]').filter({ hasText: model });
    assert.equal(await card.count(), 1, `${model} should appear once in the showcase`);
    await assertImageLoaded(card, `../${rootPath}`);
  }

  await page.close();
});

test('product inventory reuses the exact XPENG and Volkswagen model images', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`${baseUrl}/products.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('.inventory-card').first().waitFor();

  const inventoryImages = {
    'XPENG G6 Electric': expectedImages['XPENG G6 Electric'],
    'Volkswagen Golf SV 1.4A TSI Comfortline': expectedImages['Volkswagen Golf SV'],
  };

  for (const [model, expectedPath] of Object.entries(inventoryImages)) {
    const card = page.locator('.inventory-card').filter({ hasText: model });
    assert.equal(await card.count(), 1, `${model} should appear once in inventory`);
    await assertImageLoaded(card, expectedPath);
  }

  await page.close();
});

test('every inventory model uses a unique, clear local image', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(`${baseUrl}/products.html`, { waitUntil: 'domcontentloaded' });
  await page.locator('.inventory-card').first().waitFor();

  const inventory = [];
  const pageButtons = page.locator('#pagination button[aria-label^="Page "]');
  const pageCount = await pageButtons.count();

  for (let index = 0; index < pageCount; index += 1) {
    await page.locator('#pagination button[aria-label="Page ' + (index + 1) + '"]').click();
    const cards = page.locator('.inventory-card');
    await cards.first().waitFor();
    await cards.locator('.inventory-photo img').evaluateAll((images) => Promise.all(images.map((image) => {
      if (image.complete) return undefined;
      return new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    })));
    inventory.push(...await cards.evaluateAll((nodes) => nodes.map((card) => {
      const image = card.querySelector('.inventory-photo img');
      return {
        model: card.querySelector('h3')?.textContent.trim(),
        src: image?.getAttribute('src'),
        naturalWidth: image?.naturalWidth || 0,
        naturalHeight: image?.naturalHeight || 0,
        renderedWidth: image?.getBoundingClientRect().width || 0,
      };
    })));
  }

  assert.equal(inventory.length, 26, 'all inventory models should be covered');
  assert.equal(new Set(inventory.map(({ model }) => model)).size, 26, 'model names should be unique');
  assert.equal(new Set(inventory.map(({ src }) => src)).size, 26, 'each model should have its own image');

  for (const car of inventory) {
    assert.match(car.src, /^assets\//, `${car.model} should use a local image`);
    assert.ok(car.naturalWidth >= 900, `${car.model} image should be at least 900px wide`);
    assert.ok(car.naturalHeight >= 600, `${car.model} image should be at least 600px tall`);
    assert.ok(car.renderedWidth > 0, `${car.model} image should be visible`);
  }

  await page.close();
});
