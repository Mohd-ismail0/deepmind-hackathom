import { Router, Request, Response, NextFunction } from 'express';
import * as automationStore from '../services/automationStore.js';
import { resolveAutomationInput } from '../services/playwrightRunner.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/status/:sessionId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = Array.isArray(req.params.sessionId) ? req.params.sessionId[0] : req.params.sessionId;
    const state = automationStore.getAutomationState(sessionId);
    if (!state) {
      res.json({
        success: true,
        data: {
          status: 'idle',
          currentStepIndex: 0,
          task: null,
          needInput: null,
          screenshotBase64: null,
          errorMessage: null,
        },
      });
      return;
    }
    res.json({
      success: true,
      data: {
        status: state.status,
        currentStepIndex: state.currentStepIndex,
        task: state.task,
        needInput: state.needInput,
        screenshotBase64: state.screenshotBase64,
        errorMessage: state.errorMessage,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/input', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, input } = req.body as { sessionId?: string; input?: string };
    if (!sessionId || input === undefined) {
      throw createError('Missing sessionId or input.', 'VALIDATION_ERROR', 400);
    }
    const accepted = resolveAutomationInput(sessionId, String(input));
    if (!accepted) {
      throw createError('No automation is waiting for input for this session.', 'INVALID_STATE', 400);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
