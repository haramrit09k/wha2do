// Drives the real app (react-native-web + in-memory Firebase) with Playwright
// and saves phone-sized screenshots to ../docs/screenshots.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../docs/screenshots');
fs.mkdirSync(out, { recursive: true });

const server = await createServer({
  root: here,
  server: { port: 5199 },
  logLevel: 'error',
});
await server.listen();
const url = `http://localhost:${server.config.server.port}/`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
page.on('pageerror', e => console.error('page error:', e.message));

const shot = async name => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log('saved', name);
};
const text = t => page.getByText(t, { exact: true }).first();
const field = p => page.getByPlaceholder(p);

await page.goto(url);
await text('Log in').waitFor();
await shot('01-welcome');

// Sign-up form with validation errors showing.
await text('Create an account').click();
await field('Username').fill('al');
await field('Email address').fill('alex@');
await field('Password (8+ characters)').fill('short');
await field('Username').click();
await field('Email address').click();
await field('Password (8+ characters)').click();
await field('Username').click();
await shot('02-signup-validation');

// Log in as the seeded demo user.
await page.goto(url);
await text('Log in').click();
await field('Email address').fill('demo@wha2do.app');
await field('Password').fill('password123');
await shot('03-login');
await page.getByRole('button', { name: 'Log in' }).last().click();

await text('Your lists').waitFor();
await shot('04-lists');

await text('Work this week').click();
await text('Prepare sprint demo').waitFor();
await shot('05-tasks');

await page.getByLabel('New task').click();
await field('What needs doing?').fill('Send invoice to client');
await text('Pick a start time (optional)').click();
await shot('06-add-task');
await text('Add task').click();
await text('Task added').waitFor();
await shot('07-task-added');

await page.getByLabel('Back').click();
await page.getByLabel('New list').click();
await field('List name (e.g. Groceries)').fill('Weekend trip');
await shot('08-new-list');

// Compose the hero banner used at the top of the README.
const uri = n =>
  `data:image/png;base64,${fs
    .readFileSync(path.join(out, `${n}.png`))
    .toString('base64')}`;
const phones = ['01-welcome', '04-lists', '05-tasks', '06-add-task'];
const banner = await browser.newPage({
  viewport: { width: 1600, height: 900 },
});
await banner.setContent(`<body style="margin:0;background:linear-gradient(135deg,#4154FE,#7B8CFF);font-family:-apple-system,Segoe UI,Roboto,sans-serif;display:flex;align-items:center;justify-content:center;gap:36px;height:900px">
  ${phones
    .map(
      (n, i) =>
        `<img src="${uri(n)}" style="height:${
          i % 2 ? 700 : 740
        }px;border-radius:44px;border:10px solid #14183c;box-shadow:0 30px 60px rgba(10,14,60,.45)">`,
    )
    .join('')}
</body>`);
await banner.screenshot({ path: path.join(out, 'overview.png') });
console.log('saved overview');

await browser.close();
await server.close();
