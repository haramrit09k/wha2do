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
    el.classList.toggle('on', Boolean(m));
  }, msg);
};

const card = (id, on) =>
  page.evaluate(
    ([i, v]) => document.getElementById(i).classList.toggle('on', v),
    [id, on],
  );

// Virtual camera: look at world point (x, y) at a zoom level, optionally tilted in 3D.
// The phone's screen origin in world space is (757, 110); the stage is 1920x1080.
const SCREEN = {x: 757, y: 110};
let cam = {x: 960, y: 540, s: 1, rx: 0, ry: 0};
const camera = async (next, ms = 1100, ease = 'cubic-bezier(.45,0,.2,1)') => {
  cam = {...cam, ...next};
  await page.evaluate(
    ({c, ms, ease}) => {
      const w = document.getElementById('world');
      w.style.transition = `transform ${ms}ms ${ease}`;
      const ox = c.s > 1.15 ? 250 : 0;
      w.style.transform = `translate(${960 + ox}px,540px) rotateX(${
        c.rx
      }deg) rotateY(${c.ry}deg) scale(${c.s}) translate(${-c.x}px,${-c.y}px)`;
    },
    {c: cam, ms, ease},
  );
  await pause(ms);
};

// Zoom on an element inside the app. dx/dy nudge the focus (in screen px).
const focus = async (locator, s = 2.2, ms = 700, dx = 0, dy = 0) => {
  const pos = await locator.evaluate(el => {
    const r = el.getBoundingClientRect();
    return {x: r.x + r.width / 2, y: r.y + r.height / 2};
  });
  await camera(
    {x: SCREEN.x + pos.x + dx, y: SCREEN.y + pos.y + dy, s, rx: 0, ry: 0},
    ms,
  );
};

const wide = (ms = 1100) => camera({x: 960, y: 540, s: 1, rx: 0, ry: 0}, ms);
const medium = (ms = 800) =>
  camera({x: 960, y: 560, s: 1.28, rx: 0, ry: 0}, ms);

const tap = async (locator, zoom) => {
  if (zoom) {
    await focus(locator, zoom, 650);
  }
  const pos = await locator.evaluate(el => {
    const r = el.getBoundingClientRect();
    return {x: r.x + r.width / 2, y: r.y + r.height / 2};
  });
  await locator.evaluate((el, {x, y}) => {
    el.ownerDocument.getElementById(
      'demo-finger',
    ).style.transform = `translate(${x}px,${y}px)`;
  }, pos);
  await pause(330);
  await locator.evaluate(el => {
    const f = el.ownerDocument.getElementById('demo-finger');
    f.classList.remove('press');
    void f.offsetWidth;
    f.classList.add('press');
  });
  await pause(120);
  await locator.click();
  await pause(150);
};

const type = async (locator, value, zoom) => {
  await tap(locator, zoom);
  await locator.pressSequentially(value, {delay: 28});
  await pause(250);
};

await page.goto(url);
await text('Log in').waitFor();
await installOverlay();

// --- Intro: tilted, zoomed-out title shot that swings round to the flat phone.
cam = {x: 960, y: 540, s: 0.6, rx: 12, ry: -26};
await camera({}, 0);
await card('intro', true);
await pause(1200);
await card('intro', false);
await camera(
  {x: 960, y: 540, s: 1, rx: 0, ry: 0},
  2000,
  'cubic-bezier(.3,0,.15,1)',
);
await caption('Your lists, your day, one place');
await camera({x: 960, y: 520, s: 1.35}, 1800, 'cubic-bezier(.2,.4,.4,1)');

// --- Sign up
await caption('Create an account in seconds');
await tap(text('Create an account'), 2);
await medium();
await type(field('Username'), 'Alex', 2.4);
await type(field('Email address'), 'alex@example.com', 2.4);
await type(field('Phone (10 digits)'), '5551234567', 2.4);
await type(field('Password (8+ characters)'), 'password123', 2.4);
await caption('Forms are validated as you type');
await medium(900);
await tap(app.getByRole('button', {name: 'Sign up'}), 2);

// --- First list
await text('No lists yet').waitFor();
await medium();
await caption('Start with a list for anything');
await pause(900);
await tap(app.getByLabel('New list'), 2.2);
await camera({x: SCREEN.x + 203, y: SCREEN.y + 640, s: 1.8}, 800);
await type(field('List name (e.g. Groceries)'), 'Groceries');
await tap(text('Create list'), 2);
await text('Groceries').waitFor();
await caption('Icons are matched to your list automatically');
await focus(text('Groceries'), 2.3, 1100);
await pause(1100);

// --- Tasks
await tap(text('Groceries'));
await text('Nothing to do').waitFor();
await medium();
for (const [i, name] of [
  'Oat milk',
  'Sourdough bread',
  'Fresh basil',
].entries()) {
  await caption(i === 0 ? 'Add tasks, with an optional start time' : '');
  await tap(app.getByLabel('New task'), 2);
  await camera({x: SCREEN.x + 203, y: SCREEN.y + 640, s: 1.8}, 800);
  await type(field('What needs doing?'), name);
  if (i === 0) {
    await tap(text('Pick a start time (optional)'), 2.2);
    await pause(700);
  }
  await tap(text('Add task'), 2);
  await pause(400);
}

// --- Complete tasks, then look at the progress
await medium();
await caption('Tap the circle to tick tasks off');
await pause(600);
await tap(app.getByRole('checkbox').first(), 2.8);
await pause(500);
await tap(app.getByRole('checkbox').first(), 2.8);
await caption('Progress updates as you go');
await focus(text('2 of 3 done'), 2.1, 1100, 100, 150);
await pause(1400);

// --- Back to the lists, then pull away for the end card
await tap(app.getByLabel('Back'), 2);
await caption('');
await camera(
  {x: 960, y: 540, s: 0.62, rx: 10, ry: 24},
  2400,
  'cubic-bezier(.4,0,.2,1)',
);
await card('outro', true);
await pause(2400);

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
  'fps=8,scale=560:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=48:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle',
  gif,
]);
fs.rmSync(tmp, {recursive: true, force: true});
for (const f of [mp4, gif]) {
  console.log(path.basename(f), (fs.statSync(f).size / 1e6).toFixed(2), 'MB');
}
