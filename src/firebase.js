import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

// Firebase web config values are public identifiers, not secrets. Access is
// controlled by Authentication + the rules in database.rules.json.
const firebaseConfig = {
  apiKey: 'AIzaSyBTMUIY1tvkv0770bwFOg4WpbyLzbJ3PCU',
  authDomain: 'wha2do-swe632.firebaseapp.com',
  databaseURL: 'https://wha2do-swe632.firebaseio.com',
  projectId: 'wha2do-swe632',
  storageBucket: 'wha2do-swe632.appspot.com',
  messagingSenderId: '353111282999',
  appId: '1:353111282999:web:c065ff801730236cb3f6b2',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
