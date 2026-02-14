import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { AutomationStep } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'templates.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DATABASE_PATH);
    fs.mkdirSync(dir, { recursive: true });
    db = new Database(DATABASE_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        documentType TEXT NOT NULL,
        url TEXT NOT NULL,
        steps TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);
  }
  return db;
}

export interface TemplateRow {
  id: string;
  name: string;
  documentType: string;
  url: string;
  steps: AutomationStep[];
  createdAt: string;
  updatedAt: string;
}

function rowToTemplate(row: { id: string; name: string; documentType: string; url: string; steps: string; createdAt: string; updatedAt: string }): TemplateRow {
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
  const rows = getDb().prepare('SELECT * FROM templates ORDER BY name').all() as {
    id: string;
    name: string;
    documentType: string;
    url: string;
    steps: string;
    createdAt: string;
    updatedAt: string;
  }[];
  return rows.map(rowToTemplate);
}

export function getTemplateById(id: string): TemplateRow | null {
  const row = getDb().prepare('SELECT * FROM templates WHERE id = ?').get(id) as
    | {
        id: string;
        name: string;
        documentType: string;
        url: string;
        steps: string;
        createdAt: string;
        updatedAt: string;
      }
    | undefined;
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
  getDb()
    .prepare(
      'INSERT INTO templates (id, name, documentType, url, steps, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(id, data.name, data.documentType, data.url, stepsJson, now, now);
  const row = getDb().prepare('SELECT * FROM templates WHERE id = ?').get(id) as {
    id: string;
    name: string;
    documentType: string;
    url: string;
    steps: string;
    createdAt: string;
    updatedAt: string;
  };
  return rowToTemplate(row);
}

export function updateTemplate(
  id: string,
  data: { name?: string; documentType?: string; url?: string; steps?: AutomationStep[] }
): TemplateRow | null {
  const existing = getTemplateById(id);
  if (!existing) return null;
  const name = data.name ?? existing.name;
  const documentType = data.documentType ?? existing.documentType;
  const url = data.url ?? existing.url;
  const steps = data.steps ?? existing.steps;
  const updatedAt = new Date().toISOString();
  getDb()
    .prepare('UPDATE templates SET name = ?, documentType = ?, url = ?, steps = ?, updatedAt = ? WHERE id = ?')
    .run(name, documentType, url, JSON.stringify(steps), updatedAt, id);
  return getTemplateById(id);
}

export function deleteTemplate(id: string): boolean {
  const result = getDb().prepare('DELETE FROM templates WHERE id = ?').run(id);
  return result.changes > 0;
}
