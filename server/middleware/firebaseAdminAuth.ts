import { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAuthInstance } from '../services/firebase.js';
import { createError } from './errorHandler.js';

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

export async function firebaseAdminAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const idToken =
      authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.headers['x-admin-token'] as string | undefined);
    if (!idToken) {
      next(createError('Missing authorization. Send Firebase ID token in Authorization: Bearer <token>', 'UNAUTHORIZED', 401));
      return;
    }
    const auth = getAuthInstance();
    const decoded = await auth.verifyIdToken(idToken);
    const isAdmin = (decoded as DecodedIdToken & { admin?: boolean }).admin === true;
    if (!isAdmin) {
      next(createError('Admin claim required.', 'FORBIDDEN', 403));
      return;
    }
    req.user = decoded;
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    next(createError(message, 'UNAUTHORIZED', 401));
  }
}
