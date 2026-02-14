import type { AutomationTask } from '../types.js';

export type AutomationRunStatus = 'idle' | 'running' | 'waiting_input' | 'completed' | 'failed';

export interface AutomationState {
  status: AutomationRunStatus;
  task: AutomationTask | null;
  currentStepIndex: number;
  needInput: string | null; // promptText when waiting for user
  responseKey: string | null; // key to store user reply
  screenshotBase64: string | null;
  errorMessage: string | null;
}

const automationBySession = new Map<string, AutomationState>();

export function getAutomationState(sessionId: string): AutomationState | undefined {
  return automationBySession.get(sessionId);
}

export function getOrCreateAutomationState(sessionId: string): AutomationState {
  let s = automationBySession.get(sessionId);
  if (!s) {
    s = {
      status: 'idle',
      task: null,
      currentStepIndex: 0,
      needInput: null,
      responseKey: null,
      screenshotBase64: null,
      errorMessage: null,
    };
    automationBySession.set(sessionId, s);
  }
  return s;
}

export function setAutomationRunning(sessionId: string, task: AutomationTask): void {
  const s = getOrCreateAutomationState(sessionId);
  s.status = 'running';
  s.task = task;
  s.currentStepIndex = 0;
  s.needInput = null;
  s.responseKey = null;
  s.errorMessage = null;
  automationBySession.set(sessionId, s);
}

export function setAutomationStep(sessionId: string, stepIndex: number, screenshotBase64?: string): void {
  const s = automationBySession.get(sessionId);
  if (!s) return;
  s.currentStepIndex = stepIndex;
  if (screenshotBase64 !== undefined) s.screenshotBase64 = screenshotBase64;
  automationBySession.set(sessionId, s);
}

export function setAutomationWaitingInput(sessionId: string, promptText: string, responseKey: string): void {
  const s = automationBySession.get(sessionId);
  if (!s) return;
  s.status = 'waiting_input';
  s.needInput = promptText;
  s.responseKey = responseKey;
  automationBySession.set(sessionId, s);
}

export function setAutomationCompleted(sessionId: string): void {
  const s = automationBySession.get(sessionId);
  if (!s) return;
  s.status = 'completed';
  s.needInput = null;
  s.responseKey = null;
  automationBySession.set(sessionId, s);
}

export function setAutomationFailed(sessionId: string, errorMessage: string): void {
  const s = automationBySession.get(sessionId);
  if (!s) return;
  s.status = 'failed';
  s.errorMessage = errorMessage;
  s.needInput = null;
  s.responseKey = null;
  automationBySession.set(sessionId, s);
}

export function clearAutomationWaiting(sessionId: string): void {
  const s = automationBySession.get(sessionId);
  if (!s) return;
  s.needInput = null;
  s.responseKey = null;
  if (s.status === 'waiting_input') s.status = 'running';
  automationBySession.set(sessionId, s);
}
