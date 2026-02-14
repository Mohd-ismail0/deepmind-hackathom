import { Router, Request, Response, NextFunction } from 'express';
import * as geminiService from '../services/geminiService.js';
import * as templateStore from '../services/templateStore.js';
import * as sessionStore from '../services/sessionStore.js';
import * as automationStore from '../services/automationStore.js';
import * as chatHistoryStore from '../services/chatHistoryStore.js';
import { createError } from '../middleware/errorHandler.js';
import type { Attachment, UserDetails, AutomationTask, AutomationStep } from '../types.js';
import { runAutomation } from '../services/playwrightRunner.js';

const router = Router();

function parseIntentFromResponse(responseText: string): { cleanText: string; payload: { intent?: string; taskName?: string; data?: UserDetails } | null } {
  const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
  let cleanText = responseText;
  let payload: { intent?: string; taskName?: string; data?: UserDetails } | null = null;
  if (jsonMatch) {
    try {
      payload = JSON.parse(jsonMatch[1]);
      cleanText = responseText.replace(jsonMatch[0], '').trim();
    } catch {
      // ignore parse errors
    }
  }
  return { cleanText, payload };
}

function substituteStepValues(step: AutomationStep, userData: UserDetails): AutomationStep {
  if (!step.value) return step;
  const value = step.value.replace(/\{(\w+)\}/g, (_, key: string) => (userData[key] as string) ?? '');
  return { ...step, value };
}

router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, message, attachments = [] } = req.body as {
      sessionId?: string;
      message?: string;
      attachments?: Attachment[];
    };
    const sid = sessionId || crypto.randomUUID();
    const text = typeof message === 'string' ? message : '';
    const atts: Attachment[] = Array.isArray(attachments) ? attachments : [];

    const now = Date.now();
    if (text) {
      await chatHistoryStore.appendMessage(sid, { sender: 'user', text, timestamp: now });
    }

    let reviewData: UserDetails | null = null;
    if (atts.length > 0) {
      const extractedList = await Promise.all(atts.map((a) => geminiService.extractDocumentDetails(a)));
      reviewData = Object.assign({}, ...extractedList);
    }

    const responseText = await geminiService.sendMessageToGemini(sid, text, atts);
    const { cleanText, payload } = parseIntentFromResponse(responseText);

    await chatHistoryStore.appendMessage(sid, {
      sender: 'agent',
      text: cleanText,
      timestamp: Date.now(),
      ...(reviewData != null && { reviewData }),
    });

    let automation: { task: AutomationTask; status: string } | null = null;
    if (payload?.intent === 'start_automation') {
      const taskName = payload.taskName || 'Unknown Task';
      const existingData = await sessionStore.getCollectedData(sid);
      const finalData = { ...existingData, ...payload.data };
      await sessionStore.setCollectedData(sid, finalData);

      const template = await templateStore.findTemplateByTaskName(taskName);
      let task: AutomationTask;
      if (template) {
        const steps = template.steps.map((s) => substituteStepValues(s, finalData));
        task = {
          name: template.name,
          type: 'prerecorded',
          url: template.url,
          steps: steps as AutomationStep[],
        };
      } else {
        const url = await geminiService.findGovernmentUrl(taskName);
        const generatedSteps = await geminiService.generateAutomationSteps(taskName, url);
        task = {
          name: taskName,
          type: 'ai-navigated',
          url,
          steps: generatedSteps as AutomationStep[],
        };
      }
      automationStore.setAutomationRunning(sid, task);
      runAutomation(sid, task, finalData).catch((err) => {
        console.error('Automation run error:', err);
        automationStore.setAutomationFailed(sid, err.message || 'Automation failed');
      });
      automation = { task, status: 'running' };
    }

    res.json({
      success: true,
      data: {
        sessionId: sid,
        reply: cleanText,
        reviewData: reviewData ?? undefined,
        needInput: undefined,
        automation: automation ?? undefined,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/confirm-data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, data } = req.body as { sessionId?: string; data?: UserDetails };
    const sid = sessionId || crypto.randomUUID();
    if (!data || typeof data !== 'object') {
      throw createError('Missing or invalid data.', 'VALIDATION_ERROR', 400);
    }
    await sessionStore.setCollectedData(sid, data);

    const confirmationText = `I have verified the following details from the document: ${JSON.stringify(data)}. You may proceed with the next steps or automation.`;
    await chatHistoryStore.appendMessage(sid, {
      sender: 'user',
      text: 'Confirmed document data.',
      timestamp: Date.now(),
    });

    const responseText = await geminiService.sendMessageToGemini(sid, confirmationText, []);
    const { cleanText, payload } = parseIntentFromResponse(responseText);

    await chatHistoryStore.appendMessage(sid, {
      sender: 'agent',
      text: cleanText,
      timestamp: Date.now(),
    });

    let automation: { task: AutomationTask; status: string } | null = null;
    if (payload?.intent === 'start_automation') {
      const taskName = payload.taskName || 'Unknown Task';
      const existingData = await sessionStore.getCollectedData(sid);
      const finalData = { ...existingData, ...payload.data };
      await sessionStore.setCollectedData(sid, finalData);

      const template = await templateStore.findTemplateByTaskName(taskName);
      let task: AutomationTask;
      if (template) {
        const steps = template.steps.map((s) => substituteStepValues(s, finalData));
        task = {
          name: template.name,
          type: 'prerecorded',
          url: template.url,
          steps: steps as AutomationStep[],
        };
      } else {
        const url = await geminiService.findGovernmentUrl(taskName);
        const generatedSteps = await geminiService.generateAutomationSteps(taskName, url);
        task = {
          name: taskName,
          type: 'ai-navigated',
          url,
          steps: generatedSteps as AutomationStep[],
        };
      }
      automationStore.setAutomationRunning(sid, task);
      runAutomation(sid, task, finalData).catch((err) => {
        console.error('Automation run error:', err);
        automationStore.setAutomationFailed(sid, err.message || 'Automation failed');
      });
      automation = { task, status: 'running' };
    }

    res.json({
      success: true,
      data: {
        sessionId: sid,
        reply: cleanText,
        needInput: undefined,
        automation: automation ?? undefined,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
