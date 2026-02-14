import type { DocumentData, Timestamp } from 'firebase-admin/firestore';
import { getFirestoreInstance } from './firebase.js';
import type { UserDetails } from '../types.js';

const SESSIONS_COLLECTION = 'sessions';
const MESSAGES_SUBCOLLECTION = 'messages';

export type MessageSender = 'user' | 'agent' | 'system';

export interface StoredMessage {
  sender: MessageSender;
  text: string;
  timestamp: number;
  attachments?: unknown[];
  reviewData?: UserDetails;
}

function toIso(val: unknown): string {
  if (val && typeof (val as Timestamp).toDate === 'function') {
    return (val as Timestamp).toDate().toISOString();
  }
  if (val instanceof Date) return val.toISOString();
  return new Date().toISOString();
}

export async function appendMessage(
  sessionId: string,
  message: StoredMessage
): Promise<void> {
  const db = getFirestoreInstance();
  const ref = db
    .collection(SESSIONS_COLLECTION)
    .doc(sessionId)
    .collection(MESSAGES_SUBCOLLECTION);
  await ref.add({
    sender: message.sender,
    text: message.text,
    timestamp: message.timestamp,
    ...(message.attachments != null && { attachments: message.attachments }),
    ...(message.reviewData != null && { reviewData: message.reviewData }),
  });
}

export interface MessageRecord {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: number;
  attachments?: unknown[];
  reviewData?: UserDetails;
}

function docToMessage(id: string, data: DocumentData): MessageRecord {
  const ts = data.timestamp;
  const timestamp =
    typeof ts === 'number'
      ? ts
      : ts && typeof (ts as Timestamp).toDate === 'function'
        ? (ts as Timestamp).toDate().getTime()
        : Date.now();
  return {
    id,
    sender: (data.sender as MessageSender) ?? 'user',
    text: (data.text as string) ?? '',
    timestamp,
    ...(data.attachments != null && { attachments: data.attachments as unknown[] }),
    ...(data.reviewData != null && { reviewData: data.reviewData as UserDetails }),
  };
}

export async function getMessages(
  sessionId: string,
  limit = 100
): Promise<MessageRecord[]> {
  const db = getFirestoreInstance();
  const snapshot = await db
    .collection(SESSIONS_COLLECTION)
    .doc(sessionId)
    .collection(MESSAGES_SUBCOLLECTION)
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs
    .map((doc) => docToMessage(doc.id, doc.data()))
    .reverse();
}
