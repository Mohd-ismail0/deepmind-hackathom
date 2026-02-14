import type { Attachment, UserDetails, AutomationTask } from '../types';

const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL;
  return typeof url === 'string' && url ? url.replace(/\/$/, '') : 'http://localhost:4000';
};

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

function assertOk(res: Response, body: { success?: boolean; error?: ApiError }): void {
  if (res.ok) return;
  const err = body.error || { code: 'UNKNOWN', message: res.statusText };
  const e = new Error(err.message) as Error & { code?: string; details?: unknown };
  e.code = err.code;
  e.details = err.details;
  throw e;
}

export interface ChatResponse {
  sessionId: string;
  reply: string;
  reviewData?: UserDetails;
  needInput?: string;
  automation?: { task: AutomationTask; status: string };
}

export async function postChat(
  sessionId: string,
  message: string,
  attachments: Attachment[] = []
): Promise<ChatResponse> {
  const res = await fetch(`${getBaseUrl()}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message, attachments }),
  });
  const body = await res.json();
  assertOk(res, body);
  return body.data;
}

export interface ConfirmDataResponse {
  sessionId: string;
  reply: string;
  needInput?: string;
  automation?: { task: AutomationTask; status: string };
}

export async function postConfirmData(
  sessionId: string,
  data: UserDetails
): Promise<ConfirmDataResponse> {
  const res = await fetch(`${getBaseUrl()}/api/v1/confirm-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, data }),
  });
  const body = await res.json();
  assertOk(res, body);
  return body.data;
}

export type AutomationStatusBackend = 'idle' | 'running' | 'waiting_input' | 'completed' | 'failed';

export interface AutomationStatusResponse {
  status: AutomationStatusBackend;
  currentStepIndex: number;
  task: AutomationTask | null;
  needInput: string | null;
  screenshotBase64: string | null;
  errorMessage: string | null;
}

export async function getAutomationStatus(sessionId: string): Promise<AutomationStatusResponse> {
  const res = await fetch(`${getBaseUrl()}/api/v1/automation/status/${encodeURIComponent(sessionId)}`);
  const body = await res.json();
  assertOk(res, body);
  return body.data;
}

export async function postAutomationInput(sessionId: string, input: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/api/v1/automation/input`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, input }),
  });
  const body = await res.json();
  assertOk(res, body);
}

const ADMIN_TOKEN_KEY = 'govauto_admin_token';

export function getAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function verifyAdminSecret(secret: string): Promise<string> {
  const res = await fetch(`${getBaseUrl()}/api/v1/admin/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret }),
  });
  const body = await res.json();
  assertOk(res, body);
  return body.token;
}

export interface Template {
  id: string;
  name: string;
  documentType: string;
  url: string;
  steps: { id: string; action: string; target: string; value?: string; description: string; promptText?: string; responseKey?: string }[];
  createdAt: string;
  updatedAt: string;
}

function adminHeaders(): HeadersInit {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchTemplates(): Promise<Template[]> {
  const res = await fetch(`${getBaseUrl()}/api/v1/templates`, { headers: adminHeaders() });
  const body = await res.json();
  assertOk(res, body);
  return body.data;
}

export async function fetchTemplate(id: string): Promise<Template> {
  const res = await fetch(`${getBaseUrl()}/api/v1/templates/${encodeURIComponent(id)}`, { headers: adminHeaders() });
  const body = await res.json();
  assertOk(res, body);
  return body.data;
}

export async function createTemplate(data: { name: string; documentType: string; url: string; steps: Template['steps'] }): Promise<Template> {
  const res = await fetch(`${getBaseUrl()}/api/v1/templates`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(data),
  });
  const body = await res.json();
  assertOk(res, body);
  return body.data;
}

export async function updateTemplate(id: string, data: Partial<{ name: string; documentType: string; url: string; steps: Template['steps'] }>): Promise<Template> {
  const res = await fetch(`${getBaseUrl()}/api/v1/templates/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(data),
  });
  const body = await res.json();
  assertOk(res, body);
  return body.data;
}

export async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/api/v1/templates/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  const body = await res.json();
  assertOk(res, body);
}
