// Renders a scripted walkthrough of the app (react-native-web + in-memory Firebase) into
// docs/demo/wha2do-demo.{mp4,gif}.
//
// Frames are rendered one at a time on a virtual clock (30 fps), so camera moves are perfectly
// smooth no matter how slow the machine is, and every on-screen moment has an exact timestamp.
// Those timestamps drive the soundtrack (make-audio.py). Requires ffmpeg, ffprobe and python3 + numpy.
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../docs/demo');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wha2do-demo-'));
fs.mkdirSync(out, { recursive: true });

const FPS = 30;
const silent = path.join(tmp, 'silent.mp4');
const wav = path.join(tmp, 'soundtrack.wav');
const mp4 = path.join(out, 'wha2do-demo.mp4');
const gif = path.join(out, 'wha2do-demo.gif');
const ffmpeg = args =>
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);

const server = await createServer({
  root: here,
  server: { port: 5199 },
  logLevel: 'error',
});
await server.listen();
const url = `http://localhost:${server.config.server.port}/demo.html`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.error('page error:', e.message));

// ---- virtual clock -------------------------------------------------------------------------

const encoder = spawn(
  'ffmpeg',
  [
    ...['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', FPS],
    ...['-c:v', 'mjpeg', '-i', '-', '-vf', 'format=yuv420p'],
    ...['-c:v', 'libx264', '-preset', 'medium', '-crf', '20', silent],
  ],
  { stdio: ['pipe', 'inherit', 'inherit'] },
);
const encoderDone = new Promise(resolve => encoder.on('close', resolve));

let frame = 0;
const now = () => frame / FPS;
const events = [];
const mark = (type, extra = {}) => events.push({ t: now(), type, ...extra });

const advance = async seconds => {
  const n = Math.round(seconds * FPS);
  for (let i = 0; i < n; i += 1) {
    await page.evaluate(t => window.__render(t), now());
    const jpeg = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!encoder.stdin.write(jpeg)) {
      await new Promise(resolve => encoder.stdin.once('drain', resolve));
    }
    frame += 1;
  }
};
const pause = ms => advance(ms / 1000);

// ---- stage: tweens evaluated per frame inside the page ----------------------------------------

const installStage = () => {
  const bez = (x1, y1, x2, y2) => {
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    const sx = t => ((ax * t + bx) * t + cx) * t;
    const sy = t => ((ay * t + by) * t + cy) * t;
    const dx = t => (3 * ax * t + 2 * bx) * t + cx;
    return x => {
      let t = x;
      for (let i = 0; i < 8; i += 1) {
        const e = sx(t) - x;
        if (Math.abs(e) < 1e-6) break;
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      return sy(t);
    };
  };
  const clamp = v => Math.min(1, Math.max(0, v));
  const lerp = (a, b, e) => a + (b - a) * e;

  const S = {
    cam: { x: 960, y: 540, s: 1, rx: 0, ry: 0, ox: 0 },
    camTw: null,
    finger: { x: 195, y: 700 },
    fingerTw: null,
    pressAt: -10,
    cap: { op: 0, from: 0, to: 0, t0: -10 },
    cards: {
      intro: { op: 1, from: 1, to: 1, t0: -10 },
      outro: { op: 0, from: 0, to: 0, t0: -10 },
    },
  };
  window.__S = S;

  window.__camTo = (to, t0, ms, curve) => {
    S.camTw = {
      from: { ...S.cam },
      to,
      t0,
      dur: Math.max(ms, 1) / 1000,
      ease: bez(...curve),
    };
  };
  window.__fingerTo = (x, y, t0) => {
    S.fingerTw = {
      from: { ...S.finger },
      to: { x, y },
      t0,
      dur: 0.33,
      ease: bez(0.4, 0, 0.2, 1),
    };
  };
  window.__press = t => {
    S.pressAt = t;
  };
  window.__caption = (msg, t) => {
    const el = document.getElementById('cap');
    if (msg) el.textContent = msg;
    S.cap = { op: S.cap.op, from: S.cap.op, to: msg ? 1 : 0, t0: t };
  };
  window.__card = (id, on, t) => {
    const c = S.cards[id];
    S.cards[id] = { op: c.op, from: c.op, to: on ? 1 : 0, t0: t };
  };

  window.__render = t => {
    // camera
    if (S.camTw) {
      const tw = S.camTw;
      const u = clamp((t - tw.t0) / tw.dur);
      const e = tw.ease(u);
      for (const k of ['x', 'y', 's', 'rx', 'ry', 'ox']) {
        S.cam[k] = lerp(tw.from[k], tw.to[k], e);
      }
      if (u >= 1) S.camTw = null;
    }
    const c = S.cam;
    document.getElementById('world').style.transform = `translate(${
      960 + c.ox
    }px,540px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) scale(${
      c.s
    }) translate(${-c.x}px,${-c.y}px)`;

    // finger (lives inside the app iframe)
    if (S.fingerTw) {
      const tw = S.fingerTw;
      const u = clamp((t - tw.t0) / tw.dur);
      const e = tw.ease(u);
      S.finger.x = lerp(tw.from.x, tw.to.x, e);
      S.finger.y = lerp(tw.from.y, tw.to.y, e);
      if (u >= 1) S.fingerTw = null;
    }
    const f = document
      .getElementById('screen')
      .contentDocument.getElementById('demo-finger');
    if (f) {
      const p = clamp((t - S.pressAt) / 0.25);
      const scale = 1 - 0.3 * Math.sin(Math.PI * p);
      f.style.transform = `translate(${S.finger.x}px,${S.finger.y}px) scale(${scale})`;
      f.style.background =
        p > 0 && p < 1 ? 'rgba(65,84,254,.45)' : 'rgba(255,255,255,.55)';
    }

    // caption + cards
    const cap = S.cap;
    cap.op = lerp(cap.from, cap.to, clamp((t - cap.t0) / 0.4));
    const el = document.getElementById('cap');
    el.style.opacity = cap.op;
    el.style.transform = `translateY(calc(-50% + ${(1 - cap.op) * 12}px))`;
    for (const id of ['intro', 'outro']) {
      const k = S.cards[id];
      k.op = lerp(k.from, k.to, clamp((t - k.t0) / 0.8));
      document.getElementById(id).style.opacity = k.op;
    }
  };
};

const app = page.frameLocator('#screen');
const text = t => app.getByText(t, { exact: true }).first();
const field = p => app.getByPlaceholder(p);

// A "finger" inside the app that glides to each tap target.
const installFinger = () =>
  page
    .frames()
    .find(f => f !== page.mainFrame())
    .evaluate(() => {
      const finger = document.createElement('div');
      finger.id = 'demo-finger';
      finger.style.cssText =
        'position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;z-index:99999;' +
        'background:rgba(255,255,255,.55);border:2px solid rgba(65,84,254,.9);box-shadow:0 2px 10px rgba(0,0,0,.25);' +
        'pointer-events:none;transform:translate(195px,700px)';
      document.body.appendChild(finger);
    });

// ---- camera + interaction helpers ---------------------------------------------------------------

const SCREEN = { x: 757, y: 110 }; // phone screen origin in world space (stage is 1920x1080)
let cam = { x: 960, y: 540, s: 1, rx: 0, ry: 0 };
const EASE = [0.45, 0, 0.2, 1];

const camera = async (next, ms = 1100, ease = EASE) => {
  const from = cam.s;
  cam = { ...cam, ...next };
  mark('cam', { ms, from, to: cam.s, ry: cam.ry });
  const to = { ...cam, ox: cam.s > 1.15 ? 250 : 0 };
  await page.evaluate(
    ([target, t, duration, curve]) =>
      window.__camTo(target, t, duration, curve),
    [to, now(), ms, ease],
  );
  await pause(ms);
};

const caption = msg =>
  page.evaluate(([m, t]) => window.__caption(m, t), [msg, now()]);
const card = (id, on) => {
  mark('card', { id, on });
  return page.evaluate(([i, v, t]) => window.__card(i, v, t), [id, on, now()]);
};

const center = locator =>
  locator.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });

// Zoom on an element inside the app. dx/dy nudge the focus (in screen px).
const focus = async (locator, s = 2.2, ms = 700, dx = 0, dy = 0) => {
  const pos = await center(locator);
  await camera(
    { x: SCREEN.x + pos.x + dx, y: SCREEN.y + pos.y + dy, s, rx: 0, ry: 0 },
    ms,
  );
};

const medium = (ms = 800) =>
  camera({ x: 960, y: 560, s: 1.28, rx: 0, ry: 0 }, ms);

const tap = async (locator, zoom) => {
  if (zoom) await focus(locator, zoom, 650);
  const pos = await center(locator);
  await page.evaluate(
    ([x, y, t]) => window.__fingerTo(x, y, t),
    [pos.x, pos.y, now()],
  );
  await pause(330);
  await page.evaluate(t => window.__press(t), now());
  await pause(120);
  mark('tap');
  await locator.click();
  await pause(150);
};

const type = async (locator, value, zoom) => {
  await tap(locator, zoom);
  for (const ch of value) {
    mark('key');
    await page.keyboard.type(ch);
    await pause(45);
  }
  await pause(250);
};

// ---- the story ------------------------------------------------------------------------------------

await page.goto(url);
await text('Log in').waitFor();
await page.evaluate(installStage);
await installFinger();

// Intro: title card over a tilted, zoomed-out phone that swings round to flat.
cam = { x: 960, y: 540, s: 0.6, rx: 12, ry: -26 };
await page.evaluate(
  c => window.__camTo({ ...c, ox: 0 }, 0, 1, [0, 0, 1, 1]),
  cam,
);
mark('card', { id: 'intro', on: true });
await pause(1200);
await card('intro', false);
await camera({ x: 960, y: 540, s: 1, rx: 0, ry: 0 }, 2000, [0.3, 0, 0.15, 1]);
await caption('Your lists, your day, one place');
await camera({ x: 960, y: 520, s: 1.35 }, 1800, [0.2, 0.4, 0.4, 1]);

// Sign up
await caption('Create an account in seconds');
await tap(text('Create an account'), 2);
await medium();
await type(field('Username'), 'Alex', 2.4);
await type(field('Email address'), 'alex@example.com', 2.4);
await type(field('Password (8+ characters)'), 'password123', 2.4);
await caption('Forms are validated as you type');
await medium(900);
await tap(app.getByRole('button', { name: 'Sign up' }), 2);

// First list
await text('No lists yet').waitFor();
mark('signup_ok');
await medium();
await caption('Start with a list for anything');
await pause(900);
await tap(app.getByLabel('New list'), 2.2);
mark('sheet_open');
await camera({ x: SCREEN.x + 203, y: SCREEN.y + 640, s: 1.8 }, 800);
await type(field('List name (e.g. Groceries)'), 'Groceries');
await tap(text('Create list'), 2);
await text('Groceries').waitFor();
mark('list_created');
await caption('Icons are matched to your list automatically');
await focus(text('Groceries'), 2.3, 1100);
await pause(1100);

// Tasks
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
  mark('sheet_open');
  await camera({ x: SCREEN.x + 203, y: SCREEN.y + 640, s: 1.8 }, 800);
  await type(field('What needs doing?'), name);
  if (i === 0) {
    await tap(text('Pick a start time (optional)'), 2.2);
    await pause(700);
  }
  await tap(text('Add task'), 2);
  mark('task_added', { i });
  await pause(400);
}

// Complete tasks, then look at the progress
await medium();
await caption('Tap the circle to tick tasks off');
await pause(600);
await tap(app.getByRole('checkbox').first(), 2.8);
mark('check', { i: 0 });
await pause(500);
await tap(app.getByRole('checkbox').first(), 2.8);
mark('check', { i: 1 });
await caption('Progress updates as you go');
mark('progress');
await focus(text('2 of 3 done'), 2.1, 1100, 100, 150);
await pause(1400);

// Back to the lists, then pull away for the end card
await tap(app.getByLabel('Back'), 2);
await caption('');
await camera({ x: 960, y: 540, s: 0.62, rx: 10, ry: 24 }, 2400, EASE);
await card('outro', true);
await pause(2400);
mark('end');

await browser.close();
await server.close();
encoder.stdin.end();
await encoderDone;

// ---- soundtrack + mux -----------------------------------------------------------------------------

const duration = frame / FPS;
const eventsFile = path.join(tmp, 'events.json');
fs.writeFileSync(eventsFile, JSON.stringify({ duration, events }, null, 1));
execFileSync('python3', [path.join(here, 'make-audio.py'), eventsFile, wav], {
  stdio: 'inherit',
});
ffmpeg([
  ...['-i', silent, '-i', wav],
  ...[
    ...['-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k'],
    ...['-shortest', '-movflags', '+faststart', mp4],
  ],
]);
// The GIF is silent and small, for the README.
ffmpeg([
  ...['-i', silent],
  ...[
    '-vf',
    'fps=8,scale=560:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=48:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle',
  ],
  gif,
]);
if (process.env.KEEP_EVENTS) {
  fs.copyFileSync(eventsFile, process.env.KEEP_EVENTS);
  fs.copyFileSync(wav, process.env.KEEP_EVENTS.replace(/\.json$/, '.wav'));
}
fs.rmSync(tmp, { recursive: true, force: true });
for (const f of [mp4, gif]) {
  console.log(path.basename(f), (fs.statSync(f).size / 1e6).toFixed(2), 'MB');
}
console.log(`duration ${duration.toFixed(1)}s, ${frame} frames`);
