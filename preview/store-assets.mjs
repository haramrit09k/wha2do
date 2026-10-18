// Generates Google Play listing graphics into ../store: six phone screenshots (1080x2160) and the
// 1024x500 feature graphic, from the real app (react-native-web + in-memory Firebase, fake demo data).
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../store/screenshots');
fs.mkdirSync(out, { recursive: true });

const server = await createServer({
  root: here,
  server: { port: 5199 },
  logLevel: 'error',
});
await server.listen();
const url = `http://localhost:${server.config.server.port}/?autotime`;

const browser = await chromium.launch();
// 400x800 CSS px at 2.7x = 1080x2160, the tallest ratio Play accepts (2:1).
const page = await browser.newPage({
  viewport: { width: 400, height: 800 },
  deviceScaleFactor: 2.7,
});
page.on('pageerror', e => console.error('page error:', e.message));

const app = page;
const text = t => app.getByText(t, { exact: true }).first();
const field = p => app.getByPlaceholder(p);
const shot = async name => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  console.log('saved', name);
};

await page.goto(url);
await text('Log in').waitFor();
await shot('01-welcome');

await text('Create an account').click();
await field('Username').fill('al');
await field('Email address').fill('alex@');
await field('Password (8+ characters)').fill('short');
await field('Username').click();
await field('Email address').click();
await field('Password (8+ characters)').click();
await field('Username').click();
await shot('02-signup');

await page.goto(url);
await text('Log in').click();
await field('Email address').fill('demo@wha2do.app');
await field('Password').fill('password123');
await page.getByRole('button', { name: 'Log in' }).last().click();
await text('Your lists').waitFor();
await shot('03-lists');

await text('Work this week').click();
await text('Prepare sprint demo').waitFor();
await shot('04-tasks');

await page.getByLabel('New task').click();
await field('What needs doing?').fill('Send invoice to client');
await text('Pick a start time (optional)').click();
await shot('05-add-task');
await page.getByLabel('Close').click();

await page.getByLabel('Back').click();
await page.getByLabel('Account').click();
await text('Delete account').click();
await shot('06-delete-account');

// Feature graphic
const uri = n =>
  `data:image/png;base64,${fs
    .readFileSync(path.join(out, `${n}.png`))
    .toString('base64')}`;
const g = await browser.newPage({ viewport: { width: 1024, height: 500 } });
await g.setContent(`<body style="margin:0;width:1024px;height:500px;overflow:hidden;position:relative;background:linear-gradient(135deg,#2b3bd6,#4154fe 50%,#8a99ff);font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#fff">
  <div style="position:absolute;left:70px;top:150px;width:520px">
    <div style="font-size:92px;font-weight:900;font-style:italic;letter-spacing:-4px">wha2do</div>
    <div style="font-size:34px;font-weight:600;margin-top:10px;opacity:.95">Your lists, your day, one place.</div>
    <div style="font-size:24px;margin-top:18px;opacity:.8">Plan it. Tick it. Done.</div>
  </div>
  ${[
    ['04-tasks', 640, 60, -6],
    ['03-lists', 800, 130, 5],
  ]
    .map(
      ([n, x, y, r]) =>
        `<div style="position:absolute;left:${x}px;top:${y}px;width:200px;height:400px;padding:6px;box-sizing:border-box;border-radius:30px;background:#14183c;transform:rotate(${r}deg);box-shadow:0 20px 40px rgba(10,14,60,.5)"><img src="${uri(
          n,
        )}" style="width:100%;height:100%;border-radius:24px;object-fit:cover;object-position:top"></div>`,
    )
    .join('')}
</body>`);
await g.screenshot({
  path: path.resolve(here, '../store/feature-graphic-1024x500.png'),
});
console.log('saved feature graphic');

await browser.close();
await server.close();
