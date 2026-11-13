import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';

export function openDatabase(databaseFile = process.env.DATABASE_PATH || './data/lomi-contacts.sqlite') {
  const fullPath = path.resolve(databaseFile);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(fullPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL,
      organization TEXT NOT NULL DEFAULT '', service TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS inquiries_created_at ON inquiries(created_at);
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      csrf_token TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL, excerpt TEXT NOT NULL, body TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'World', language TEXT NOT NULL DEFAULT 'en',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS articles_status_date ON articles(status,created_at);
    CREATE TABLE IF NOT EXISTS ad_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT NOT NULL, name TEXT NOT NULL,
      email TEXT NOT NULL, website_url TEXT NOT NULL DEFAULT '', message TEXT NOT NULL,
      placement TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT NOT NULL, headline TEXT NOT NULL,
      description TEXT NOT NULL, link_url TEXT NOT NULL,
      placement TEXT NOT NULL CHECK(placement IN ('homepage','news','sidebar')),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','paused')),
      payment_verified INTEGER NOT NULL DEFAULT 0 CHECK(payment_verified IN (0,1)),
      start_date TEXT NOT NULL, end_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS campaigns_active ON campaigns(placement,status,start_date,end_date);
    CREATE TABLE IF NOT EXISTS portfolio_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, category TEXT NOT NULL,
      description TEXT NOT NULL, case_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export function provisionAdmin(db) {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  // Only bootstrap on the very first run; credentials can be removed afterward.
  const count = db.prepare('SELECT COUNT(*) AS count FROM admin_users').get().count;
  if (count > 0) return;
  if (!email && !password) return;
  if (!email || password.length < 12 || !email.includes('@')) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) must both be configured.');
  }
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, Buffer.from(salt, 'hex'), 64).toString('hex');
  db.prepare('INSERT INTO admin_users(email,password_hash) VALUES (?,?)').run(email, `${salt}:${derived}`);
  console.log('Initial administrator account created. Remove ADMIN_PASSWORD from .env after setup.');
}
