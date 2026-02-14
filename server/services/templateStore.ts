import type { DocumentData, Timestamp } from 'firebase-admin/firestore';
import { getFirestoreInstance } from './firebase.js';
import type { AutomationStep } from '../types.js';

const TEMPLATES_COLLECTION = 'templates';

export interface TemplateRow {
  id: string;
  name: string;
  documentType: string;
  url: string;
  steps: AutomationStep[];
  createdAt: string;
  updatedAt: string;
}

function toIso(val: unknown): string {
  if (val && typeof (val as Timestamp).toDate === 'function') {
    return (val as Timestamp).toDate().toISOString();
  }
  if (val instanceof Date) return val.toISOString();
  return new Date().toISOString();
}

function docToTemplate(id: string, data: DocumentData): TemplateRow {
  const steps = data.steps as AutomationStep[];
  return {
    id,
    name: (data.name as string) ?? '',
    documentType: (data.documentType as string) ?? '',
    url: (data.url as string) ?? '',
    steps: Array.isArray(steps) ? steps : [],
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function listTemplates(): Promise<TemplateRow[]> {
  const db = getFirestoreInstance();
  const snapshot = await db.collection(TEMPLATES_COLLECTION).orderBy('name').get();
  return snapshot.docs.map((doc) => docToTemplate(doc.id, doc.data()));
}

export async function getTemplateById(id: string): Promise<TemplateRow | null> {
  const db = getFirestoreInstance();
  const doc = await db.collection(TEMPLATES_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return docToTemplate(doc.id, doc.data()!);
}

export async function findTemplateByTaskName(taskName: string): Promise<TemplateRow | null> {
  const normalized = taskName.toLowerCase().trim().replace(/\s+/g, ' ');
  const templates = await listTemplates();
  for (const t of templates) {
    const nameNorm = t.name.toLowerCase().trim().replace(/\s+/g, ' ');
    const docNorm = t.documentType.toLowerCase().trim().replace(/\s+/g, ' ');
    if (normalized.includes(docNorm) || nameNorm.includes(normalized) || normalized.includes(nameNorm)) {
      return t;
    }
  }
  return null;
}

export async function createTemplate(data: {
  name: string;
  documentType: string;
  url: string;
  steps: AutomationStep[];
}): Promise<TemplateRow> {
  const db = getFirestoreInstance();
  const now = new Date();
  const ref = await db.collection(TEMPLATES_COLLECTION).add({
    name: data.name,
    documentType: data.documentType,
    url: data.url,
    steps: data.steps,
    createdAt: now,
    updatedAt: now,
  });
  const doc = await ref.get();
  return docToTemplate(doc.id, doc.data()!);
}

export async function updateTemplate(
  id: string,
  data: { name?: string; documentType?: string; url?: string; steps?: AutomationStep[] }
): Promise<TemplateRow | null> {
  const existing = await getTemplateById(id);
  if (!existing) return null;
  const db = getFirestoreInstance();
  const update: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (data.name !== undefined) update.name = data.name;
  if (data.documentType !== undefined) update.documentType = data.documentType;
  if (data.url !== undefined) update.url = data.url;
  if (data.steps !== undefined) update.steps = data.steps;
  await db.collection(TEMPLATES_COLLECTION).doc(id).update(update);
  return getTemplateById(id);
}

export async function deleteTemplate(id: string): Promise<boolean> {
  const db = getFirestoreInstance();
  const doc = await db.collection(TEMPLATES_COLLECTION).doc(id).get();
  if (!doc.exists) return false;
  await db.collection(TEMPLATES_COLLECTION).doc(id).delete();
  return true;
}
