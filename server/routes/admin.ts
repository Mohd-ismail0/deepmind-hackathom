import { Router, Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/firebaseAdminAuth.js';

const router = Router();

router.get('/me', (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }
    res.json({
      success: true,
      data: {
        uid: user.uid,
        email: user.email ?? undefined,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
