/* global globalThis */
// In-memory stand-in for the slice of Firebase that wha2do uses (Auth + Realtime
// Database). The modules next to this file (app.js, auth.js, database.js) expose it
// with the same function names as the real modular SDK, so the app code runs
// unchanged in the browser preview and in Jest.
//
// The demo account and sample data are only seeded when the page sets
// `window.__WHA2DO_SEED__ = true` (see preview/index.html).

const clone = v =>
  v === undefined ? undefined : JSON.parse(JSON.stringify(v));
const seedWanted = () =>
  typeof globalThis !== 'undefined' && globalThis.__WHA2DO_SEED__ === true;

let data = {};
const accounts = {}; // email -> {uid, password, displayName}
let currentUser = null;
let uidCounter = 0;
const authListeners = new Set();
const dbListeners = []; // {path, fn}

export const getAt = path =>
  path
    .split('/')
    .filter(Boolean)
    .reduce((n, k) => (n == null ? n : n[k]), data);

export const setAt = (path, value) => {
  const keys = path.split('/').filter(Boolean);
  let node = data;
  keys.slice(0, -1).forEach(k => {
    node[k] = node[k] || {};
    node = node[k];
  });
  const last = keys[keys.length - 1];
  if (value === null || value === undefined) {
    delete node[last];
  } else {
    node[last] = clone(value);
  }
};

export const snapshot = path => ({ val: () => clone(getAt(path)) ?? null });

export const notify = changed => {
  dbListeners.forEach(({ path, fn }) => {
    if (changed.startsWith(path) || path.startsWith(changed)) {
      fn(snapshot(path));
    }
  });
};

export const listen = (path, fn) => {
  const entry = { path, fn };
  dbListeners.push(entry);
  setTimeout(() => fn(snapshot(path)), 0);
  return () => {
    const i = dbListeners.indexOf(entry);
    if (i >= 0) {
      dbListeners.splice(i, 1);
    }
  };
};

export const newKey = () => {
  uidCounter += 1;
  return `-M${Date.now().toString(36)}${uidCounter}`;
};

// ---- auth state ----------------------------------------------------------------

export const fail = code =>
  Promise.reject(Object.assign(new Error(code), { code }));

const makeUser = (email, acct) => ({
  uid: acct.uid,
  email,
  get displayName() {
    return acct.displayName;
  },
  set displayName(v) {
    acct.displayName = v;
  },
});

export const authState = {
  get currentUser() {
    return currentUser;
  },
  listeners: authListeners,
};

export const setUser = user => {
  currentUser = user;
  authListeners.forEach(fn => fn(currentUser));
};

export const signIn = (email, password) => {
  const acct = accounts[email];
  if (!acct) {
    return fail('auth/user-not-found');
  }
  if (acct.password !== password) {
    return fail('auth/wrong-password');
  }
  const user = makeUser(email, acct);
  setUser(user);
  return Promise.resolve({ user });
};

export const createAccount = (email, password) => {
  if (accounts[email]) {
    return fail('auth/email-already-in-use');
  }
  uidCounter += 1;
  const acct = { uid: `user${uidCounter}`, password, displayName: null };
  accounts[email] = acct;
  const user = makeUser(email, acct);
  setUser(user);
  return Promise.resolve({ user });
};

export const resetEmail = email =>
  accounts[email] ? Promise.resolve() : fail('auth/user-not-found');

export const removeAccount = user => {
  const email = Object.keys(accounts).find(e => accounts[e].uid === user.uid);
  delete accounts[email];
  setUser(null);
  return Promise.resolve();
};

if (seedWanted()) {
  accounts['demo@wha2do.app'] = {
    uid: 'demo',
    password: 'password123',
    displayName: 'Alex',
  };
  const t = Date.now();
  data = {
    users: {
      demo: {
        lists: {
          l1: { name: 'Groceries', createdAt: t - 3000 },
          l2: { name: 'Gym routine', createdAt: t - 2000 },
          l3: { name: 'Work this week', createdAt: t - 1000 },
        },
        tasks: {
          l3: {
            t1: {
              name: 'Review pull requests',
              time: '09:30',
              done: true,
              createdAt: t - 500,
            },
            t2: {
              name: 'Prepare sprint demo',
              time: '14:00',
              done: false,
              createdAt: t - 400,
            },
            t3: {
              name: 'Reply to design feedback',
              time: null,
              done: false,
              createdAt: t - 300,
            },
            t4: {
              name: 'Book flights for the offsite',
              time: '17:15',
              done: false,
              createdAt: t - 200,
            },
            t5: {
              name: 'Update the README',
              time: null,
              done: true,
              createdAt: t - 100,
            },
          },
        },
      },
    },
  };
}
