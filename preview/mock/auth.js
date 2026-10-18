import {
  authState,
  createAccount,
  removeAccount,
  resetEmail,
  setUser,
  signIn,
} from './store';

const auth = authState;

export const getReactNativePersistence = () => ({});
export const initializeAuth = () => auth;
export const getAuth = () => auth;

export const onAuthStateChanged = (_auth, fn) => {
  auth.listeners.add(fn);
  setTimeout(() => fn(auth.currentUser), 0);
  return () => auth.listeners.delete(fn);
};
export const signInWithEmailAndPassword = (_auth, email, password) =>
  signIn(email, password);
export const createUserWithEmailAndPassword = (_auth, email, password) =>
  createAccount(email, password);
export const updateProfile = (user, { displayName }) => {
  user.displayName = displayName;
  return Promise.resolve();
};
export const signOut = () => {
  setUser(null);
  return Promise.resolve();
};
export const sendPasswordResetEmail = (_auth, email) => resetEmail(email);
export const deleteUser = user => removeAccount(user);
