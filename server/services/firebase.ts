import { initializeApp, getApps, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function getCredential() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return undefined; // SDK will use default credential from file
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
    return undefined;
  }
  const key = privateKey.replace(/\\n/g, '\n');
  return cert({ projectId, clientEmail, privateKey: key } as ServiceAccount);
}

function initFirebase() {
  if (getApps().length > 0) {
    return;
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp();
    return;
  }
  const credential = getCredential();
  if (credential) {
    initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    throw new Error(
      'Firebase not configured: set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
  }
}

let firestore: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

export function getFirestoreInstance(): ReturnType<typeof getFirestore> {
  if (!firestore) {
    initFirebase();
    firestore = getFirestore();
  }
  return firestore;
}

export function getAuthInstance(): ReturnType<typeof getAuth> {
  if (!auth) {
    initFirebase();
    auth = getAuth();
  }
  return auth;
}
