import { FieldValue } from 'firebase-admin/firestore';
import { getFirestoreInstance } from './firebase.js';
import type { UserDetails } from '../types.js';

const SESSIONS_COLLECTION = 'sessions';

export interface SessionData {
  collectedData: UserDetails;
}

function docToSessionData(data: Record<string, unknown>): SessionData {
  const collectedData = (data.collectedData as Record<string, string>) ?? {};
  return { collectedData: collectedData as UserDetails };
}

export async function getSession(sessionId: string): Promise<SessionData | undefined> {
  const db = getFirestoreInstance();
  const doc = await db.collection(SESSIONS_COLLECTION).doc(sessionId).get();
  if (!doc.exists) return undefined;
  return docToSessionData(doc.data() as Record<string, unknown>);
}

export async function getOrCreateSession(sessionId: string): Promise<SessionData> {
  const existing = await getSession(sessionId);
  if (existing) return existing;
  const db = getFirestoreInstance();
  const now = FieldValue.serverTimestamp();
  await db.collection(SESSIONS_COLLECTION).doc(sessionId).set({
    collectedData: {},
    createdAt: now,
    updatedAt: now,
  });
  return { collectedData: {} };
}

export async function setCollectedData(sessionId: string, data: UserDetails): Promise<void> {
  const session = await getOrCreateSession(sessionId);
  const merged = { ...session.collectedData, ...data };
  const db = getFirestoreInstance();
  await db.collection(SESSIONS_COLLECTION).doc(sessionId).update({
    collectedData: merged,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function getCollectedData(sessionId: string): Promise<UserDetails> {
  const session = await getOrCreateSession(sessionId);
  return session.collectedData;
}
