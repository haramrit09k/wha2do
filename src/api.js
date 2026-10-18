import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { child, onValue, push, ref, remove, set } from 'firebase/database';
import { auth, db } from './firebase';

const userRef = uid => ref(db, `users/${uid}`);

// ---- auth ------------------------------------------------------------------

export const authErrorMessage = error => {
  switch (error && error.code) {
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try logging in.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/weak-password':
      return 'Please choose a stronger password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again in a few minutes.';
    case 'auth/requires-recent-login':
      return 'For your security, please log in again, then retry.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

export const onAuthChanged = cb => onAuthStateChanged(auth, cb);

// Firebase does not re-emit the user after updateProfile, so signUp tells the
// UI when the display name has been saved.
const profileListeners = new Set();
export const onProfileUpdated = cb => {
  profileListeners.add(cb);
  return () => profileListeners.delete(cb);
};

export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

// Creates the account, sets the display name and stores a small profile.
// Passwords are handled by Firebase Auth only and are never written to the DB.
export const signUp = async ({ username, email, password, phone }) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: username });
  await set(child(userRef(user.uid), 'profile'), { username, email, phone });
  profileListeners.forEach(fn => fn());
  return user;
};

export const signOut = () => firebaseSignOut(auth);

export const resetPassword = email => sendPasswordResetEmail(auth, email);

// Permanently deletes the user's data and then the account itself (required
// by Google Play for apps that let people create an account).
export const deleteAccount = async user => {
  await remove(userRef(user.uid));
  await deleteUser(user);
};

// ---- lists & tasks ---------------------------------------------------------
// users/{uid}/lists/{listId}  -> {name, createdAt}
// users/{uid}/tasks/{listId}/{taskId} -> {name, time, done, createdAt}

const toArray = snapshot => {
  const value = snapshot.val() || {};
  return Object.keys(value).map(id => ({ id, ...value[id] }));
};

const newestFirst = (a, b) => b.createdAt - a.createdAt;

export const subscribeLists = (uid, cb) =>
  onValue(child(userRef(uid), 'lists'), snap =>
    cb(toArray(snap).sort(newestFirst)),
  );

export const addList = (uid, name) =>
  push(child(userRef(uid), 'lists'), { name, createdAt: Date.now() });

export const removeList = (uid, listId) =>
  Promise.all([
    remove(child(userRef(uid), `lists/${listId}`)),
    remove(child(userRef(uid), `tasks/${listId}`)),
  ]);

export const subscribeTasks = (uid, listId, cb) =>
  onValue(child(userRef(uid), `tasks/${listId}`), snap =>
    cb(toArray(snap).sort(newestFirst)),
  );

export const addTask = (uid, listId, { name, time }) =>
  push(child(userRef(uid), `tasks/${listId}`), {
    name,
    time: time || null,
    done: false,
    createdAt: Date.now(),
  });

export const setTaskDone = (uid, listId, taskId, done) =>
  set(child(userRef(uid), `tasks/${listId}/${taskId}/done`), done);

export const removeTask = (uid, listId, taskId) =>
  remove(child(userRef(uid), `tasks/${listId}/${taskId}`));
