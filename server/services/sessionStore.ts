import type { UserDetails } from '../types.js';

export interface SessionData {
  collectedData: UserDetails;
}

const sessions = new Map<string, SessionData>();

export function getSession(sessionId: string): SessionData | undefined {
  return sessions.get(sessionId);
}

export function getOrCreateSession(sessionId: string): SessionData {
  let s = sessions.get(sessionId);
  if (!s) {
    s = { collectedData: {} };
    sessions.set(sessionId, s);
  }
  return s;
}

export function setCollectedData(sessionId: string, data: UserDetails): void {
  const s = getOrCreateSession(sessionId);
  s.collectedData = { ...s.collectedData, ...data };
}

export function getCollectedData(sessionId: string): UserDetails {
  return getOrCreateSession(sessionId).collectedData;
}
