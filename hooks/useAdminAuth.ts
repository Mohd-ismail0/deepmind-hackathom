import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { initFirebaseAuth, getFirebaseAuth } from '../services/firebaseAuth';

export interface AdminAuthState {
  user: User | null;
  ready: boolean;
}

export function useAdminAuth(): AdminAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      initFirebaseAuth();
      const auth = getFirebaseAuth();
      const unsub = auth.onAuthStateChanged((u) => {
        if (!cancelled) {
          setUser(u);
          setReady(true);
        }
      });
      return () => {
        cancelled = true;
        unsub();
      };
    } catch {
      if (!cancelled) {
        setUser(null);
        setReady(true);
      }
      return () => { cancelled = true; };
    }
  }, []);

  return { user, ready };
}
