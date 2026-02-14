import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler.js';

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

export function adminAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!ADMIN_SECRET) {
    next(createError('Admin API is not configured (ADMIN_SECRET missing).', 'CONFIG_ERROR', 503));
    return;
  }
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.headers['x-admin-secret'] as string | undefined;
  if (token !== ADMIN_SECRET) {
    next(createError('Invalid or missing admin credentials.', 'UNAUTHORIZED', 401));
    return;
  }
  next();
}
