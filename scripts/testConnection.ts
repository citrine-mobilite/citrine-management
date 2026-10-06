import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

async function testConnection() {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  console.log('Testing with config:', config.projectId, 'db:', config.firestoreDatabaseId);

  const app = !getApps().length ? initializeApp(config) : getApp();
  const auth = getAuth(app);
  const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });

  console.log('Testing Anonymous Auth...');
  try {
    const userCredential = await signInAnonymously(auth);
    console.log('Anonymous signin success! UID:', userCredential.user.uid);
  } catch (authErr: any) {
    console.log('Anonymous auth failed:', authErr?.message || authErr?.code);
  }

  console.log('Testing Firestore Read on company_settings/default...');
  try {
    const snap = await getDoc(doc(db, 'company_settings', 'default'));
    console.log('Firestore Read success! Exists:', snap.exists());
    if (snap.exists()) console.log('Data:', snap.data());
  } catch (readErr: any) {
    console.log('Firestore Read failed:', readErr?.message || readErr?.code);
  }

  console.log('Testing Firestore Write on company_settings/test...');
  try {
    await setDoc(doc(db, 'company_settings', 'test'), { test: true, timestamp: Date.now() });
    console.log('Firestore Write success!');
  } catch (writeErr: any) {
    console.log('Firestore Write failed:', writeErr?.message || writeErr?.code);
  }
  
  process.exit(0);
}

testConnection().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
