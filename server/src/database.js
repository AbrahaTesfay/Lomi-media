import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export function openDatabase(databaseFile = process.env.DATABASE_PATH || './data/lomi-contacts.sqlite') {
  const fullPath = path.resolve(databaseFile);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(fullPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      organization TEXT NOT NULL DEFAULT '',
      service TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS inquiries_created_at ON inquiries(created_at);
  `);
  return db;
}
