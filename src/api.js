import firebase from './firebase';

const userRef = uid => firebase.database().ref(`users/${uid}`);

// ---- auth ------------------------------------------------------------------

export const authErrorMessage = error => {
  switch (error && error.code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try logging in.';
    case 'auth/user-not-found':
      return 'No account with that email. Sign up first?';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/weak-password':
      return 'Please choose a stronger password.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

export const onAuthChanged = cb => firebase.auth().onAuthStateChanged(cb);

export const signIn = (email, password) =>
  firebase
    .auth()
    .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => firebase.auth().signInWithEmailAndPassword(email, password));

// Creates the account, sets the display name and stores a public profile.
// Passwords are handled by Firebase Auth only and are never written to the DB.
export const signUp = async ({username, email, password, phone}) => {
  const {user} = await firebase
    .auth()
    .createUserWithEmailAndPassword(email, password);
  await user.updateProfile({displayName: username});
  await userRef(user.uid)
    .child('profile')
    .set({username, email, phone});
  return user;
};

export const signOut = () => firebase.auth().signOut();

export const resetPassword = email =>
  firebase.auth().sendPasswordResetEmail(email);

// ---- lists & tasks ---------------------------------------------------------
// users/{uid}/lists/{listId}  -> {name, createdAt}
// users/{uid}/tasks/{listId}/{taskId} -> {name, time, done, createdAt}

const toArray = snapshot => {
  const value = snapshot.val() || {};
  return Object.keys(value).map(id => ({id, ...value[id]}));
};

export const subscribeLists = (uid, cb) => {
  const ref = userRef(uid).child('lists');
  const handler = snap =>
    cb(toArray(snap).sort((a, b) => b.createdAt - a.createdAt));
  ref.on('value', handler);
  return () => ref.off('value', handler);
};

export const addList = (uid, name) =>
  userRef(uid)
    .child('lists')
    .push({name, createdAt: Date.now()});

export const removeList = (uid, listId) =>
  Promise.all([
    userRef(uid)
      .child(`lists/${listId}`)
      .remove(),
    userRef(uid)
      .child(`tasks/${listId}`)
      .remove(),
  ]);

export const subscribeTasks = (uid, listId, cb) => {
  const ref = userRef(uid).child(`tasks/${listId}`);
  const handler = snap =>
    cb(toArray(snap).sort((a, b) => b.createdAt - a.createdAt));
  ref.on('value', handler);
  return () => ref.off('value', handler);
};

export const addTask = (uid, listId, {name, time}) =>
  userRef(uid)
    .child(`tasks/${listId}`)
    .push({name, time: time || null, done: false, createdAt: Date.now()});

export const setTaskDone = (uid, listId, taskId, done) =>
  userRef(uid)
    .child(`tasks/${listId}/${taskId}/done`)
    .set(done);

export const removeTask = (uid, listId, taskId) =>
  userRef(uid)
    .child(`tasks/${listId}/${taskId}`)
    .remove();
