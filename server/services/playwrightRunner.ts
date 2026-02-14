import { chromium, type Browser, type Page } from 'playwright';
import type { AutomationTask, AutomationStep, UserDetails } from '../types.js';
import * as automationStore from './automationStore.js';
import { setCollectedData } from './sessionStore.js';

const STEP_TIMEOUT_MS = 30000;
const pendingInputResolvers = new Map<string, (value: string) => void>();

export function resolveAutomationInput(sessionId: string, input: string): boolean {
  const resolve = pendingInputResolvers.get(sessionId);
  if (!resolve) return false;
  pendingInputResolvers.delete(sessionId);
  automationStore.clearAutomationWaiting(sessionId);
  resolve(input);
  return true;
}

async function waitForUserInput(sessionId: string, promptText: string, responseKey: string): Promise<string> {
  automationStore.setAutomationWaitingInput(sessionId, promptText, responseKey);
  return new Promise<string>((resolve) => {
    const timeout = setTimeout(() => {
      if (pendingInputResolvers.has(sessionId)) {
        pendingInputResolvers.delete(sessionId);
        automationStore.setAutomationFailed(sessionId, 'Timeout waiting for user input');
        resolve('');
      }
    }, 120000); // 2 min wait for OTP
    pendingInputResolvers.set(sessionId, (value: string) => {
      clearTimeout(timeout);
      resolve(value);
    });
  });
}

async function executeStep(
  page: Page,
  step: AutomationStep,
  sessionId: string,
  userData: UserDetails
): Promise<string | null> {
  const { action, target, value, description, promptText, responseKey } = step;
  if (action === 'prompt_user') {
    const text = promptText || description;
    const key = responseKey || 'userInput';
    const input = await waitForUserInput(sessionId, text, key);
    return input;
  }
  if (action === 'visit') {
    const url = target.startsWith('http') ? target : value || target;
    await page.goto(url, { timeout: STEP_TIMEOUT_MS, waitUntil: 'domcontentloaded' });
    return null;
  }
  if (action === 'click') {
    await page.click(target, { timeout: STEP_TIMEOUT_MS });
    return null;
  }
  if (action === 'fill') {
    const val = (value || '').replace(/\{(\w+)\}/g, (_, k: string) => (userData[k] as string) ?? '');
    await page.fill(target, val, { timeout: STEP_TIMEOUT_MS });
    return null;
  }
  if (action === 'read' || action === 'verify' || action === 'upload') {
    await new Promise((r) => setTimeout(r, 500));
    return null;
  }
  return null;
}

export async function runAutomation(
  sessionId: string,
  task: AutomationTask,
  userData: UserDetails
): Promise<void> {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: process.env.NODE_ENV !== 'development',
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(STEP_TIMEOUT_MS);

    const steps = task.steps;
    for (let i = 0; i < steps.length; i++) {
      const state = automationStore.getAutomationState(sessionId);
      if (!state || (state.status !== 'running' && state.status !== 'waiting_input')) break;

      const step = steps[i];
      automationStore.setAutomationStep(sessionId, i);
      try {
        const screenshotBuffer = await page.screenshot({ type: 'png' }).catch(() => null);
        const screenshot = screenshotBuffer ? screenshotBuffer.toString('base64') : undefined;
        if (screenshot) automationStore.setAutomationStep(sessionId, i, screenshot);

        const userInput = await executeStep(page, step, sessionId, userData);
        if (userInput && step.responseKey) {
          await setCollectedData(sessionId, { [step.responseKey]: userInput });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        automationStore.setAutomationFailed(sessionId, `Step ${i + 1} failed: ${message}`);
        return;
      }
    }

    automationStore.setAutomationCompleted(sessionId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    automationStore.setAutomationFailed(sessionId, message);
  } finally {
    if (browser) await browser.close();
  }
}
