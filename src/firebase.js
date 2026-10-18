import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase web config values are public identifiers, not secrets. Access is
// controlled by Authentication + the rules in database.rules.json.
// To use your own project, replace this object (see README, "Firebase").
const firebaseConfig = {
  apiKey: 'AIzaSyBTMUIY1tvkv0770bwFOg4WpbyLzbJ3PCU',
  authDomain: 'wha2do-swe632.firebaseapp.com',
  databaseURL: 'https://wha2do-swe632.firebaseio.com',
  projectId: 'wha2do-swe632',
  storageBucket: 'wha2do-swe632.appspot.com',
  messagingSenderId: '353111282999',
  appId: '1:353111282999:web:c065ff801730236cb3f6b2',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Keep users signed in between launches. initializeAuth may only run once, so
// fall back to getAuth when Fast Refresh re-evaluates this module.
const makeAuth = () => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    return getAuth(app);
  }
};

export const auth = makeAuth();
export const db = getDatabase(app);
