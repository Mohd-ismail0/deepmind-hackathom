import { Router, Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler.js';

const router = Router();
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

router.post('/verify', (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!ADMIN_SECRET) {
      throw createError('Admin API is not configured (ADMIN_SECRET missing).', 'CONFIG_ERROR', 503);
    }
    const { secret } = req.body || {};
    if (secret !== ADMIN_SECRET) {
      throw createError('Invalid admin secret.', 'UNAUTHORIZED', 401);
    }
    res.json({ success: true, token: ADMIN_SECRET });
  } catch (err) {
    next(err);
  }
});

export default router;
