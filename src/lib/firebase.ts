import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, setLogLevel, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import config from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(config) : getApp();

// Suppress non-fatal connection warning logs in browser console
setLogLevel('silent');

let firestoreDb: any;
try {
  let isIframe = false;
  try {
    isIframe = typeof window !== 'undefined' && (window.self !== window.top || window.location.hostname.includes('run.app'));
  } catch {
    isIframe = true;
  }
  const firestoreSettings = {
    experimentalAutoDetectLongPolling: true,
    experimentalForceLongPolling: isIframe,
  };
  const isCustomDb = config.firestoreDatabaseId && 
    config.firestoreDatabaseId !== '' && 
    config.firestoreDatabaseId !== '(default)' && 
    config.firestoreDatabaseId !== 'default';

  firestoreDb = isCustomDb
    ? initializeFirestore(app, firestoreSettings, config.firestoreDatabaseId)
    : initializeFirestore(app, firestoreSettings);
} catch (e) {
  const isCustomDb = config.firestoreDatabaseId && 
    config.firestoreDatabaseId !== '' && 
    config.firestoreDatabaseId !== '(default)' && 
    config.firestoreDatabaseId !== 'default';

  firestoreDb = isCustomDb
    ? getFirestore(app, config.firestoreDatabaseId)
    : getFirestore(app);
}

// Enable offline persistence
try {
  enableIndexedDbPersistence(firestoreDb).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time.
      console.warn('Persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required to enable persistence
      console.warn('Persistence failed: Browser not supported.');
    }
  });
} catch (e) {
  console.error('Error enabling persistence:', e);
}

export const db = firestoreDb;
export const auth = getAuth(app);

// Attempt anonymous session if not already logged in to ensure valid request.auth in Firestore
try {
  if (typeof window !== 'undefined' && !auth.currentUser) {
    signInAnonymously(auth).catch(() => {
      // Non-fatal if anonymous auth is not enabled on the Firebase console
    });
  }
} catch (e) {}

export default app;
