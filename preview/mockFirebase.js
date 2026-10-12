// In-memory stand-in for the slice of the Firebase JS SDK that wha2do uses
// (auth + realtime database). Used by the browser preview (to take screenshots
// without a Firebase project) and by the Jest tests.

const clone = v =>
  v === undefined ? undefined : JSON.parse(JSON.stringify(v));

export const createMockFirebase = ({seed = true} = {}) => {
  let data = {};
  const accounts = {}; // email -> {uid, password, displayName}
  let currentUser = null;
  const authListeners = new Set();
  const dbListeners = []; // {path, fn}
  let uidCounter = 0;

  const getAt = path =>
    path
      .split('/')
      .filter(Boolean)
      .reduce((n, k) => (n == null ? n : n[k]), data);
  const setAt = (path, value) => {
    const keys = path.split('/').filter(Boolean);
    if (!keys.length) {
      data = value || {};
      return;
    }
    let node = data;
    keys.slice(0, -1).forEach(k => {
      node[k] = node[k] || {};
      node = node[k];
    });
    if (value === null || value === undefined) {
      delete node[keys[keys.length - 1]];
    } else {
      node[keys[keys.length - 1]] = clone(value);
    }
  };
  const snapshot = path => ({val: () => clone(getAt(path)) || null});
  const notify = changed => {
    dbListeners.forEach(({path, fn}) => {
      if (changed.startsWith(path) || path.startsWith(changed)) {
        fn(snapshot(path));
      }
    });
  };
  const wrap = value => Promise.resolve(value);

  const ref = (path = '') => ({
    child: sub => ref(`${path}/${sub}`),
    set: value => {
      setAt(path, value);
      notify(path);
      return wrap();
    },
    remove: () => {
      setAt(path, null);
      notify(path);
      return wrap();
    },
    push: value => {
      const id = `-M${Date.now().toString(36)}${(uidCounter += 1)}`;
      setAt(`${path}/${id}`, value);
      notify(path);
      return wrap({key: id});
    },
    on: (event, fn) => {
      dbListeners.push({path, fn});
      setTimeout(() => fn(snapshot(path)), 0);
    },
    off: (event, fn) => {
      const i = dbListeners.findIndex(l => l.path === path && l.fn === fn);
      if (i >= 0) {
        dbListeners.splice(i, 1);
      }
    },
  });

  const setUser = user => {
    currentUser = user;
    authListeners.forEach(fn => fn(currentUser));
  };
  const fail = code => Promise.reject(Object.assign(new Error(code), {code}));
  const makeUser = (email, acct) => ({
    uid: acct.uid,
    email,
    get displayName() {
      return acct.displayName;
    },
    updateProfile: ({displayName}) => {
      acct.displayName = displayName;
      return wrap();
    },
  });

  const auth = () => ({
    get currentUser() {
      return currentUser;
    },
    onAuthStateChanged: fn => {
      authListeners.add(fn);
      setTimeout(() => fn(currentUser), 0);
      return () => authListeners.delete(fn);
    },
    setPersistence: () => wrap(),
    signInWithEmailAndPassword: (email, password) => {
      const acct = accounts[email];
      if (!acct) {
        return fail('auth/user-not-found');
      }
      if (acct.password !== password) {
        return fail('auth/wrong-password');
      }
      const user = makeUser(email, acct);
      setUser(user);
      return wrap({user});
    },
    createUserWithEmailAndPassword: (email, password) => {
      if (accounts[email]) {
        return fail('auth/email-already-in-use');
      }
      uidCounter += 1;
      const acct = {uid: `user${uidCounter}`, password, displayName: null};
      accounts[email] = acct;
      const user = makeUser(email, acct);
      setUser(user);
      return wrap({user});
    },
    signOut: () => {
      setUser(null);
      return wrap();
    },
    sendPasswordResetEmail: email =>
      accounts[email] ? wrap() : fail('auth/user-not-found'),
  });
  auth.Auth = {Persistence: {LOCAL: 'local'}};

  if (seed) {
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
            l1: {name: 'Groceries', createdAt: t - 3000},
            l2: {name: 'Gym routine', createdAt: t - 2000},
            l3: {name: 'Work this week', createdAt: t - 1000},
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

  return {auth, database: () => ({ref}), apps: [{}], initializeApp: () => {}};
};

export default createMockFirebase();
