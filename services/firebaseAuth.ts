import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, type User } from 'firebase/auth';

let app: FirebaseApp | null = null;

function getConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;
  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      'Firebase config missing. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID'
    );
  }
  return { apiKey, authDomain, projectId, appId };
}

export function initFirebaseAuth(): FirebaseApp {
  if (app) return app;
  app = initializeApp(getConfig());
  return app;
}

export function getFirebaseAuth() {
  initFirebaseAuth();
  return getAuth(app!);
}

export async function signInAdmin(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signOutAdmin(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

export async function getAdminIdToken(forceRefresh = true): Promise<string | null> {
  try {
    initFirebaseAuth();
    const auth = getAuth(app!);
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}
