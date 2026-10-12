// Records a scripted walkthrough of the app (react-native-web + in-memory
// Firebase) and encodes it to docs/demo/wha2do-demo.{mp4,gif} with ffmpeg.
// Requires ffmpeg on the PATH.
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../docs/demo');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wha2do-demo-'));
fs.mkdirSync(out, {recursive: true});

const server = await createServer({
  root: here,
  server: {port: 5199},
  logLevel: 'error',
});
await server.listen();
const url = `http://localhost:${server.config.server.port}/demo.html`;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: {width: 1920, height: 1080},
  recordVideo: {dir: tmp, size: {width: 1920, height: 1080}},
});
const page = await context.newPage();
page.on('pageerror', e => console.error('page error:', e.message));

const pause = ms => page.waitForTimeout(ms);
const app = page.frameLocator('#screen');
const text = t => app.getByText(t, {exact: true}).first();
const field = p => app.getByPlaceholder(p);

// A "finger" inside the app that glides to each tap target, and captions on the stage.
const installOverlay = () =>
  page
    .frames()
    .find(f => f !== page.mainFrame())
    .evaluate(() => {
      const style = document.createElement('style');
      style.textContent = `
        #demo-finger{position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;z-index:99999;
          background:rgba(255,255,255,.55);border:2px solid rgba(65,84,254,.9);box-shadow:0 2px 10px rgba(0,0,0,.25);
          transform:translate(195px,700px);transition:transform .4s cubic-bezier(.4,0,.2,1);pointer-events:none}
        #demo-finger.press{animation:press .25s}
        @keyframes press{50%{scale:.7;background:rgba(65,84,254,.5)}}`;
      document.head.appendChild(style);
      const finger = document.createElement('div');
      finger.id = 'demo-finger';
      document.body.appendChild(finger);
    });

const caption = async msg => {
  await page.evaluate(m => {
    const el = document.getElementById('cap');
    el.textContent = m;
    el.style.opacity = m ? '1' : '0';
  }, msg);
};

const tap = async locator => {
  const pos = await locator.evaluate(el => {
    const r = el.getBoundingClientRect();
    return {x: r.x + r.width / 2, y: r.y + r.height / 2};
  });
  await locator.evaluate((el, {x, y}) => {
    el.ownerDocument.getElementById(
      'demo-finger',
    ).style.transform = `translate(${x}px,${y}px)`;
  }, pos);
  await pause(450);
  await locator.evaluate(el => {
    const f = el.ownerDocument.getElementById('demo-finger');
    f.classList.remove('press');
    void f.offsetWidth;
    f.classList.add('press');
  });
  await pause(120);
  await locator.click();
  await pause(250);
};

const type = async (locator, value) => {
  await tap(locator);
  await locator.pressSequentially(value, {delay: 40});
  await pause(250);
};

await page.goto(url);
await text('Log in').waitFor();
await installOverlay();

// 1. Welcome
await caption('wha2do: your lists, your day, one place');
await pause(1300);

// 2. Sign up
await caption('Create an account');
await tap(text('Create an account'));
await type(field('Username'), 'Alex');
await type(field('Email address'), 'alex@example.com');
await type(field('Phone (10 digits)'), '5551234567');
await type(field('Password (8+ characters)'), 'password123');
await caption('Forms are validated as you type');
await pause(900);
await tap(app.getByRole('button', {name: 'Sign up'}));

// 3. First list
await text('No lists yet').waitFor();
await caption('Start with a list for anything');
await pause(1100);
await tap(app.getByLabel('New list'));
await type(field('List name (e.g. Groceries)'), 'Groceries');
await tap(text('Create list'));
await text('Groceries').waitFor();
await caption('Icons are matched to your list automatically');
await pause(1300);

// 4. Tasks
await tap(text('Groceries'));
await text('Nothing to do').waitFor();
for (const [i, name] of [
  'Oat milk',
  'Sourdough bread',
  'Fresh basil',
].entries()) {
  await caption(i === 0 ? 'Add tasks with an optional start time' : '');
  await tap(app.getByLabel('New task'));
  await type(field('What needs doing?'), name);
  if (i === 0) {
    await tap(text('Pick a start time (optional)'));
    await pause(500);
  }
  await tap(text('Add task'));
  await pause(500);
}

// 5. Complete tasks
await caption('Tap the circle to tick tasks off');
await pause(800);
await tap(app.getByRole('checkbox').first());
await pause(600);
await tap(app.getByRole('checkbox').first());
await caption('Progress updates as you go');
await pause(1800);

// 6. Back to lists, end card
await tap(app.getByLabel('Back'));
await caption('wha2do: built with React Native + Firebase');
await pause(2200);

await context.close();
const video = fs.readdirSync(tmp).find(f => f.endsWith('.webm'));
await browser.close();
await server.close();

// Encode a 1080p MP4 plus a smaller GIF for the README.
const src = path.join(tmp, video);
const mp4 = path.join(out, 'wha2do-demo.mp4');
const gif = path.join(out, 'wha2do-demo.gif');
execFileSync('ffmpeg', [
  '-y',
  '-loglevel',
  'error',
  '-i',
  src,
  '-vf',
  'scale=1920:1080,fps=30,format=yuv420p',
  '-c:v',
  'libx264',
  '-crf',
  '20',
  '-movflags',
  '+faststart',
  mp4,
]);
execFileSync('ffmpeg', [
  '-y',
  '-loglevel',
  'error',
  '-i',
  src,
  '-vf',
  'fps=10,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4',
  gif,
]);
fs.rmSync(tmp, {recursive: true, force: true});
for (const f of [mp4, gif]) {
  console.log(path.basename(f), (fs.statSync(f).size / 1e6).toFixed(2), 'MB');
}
