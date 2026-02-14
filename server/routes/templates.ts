import { Router, Request, Response, NextFunction } from 'express';
import * as templateStore from '../services/templateStore.js';
import { createError } from '../middleware/errorHandler.js';
import type { AutomationStep } from '../types.js';

const router = Router();

router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = templateStore.listTemplates();
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = templateStore.getTemplateById(req.params.id);
    if (!template) {
      throw createError('Template not found.', 'TEMPLATE_NOT_FOUND', 404);
    }
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, documentType, url, steps } = req.body;
    if (!name || !documentType || !url || !Array.isArray(steps)) {
      throw createError(
        'Missing or invalid fields: name, documentType, url, steps (array) required.',
        'VALIDATION_ERROR',
        400,
        { name: !!name, documentType: !!documentType, url: !!url, steps: Array.isArray(steps) }
      );
    }
    const template = templateStore.createTemplate({
      name: String(name).trim(),
      documentType: String(documentType).trim(),
      url: String(url).trim(),
      steps: steps as AutomationStep[],
    });
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, documentType, url, steps } = req.body;
    const template = templateStore.updateTemplate(req.params.id, {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(documentType !== undefined && { documentType: String(documentType).trim() }),
      ...(url !== undefined && { url: String(url).trim() }),
      ...(steps !== undefined && Array.isArray(steps) && { steps: steps as AutomationStep[] }),
    });
    if (!template) {
      throw createError('Template not found.', 'TEMPLATE_NOT_FOUND', 404);
    }
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = templateStore.deleteTemplate(req.params.id);
    if (!deleted) {
      throw createError('Template not found.', 'TEMPLATE_NOT_FOUND', 404);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
