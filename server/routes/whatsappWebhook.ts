import { Router, Request, Response, NextFunction } from 'express';
import * as geminiService from '../services/geminiService.js';

const router = Router();

/**
 * WhatsApp webhook: receives incoming messages, runs them through the same chat pipeline,
 * and would send the reply back via WhatsApp (stub - reply is logged only until provider is configured).
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as {
      from?: string;
      body?: string;
      message?: { from?: string; body?: string };
      [key: string]: unknown;
    };
    const from = body.from ?? body.message?.from ?? body.sender ?? 'unknown';
    const sessionId = `wa-${String(from).replace(/\D/g, '')}`;
    const message = (body.body ?? body.message?.body ?? body.text ?? '') as string;
    if (!message || typeof message !== 'string') {
      res.status(200).send('OK');
      return;
    }
    const reply = await geminiService.sendMessageToGemini(sessionId, message.trim(), []);
    console.log('[WhatsApp] Session:', sessionId, 'Reply:', reply.slice(0, 100) + (reply.length > 100 ? '...' : ''));
    res.status(200).send('OK');
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
    res.status(200).send('OK');
  }
});

export default router;
