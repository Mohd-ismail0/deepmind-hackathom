import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { AutomationStep } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_DIR = process.env.DATABASE_PATH
  ? path.dirname(process.env.DATABASE_PATH)
  : path.join(__dirname, '..', '..', 'data');
const FILE_PATH = process.env.DATABASE_PATH
  ? process.env.DATABASE_PATH.replace(/\.db$/, '.json')
  : path.join(DATA_DIR, 'templates.json');

export interface TemplateRow {
  id: string;
  name: string;
  documentType: string;
  url: string;
  steps: AutomationStep[];
  createdAt: string;
  updatedAt: string;
}

interface StoredTemplate {
  id: string;
  name: string;
  documentType: string;
  url: string;
  steps: string;
  createdAt: string;
  updatedAt: string;
}

function loadAll(): StoredTemplate[] {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
  try {
    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : data.templates ? data.templates : [];
  } catch {
    return [];
  }
}

function saveAll(rows: StoredTemplate[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE_PATH, JSON.stringify(rows, null, 2), 'utf-8');
}

function rowToTemplate(row: StoredTemplate): TemplateRow {
  return {
    id: row.id,
    name: row.name,
    documentType: row.documentType,
    url: row.url,
    steps: JSON.parse(row.steps) as AutomationStep[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function listTemplates(): TemplateRow[] {
  const rows = loadAll();
  return rows.sort((a, b) => a.name.localeCompare(b.name)).map(rowToTemplate);
}

export function getTemplateById(id: string): TemplateRow | null {
  const rows = loadAll();
  const row = rows.find((r) => r.id === id);
  return row ? rowToTemplate(row) : null;
}

export function findTemplateByTaskName(taskName: string): TemplateRow | null {
  const normalized = taskName.toLowerCase().trim().replace(/\s+/g, ' ');
  const templates = listTemplates();
  for (const t of templates) {
    const nameNorm = t.name.toLowerCase().trim().replace(/\s+/g, ' ');
    const docNorm = t.documentType.toLowerCase().trim().replace(/\s+/g, ' ');
    if (normalized.includes(docNorm) || nameNorm.includes(normalized) || normalized.includes(nameNorm)) {
      return t;
    }
  }
  return null;
}

export function createTemplate(data: {
  name: string;
  documentType: string;
  url: string;
  steps: AutomationStep[];
}): TemplateRow {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const stepsJson = JSON.stringify(data.steps);
  const row: StoredTemplate = {
    id,
    name: data.name,
    documentType: data.documentType,
    url: data.url,
    steps: stepsJson,
    createdAt: now,
    updatedAt: now,
  };
  const rows = loadAll();
  rows.push(row);
  saveAll(rows);
  return rowToTemplate(row);
}

export function updateTemplate(
  id: string,
  data: { name?: string; documentType?: string; url?: string; steps?: AutomationStep[] }
): TemplateRow | null {
  const existing = getTemplateById(id);
  if (!existing) return null;
  const rows = loadAll();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const updatedAt = new Date().toISOString();
  rows[idx] = {
    id,
    name: data.name ?? existing.name,
    documentType: data.documentType ?? existing.documentType,
    url: data.url ?? existing.url,
    steps: JSON.stringify(data.steps ?? existing.steps),
    createdAt: rows[idx].createdAt,
    updatedAt,
  };
  saveAll(rows);
  return rowToTemplate(rows[idx]);
}

export function deleteTemplate(id: string): boolean {
  const rows = loadAll();
  const next = rows.filter((r) => r.id !== id);
  if (next.length === rows.length) return false;
  saveAll(next);
  return true;
}
